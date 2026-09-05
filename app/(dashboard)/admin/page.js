"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Badge, Button, Card, Col, Container, Row, Spinner, Table } from "react-bootstrap";
import { Activity, CreditCard, GitCommit, RefreshCw, Shield, Users } from "react-feather";
import { apiClient } from "lib/apiClient";
import { useAuth } from "lib/auth-context";
import { useApiResource } from "hooks/useApiResource";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function formatMinorAmount(value, currency = "USD") {
  if (value === null || value === undefined) return "—";
  const amount = Number(value);
  const normalizedCurrency = String(currency || "USD").toUpperCase();
  if (!Number.isSafeInteger(amount)) return `${normalizedCurrency} ${value}`;
  const zeroDecimalCurrencies = new Set(["BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"]);
  const divisor = zeroDecimalCurrencies.has(normalizedCurrency) ? 1 : 100;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: normalizedCurrency }).format(amount / divisor);
  } catch {
    return `${normalizedCurrency} ${(amount / divisor).toFixed(divisor === 1 ? 0 : 2)}`;
  }
}

function renderDetails(details) {
  if (!details || typeof details !== "object") return "—";
  const safeKeys = new Set([
    "provider", "provider_status", "status", "plan_code", "cadence", "currency_code",
    "amount_minor", "refunded_amount_minor", "disputed_amount_minor", "error_code",
    "processing_attempts", "next_attempt_at", "reconciliation_attempts", "reconciliation_error",
  ]);
  const entries = Object.entries(details).filter(([key]) => safeKeys.has(key));
  if (!entries.length) return "—";
  return entries.map(([key, value]) => `${key.replaceAll("_", " ")}: ${String(value ?? "—")}`).join(" · ");
}

function MetricCard({ title, value, icon: Icon, variant = "primary" }) {
  return (
    <Col xl={3} md={6} className="mb-4">
      <Card className="h-100">
        <Card.Body className="d-flex align-items-center justify-content-between">
          <div>
            <p className="text-muted mb-1">{title}</p>
            <h2 className="mb-0">{value}</h2>
          </div>
          <div className={`text-${variant}`} aria-hidden="true">
            <Icon size={28} />
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(search);
  const [additional, setAdditional] = useState({
    users: { items: [], pagination: null },
    payments: { items: [], pagination: null },
    activity: { items: [], pagination: null },
  });
  const [loadingMoreActivity, setLoadingMoreActivity] = useState(false);
  const [loadingMoreUsers, setLoadingMoreUsers] = useState(false);
  const [loadingMorePayments, setLoadingMorePayments] = useState(false);
  const [retryingWebhookId, setRetryingWebhookId] = useState("");
  const [localError, setLocalError] = useState("");
  const resource = useApiResource(`admin-dashboard:${user?.role || "unknown"}:${search}`, async () => {
    if (user?.role !== "admin") return null;
    const [overview, alerts, users, payments, activity] = await Promise.all([
      apiClient.getAdminOverview(),
      apiClient.getAdminAlerts(),
      apiClient.getAdminUsers({ limit: 8, search: search || undefined }),
      apiClient.getAdminPayments({ limit: 8 }),
      apiClient.getAdminActivity({ limit: 12 }),
    ]);
    return { overview, alerts, users, payments, activity };
  });
  const baseData = user?.role === "admin" ? resource.data : null;
  const data = baseData && {
    ...baseData,
    users: { items: [...baseData.users.items, ...additional.users.items], pagination: additional.users.pagination || baseData.users.pagination },
    payments: { items: [...baseData.payments.items, ...additional.payments.items], pagination: additional.payments.pagination || baseData.payments.pagination },
    activity: { items: [...baseData.activity.items, ...additional.activity.items], pagination: additional.activity.pagination || baseData.activity.pagination },
  };
  const loading = user?.role === "admin" && (resource.isLoading || resource.isRefreshing);
  const error = localError || resource.error?.message || "";
  const loadAdminData = async () => {
    setLocalError("");
    setAdditional({ users: { items: [], pagination: null }, payments: { items: [], pagination: null }, activity: { items: [], pagination: null } });
    await resource.refresh().catch(() => undefined);
  };

  const loadMoreActivity = async () => {
    if (!data?.activity.pagination.has_more || loadingMoreActivity) return;
    setLoadingMoreActivity(true);
    try {
      const nextPage = await apiClient.getAdminActivity({ limit: 12, offset: data.activity.items.length });
      setAdditional((current) => ({ ...current, activity: { items: [...current.activity.items, ...nextPage.items], pagination: nextPage.pagination } }));
    } catch (requestError) {
      setLocalError(requestError?.message || "We could not load more activity.");
    } finally {
      setLoadingMoreActivity(false);
    }
  };

  const loadMoreUsers = async () => {
    if (!data?.users.pagination.has_more || loadingMoreUsers) return;
    setLoadingMoreUsers(true);
    try {
      const nextPage = await apiClient.getAdminUsers({ limit: 8, offset: data.users.items.length });
      setAdditional((current) => ({ ...current, users: { items: [...current.users.items, ...nextPage.items], pagination: nextPage.pagination } }));
    } catch (requestError) {
      setLocalError(requestError?.message || "We could not load more users.");
    } finally {
      setLoadingMoreUsers(false);
    }
  };

  const loadMorePayments = async () => {
    if (!data?.payments.pagination.has_more || loadingMorePayments) return;
    setLoadingMorePayments(true);
    try {
      const nextPage = await apiClient.getAdminPayments({ limit: 8, offset: data.payments.items.length });
      setAdditional((current) => ({ ...current, payments: { items: [...current.payments.items, ...nextPage.items], pagination: nextPage.pagination } }));
    } catch (requestError) {
      setLocalError(requestError?.message || "We could not load more payments.");
    } finally {
      setLoadingMorePayments(false);
    }
  };

  const retryWebhook = async (providerEventId) => {
    if (!providerEventId || retryingWebhookId) return;
    setRetryingWebhookId(providerEventId);
    setLocalError("");
    try {
      await apiClient.retryAdminBillingWebhook(providerEventId);
      await loadAdminData();
    } catch (requestError) {
      setLocalError(requestError?.message || "We could not retry the billing webhook.");
    } finally {
      setRetryingWebhookId("");
    }
  };

  if (authLoading) {
    return <Container fluid className="p-6 text-center"><Spinner animation="border" role="status"><span className="visually-hidden">Loading your access…</span></Spinner></Container>;
  }

  if (user?.role !== "admin") {
    return (
      <Container fluid className="p-6">
        <h1 className="h2">Admin dashboard</h1>
        <Alert variant="danger">You do not have permission to view this dashboard.</Alert>
      </Container>
    );
  }

  const applySearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput.trim()) params.set("search", searchInput.trim());
    else params.delete("search");
    router.replace(`?${params.toString()}`);
  };

  const overview = data?.overview;
  const stats = [
    { title: "Total users", value: overview?.users.total ?? 0, icon: Users },
    { title: "New users (30 days)", value: overview?.users.new_last_30_days ?? 0, icon: Shield, variant: "success" },
    { title: "Active subscriptions", value: overview?.subscriptions.active ?? 0, icon: CreditCard, variant: "info" },
    { title: "Commits tracked", value: overview?.commits.total ?? 0, icon: GitCommit, variant: "warning" },
  ];

  return (
    <Container fluid className="p-6">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-6">
        <div>
          <h1 className="h2 mb-1">Admin dashboard</h1>
          <p className="text-muted mb-0">Monitor users, payments, and platform activity.</p>
        </div>
        <Button variant="outline-primary" onClick={loadAdminData} disabled={loading}>
          <RefreshCw size={16} className="me-2" aria-hidden="true" />
          {loading ? "Refreshing…" : "Refresh data"}
        </Button>
      </div>

      {error && <Alert variant="danger" role="alert">{error}</Alert>}

      <form className="d-flex flex-wrap gap-2 mb-4" onSubmit={applySearch} role="search" aria-label="Search admin users">
        <label className="visually-hidden" htmlFor="admin-user-search">Search users</label>
        <input id="admin-user-search" className="form-control" style={{ maxWidth: "28rem" }} value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search by email, username, or ID" />
        <Button type="submit" variant="outline-secondary">Search</Button>
        {search && <Button type="button" variant="link" onClick={() => { setSearchInput(""); router.replace("?"); }}>Clear</Button>}
      </form>

      <Row>
        {stats.map((stat) => <MetricCard key={stat.title} {...stat} />)}
        <Col xl={6} md={6} className="mb-4">
          <Card className="h-100"><Card.Body>
            <p className="text-muted mb-1">Captured payment volume</p>
            {overview?.payments?.by_currency?.length > 1 ? overview.payments.by_currency.map((total) => (
              <div key={total.currency_code} className="mb-2">
                <h2 className="mb-0">{formatMinorAmount(total.gross_amount_minor, total.currency_code)}</h2>
                <small className="text-muted">Net: {formatMinorAmount(total.net_amount_minor, total.currency_code)} · {total.transaction_count} captured</small>
              </div>
            )) : (
              <>
                <h2 className="mb-1">{overview?.payments?.gross_amount_minor === null ? "No captured payments" : formatMinorAmount(overview?.payments?.gross_amount_minor ?? "0", overview?.payments?.currency_code || "USD")}</h2>
                <small className="text-muted">{overview?.payments?.transaction_count ?? 0} captured · {overview?.payments?.all_transaction_count ?? 0} recorded</small>
                <small className="d-block text-muted">Net after refunds/disputes: {formatMinorAmount(overview?.payments?.net_amount_minor ?? "0", overview?.payments?.currency_code || "USD")}</small>
              </>
            )}
          </Card.Body></Card>
        </Col>
        <Col xl={6} md={6} className="mb-4">
          <Card className="h-100"><Card.Body>
            <p className="text-muted mb-1">Reports created (30 days)</p>
            <h2 className="mb-1">{overview?.reports.created_last_30_days ?? 0}</h2>
            <small className="text-muted">Updated {formatDate(overview?.generated_at)}</small>
          </Card.Body></Card>
        </Col>
      </Row>

      {data?.alerts?.alerts?.length ? <Alert variant="warning" role="status">
        <strong>Operator attention</strong>
        <ul className="mb-0 mt-2">{data.alerts.alerts.map((item) => <li key={item.code}>{item.message} ({item.count})</li>)}</ul>
      </Alert> : null}

      <Row>
        <Col xl={4} md={6} className="mb-4"><Card className="h-100"><Card.Body><p className="text-muted mb-1">Checkout attempts</p><h2>{overview?.billing?.checkout_requests?.total ?? 0}</h2><small className="text-muted">Completed: {overview?.billing?.checkout_requests?.by_status?.completed ?? 0} · Pending: {overview?.billing?.checkout_requests?.by_status?.pending ?? 0} · Failed: {overview?.billing?.checkout_requests?.by_status?.failed ?? 0}</small></Card.Body></Card></Col>
        <Col xl={4} md={6} className="mb-4"><Card className="h-100"><Card.Body><p className="text-muted mb-1">Webhook processing</p><h2>{overview?.billing?.webhooks?.total ?? 0}</h2><small className="text-muted">Processed: {overview?.billing?.webhooks?.processed ?? 0} · Pending: {overview?.billing?.webhooks?.pending ?? 0} · Failed: {overview?.billing?.webhooks?.failed ?? 0}</small><small className="d-block text-muted">Retryable: {overview?.billing?.webhooks?.retryable ?? 0} · Exhausted: {overview?.billing?.webhooks?.exhausted ?? 0}</small></Card.Body></Card></Col>
        <Col xl={4} md={12} className="mb-4"><Card className="h-100"><Card.Body><p className="text-muted mb-1">Refunds and disputes</p><h2>{overview?.billing?.adjustments?.total ?? 0}</h2><small className="text-muted">Approved refunds: {overview?.billing?.adjustments?.approved_refunds ?? 0} · Active disputes: {overview?.billing?.adjustments?.active_disputes ?? 0}</small></Card.Body></Card></Col>
      </Row>

      <Row>
        <Col xl={7} className="mb-6">
          <Card>
            <Card.Header><h2 className="h4 mb-0">Recent activity</h2></Card.Header>
            <Table responsive hover className="mb-0">
              <caption className="visually-hidden">Recent platform activity</caption>
              <thead><tr><th scope="col">Activity</th><th scope="col">User</th><th scope="col">Time</th><th scope="col">Details</th></tr></thead>
              <tbody>
                {(data?.activity.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td><Badge bg="light" text="dark" className="me-2">{item.source}</Badge>{item.action}</td>
                    <td>{item.user?.email || item.actor?.email || "System"}</td>
                    <td>{formatDate(item.occurred_at)}</td>
                    <td>
                      {item.details && Object.keys(item.details).length ? <details><summary>View details</summary><p className="small text-break mt-2 mb-0">{renderDetails(item.details)}</p></details> : "—"}
                      {item.source === "billing_webhook" && item.details?.processed === false && item.details?.provider_event_id && <Button size="sm" variant="outline-danger" className="mt-2" onClick={() => retryWebhook(item.details.provider_event_id)} disabled={Boolean(retryingWebhookId)}>{retryingWebhookId === item.details.provider_event_id ? "Retrying…" : "Retry webhook"}</Button>}
                    </td>
                  </tr>
                ))}
                {!loading && !(data?.activity.items?.length) && <tr><td colSpan="4" className="text-muted">No activity found.</td></tr>}
              </tbody>
            </Table>
            {data?.activity.pagination.has_more && <Card.Footer className="text-center"><Button variant="link" onClick={loadMoreActivity} disabled={loadingMoreActivity}>{loadingMoreActivity ? "Loading…" : "Load more activity"}</Button></Card.Footer>}
          </Card>
        </Col>

        <Col xl={5} className="mb-6">
          <Card>
            <Card.Header><h2 className="h4 mb-0">Users</h2></Card.Header>
            <Table responsive hover className="mb-0">
              <caption className="visually-hidden">Registered users</caption>
              <thead><tr><th scope="col">User</th><th scope="col">Role</th><th scope="col">Plan</th><th scope="col">Status</th><th scope="col">Joined</th></tr></thead>
              <tbody>
                {(data?.users.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.email || item.id}</td>
                    <td><Badge bg={item.role === "admin" ? "danger" : "secondary"}>{item.role}</Badge></td>
                    <td>
                      {item.subscription?.plan_code || "Free"}{item.subscription?.cadence ? ` · ${item.subscription.cadence}` : ""}
                      {item.subscription?.current_period_end && <small className="d-block text-muted">Ends {formatDate(item.subscription.current_period_end)}</small>}
                    </td>
                    <td>
                      {item.subscription?.status || "No subscription"}{item.subscription?.cancel_at_period_end ? " · Cancels at period end" : ""}
                      {item.subscription?.grace_period_end && <small className="d-block text-muted">Grace ends {formatDate(item.subscription.grace_period_end)}</small>}
                    </td>
                    <td>{formatDate(item.created_at)}</td>
                  </tr>
                ))}
                {!loading && !(data?.users.items?.length) && <tr><td colSpan="5" className="text-muted">No users found.</td></tr>}
              </tbody>
            </Table>
            {data?.users.pagination.has_more && <Card.Footer className="text-center"><Button variant="link" onClick={loadMoreUsers} disabled={loadingMoreUsers}>{loadingMoreUsers ? "Loading…" : "Load more users"}</Button></Card.Footer>}
          </Card>
        </Col>
      </Row>

      <Card className="mb-6">
        <Card.Header><h2 className="h4 mb-0">Payment transactions</h2></Card.Header>
        <Table responsive hover className="mb-0">
          <caption className="visually-hidden">Recent payment transactions</caption>
          <thead><tr><th scope="col">Transaction</th><th scope="col">User</th><th scope="col">Amount</th><th scope="col">Status</th><th scope="col">Refunded</th><th scope="col">Disputed</th><th scope="col">Aftermath</th><th scope="col">Date</th></tr></thead>
          <tbody>
            {(data?.payments.items ?? []).map((item) => (
              <tr key={item.provider_transaction_id}>
                <td>{item.provider_transaction_id}<small className="d-block text-muted">Provider: {item.provider_status}</small></td>
                <td>{item.user?.email || "—"}</td>
                <td>{formatMinorAmount(item.amount_minor, item.currency_code)}</td>
                <td>{item.status}</td>
                <td>{formatMinorAmount(item.refunded_amount_minor, item.currency_code)}</td>
                <td>{formatMinorAmount(item.disputed_amount_minor, item.currency_code)}</td>
                <td>{item.adjustments?.length || item.checkout_attempts?.length ? <details><summary>View</summary><div className="small mt-2">{item.checkout_attempts?.map((attempt) => <div key={`${attempt.plan_code}-${attempt.created_at}`}>Checkout: {attempt.plan_code} · {attempt.cadence} · {attempt.status}{attempt.reconciliation_error ? ` · ${attempt.reconciliation_error}` : ""}{attempt.reconciliation_attempts ? ` · reconciliation attempts: ${attempt.reconciliation_attempts}` : ""}</div>)}{item.adjustments?.map((adjustment) => <div key={adjustment.provider_adjustment_id}>{adjustment.action} · {adjustment.status} · {formatMinorAmount(adjustment.amount_minor, adjustment.currency_code || item.currency_code)}</div>)}</div></details> : "—"}</td>
                <td>{formatDate(item.provider_created_at || item.created_at)}</td>
              </tr>
            ))}
            {!loading && !(data?.payments.items?.length) && <tr><td colSpan="8" className="text-muted">No payment transactions found.</td></tr>}
          </tbody>
        </Table>
        {data?.payments.pagination.has_more && <Card.Footer className="text-center"><Button variant="link" onClick={loadMorePayments} disabled={loadingMorePayments}>{loadingMorePayments ? "Loading…" : "Load more payments"}</Button></Card.Footer>}
      </Card>

      <p className="text-muted small"><Activity size={14} className="me-1" aria-hidden="true" />Admin views are recorded for audit purposes.</p>
    </Container>
  );
}
