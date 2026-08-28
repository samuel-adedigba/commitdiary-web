"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, Container, Row, Spinner, Table } from "react-bootstrap";
import { Activity, CreditCard, GitCommit, RefreshCw, Shield, Users } from "react-feather";
import { apiClient } from "lib/apiClient";
import { useAuth } from "lib/auth-context";

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
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: normalizedCurrency }).format(amount / 100);
  } catch {
    return `${normalizedCurrency} ${(amount / 100).toFixed(2)}`;
  }
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMoreActivity, setLoadingMoreActivity] = useState(false);
  const [loadingMoreUsers, setLoadingMoreUsers] = useState(false);
  const [loadingMorePayments, setLoadingMorePayments] = useState(false);
  const [error, setError] = useState("");

  const loadAdminData = useCallback(async () => {
    if (user?.role !== "admin") return;
    setLoading(true);
    setError("");
    try {
      const [overview, users, payments, activity] = await Promise.all([
        apiClient.getAdminOverview(),
        apiClient.getAdminUsers({ limit: 8 }),
        apiClient.getAdminPayments({ limit: 8 }),
        apiClient.getAdminActivity({ limit: 12 }),
      ]);
      setData({ overview, users, payments, activity });
    } catch (requestError) {
      setError(requestError?.message || "We could not load the admin dashboard. Try again.");
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  const loadMoreActivity = async () => {
    if (!data?.activity.pagination.has_more || loadingMoreActivity) return;
    setLoadingMoreActivity(true);
    try {
      const nextPage = await apiClient.getAdminActivity({ limit: 12, offset: data.activity.items.length });
      setData((current) => current ? {
        ...current,
        activity: {
          items: [...current.activity.items, ...nextPage.items],
          pagination: nextPage.pagination,
        },
      } : current);
    } catch (requestError) {
      setError(requestError?.message || "We could not load more activity.");
    } finally {
      setLoadingMoreActivity(false);
    }
  };

  const loadMoreUsers = async () => {
    if (!data?.users.pagination.has_more || loadingMoreUsers) return;
    setLoadingMoreUsers(true);
    try {
      const nextPage = await apiClient.getAdminUsers({ limit: 8, offset: data.users.items.length });
      setData((current) => current ? {
        ...current,
        users: { items: [...current.users.items, ...nextPage.items], pagination: nextPage.pagination },
      } : current);
    } catch (requestError) {
      setError(requestError?.message || "We could not load more users.");
    } finally {
      setLoadingMoreUsers(false);
    }
  };

  const loadMorePayments = async () => {
    if (!data?.payments.pagination.has_more || loadingMorePayments) return;
    setLoadingMorePayments(true);
    try {
      const nextPage = await apiClient.getAdminPayments({ limit: 8, offset: data.payments.items.length });
      setData((current) => current ? {
        ...current,
        payments: { items: [...current.payments.items, ...nextPage.items], pagination: nextPage.pagination },
      } : current);
    } catch (requestError) {
      setError(requestError?.message || "We could not load more payments.");
    } finally {
      setLoadingMorePayments(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

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

      <Row>
        {stats.map((stat) => <MetricCard key={stat.title} {...stat} />)}
        <Col xl={6} md={6} className="mb-4">
          <Card className="h-100"><Card.Body>
            <p className="text-muted mb-1">Payment volume</p>
            <h2 className="mb-1">{formatMinorAmount(overview?.payments.gross_amount_minor ?? "0")}</h2>
            <small className="text-muted">{overview?.payments.transaction_count ?? 0} transactions</small>
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
                    <td>{item.details && Object.keys(item.details).length ? <details><summary>View details</summary><pre className="small text-break mt-2 mb-0">{JSON.stringify(item.details, null, 2)}</pre></details> : "—"}</td>
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
          <thead><tr><th scope="col">Transaction</th><th scope="col">User</th><th scope="col">Amount</th><th scope="col">Status</th><th scope="col">Date</th></tr></thead>
          <tbody>
            {(data?.payments.items ?? []).map((item) => (
              <tr key={item.provider_transaction_id}><td>{item.provider_transaction_id}</td><td>{item.user?.email || "—"}</td><td>{formatMinorAmount(item.amount_minor, item.currency_code)}</td><td>{item.status}</td><td>{formatDate(item.provider_created_at || item.created_at)}</td></tr>
            ))}
            {!loading && !(data?.payments.items?.length) && <tr><td colSpan="5" className="text-muted">No payment transactions found.</td></tr>}
          </tbody>
        </Table>
        {data?.payments.pagination.has_more && <Card.Footer className="text-center"><Button variant="link" onClick={loadMorePayments} disabled={loadingMorePayments}>{loadingMorePayments ? "Loading…" : "Load more payments"}</Button></Card.Footer>}
      </Card>

      <p className="text-muted small"><Activity size={14} className="me-1" aria-hidden="true" />Admin views are recorded for audit purposes.</p>
    </Container>
  );
}
