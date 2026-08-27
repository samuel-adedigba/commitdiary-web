"use client";
import { useEffect, useState } from "react";
import { Card, Button, Alert, Badge, ProgressBar } from "react-bootstrap";
import { getEntitlements, createCheckout, createBillingPortal, type Entitlements } from "../../lib/apiClient";

export default function BillingSettings() {
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [actionLoading, setActionLoading] = useState<string|null>(null);

  useEffect(() => { load(); }, []);
  async function load() {
    try { setLoading(true); setError(null); const data = await getEntitlements(); setEntitlements(data); } catch(e:any){ setError(e.message||'Failed to load billing'); } finally { setLoading(false); }
  }
  async function handleCheckout(plan_code: string, cadence: 'monthly'|'annual'='monthly') {
    try { setActionLoading(plan_code); const { url } = await createCheckout(plan_code, cadence); window.location.href = url; } catch(e:any){ setError(e.message); setActionLoading(null); }
  }
  async function handlePortal() {
    try { setActionLoading('portal'); const { url } = await createBillingPortal(); window.location.href = url; } catch(e:any){ setError(e.message); setActionLoading(null); }
  }
  if (loading) return <Card><Card.Body>Loading billing...</Card.Body></Card>;
  if (!entitlements) return <Alert variant="danger">{error||'No billing data'}</Alert>;
  const usagePct = entitlements.limits.ai_reports ? Math.round((entitlements.usage.ai_reports_reserved / entitlements.limits.ai_reports)*100) : 0;
  const isActive = entitlements.access_active;
  return (
    <Card className="border shadow-sm">
      <Card.Header className="bg-white d-flex justify-content-between align-items-center">
        <div><h5 className="mb-0">Billing & Plan</h5><small className="text-muted">Manage your CommitDiary subscription</small></div>
        <Badge bg={isActive?'success': entitlements.status==='past_due'?'warning':'secondary'}>{entitlements.plan_name} — {entitlements.status}</Badge>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger" dismissible onClose={()=>setError(null)}>{error}</Alert>}
        {!isActive && <Alert variant="warning">Your plan is not active. Hosted features require an active subscription. <a href="/pricing">View plans</a></Alert>}
        {entitlements.cancel_at_period_end && <Alert variant="info">Your subscription will not renew. Access remains until {entitlements.current_period_end ? new Date(entitlements.current_period_end).toLocaleDateString() : 'period end'}.</Alert>}
        {entitlements.grace_period_end && entitlements.status==='past_due' && <Alert variant="warning">Payment failed. Grace period until {new Date(entitlements.grace_period_end).toLocaleDateString()}. Update payment to keep access.</Alert>}

        <div className="mb-3">
          <strong>Usage this period (from {entitlements.usage_period_start})</strong>
          <div className="d-flex justify-content-between"><small>AI reports: {entitlements.usage.ai_reports_reserved} / {entitlements.limits.ai_reports || '—'}</small><small>{usagePct}%</small></div>
          <ProgressBar now={Math.min(usagePct,100)} variant={usagePct>90?'danger':usagePct>70?'warning':'primary'} style={{height:'8px'}} />
          <small className="text-muted">Synced commits: {entitlements.usage.synced_commits} · Discord deliveries: {entitlements.usage.discord_deliveries}</small>
        </div>
        <div className="mb-3">
          <small className="text-muted">Limits: {entitlements.limits.repositories} repos · {entitlements.limits.ai_reports} AI reports/month · {entitlements.limits.discord_webhooks} webhook(s) · {entitlements.limits.hosted_history_days ? `${entitlements.limits.hosted_history_days}d history` : 'unlimited history'}</small>
          {entitlements.current_period_end && <div><small>Next billing: {new Date(entitlements.current_period_end).toLocaleDateString()}</small></div>}
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {!isActive && <>
            <Button variant="primary" disabled={!!actionLoading} onClick={()=>handleCheckout('founding_solo')}>{actionLoading==='founding_solo'?'...':'Get Founding Solo $5'}</Button>
            <Button variant="outline-primary" disabled={!!actionLoading} onClick={()=>handleCheckout('solo')}>{actionLoading==='solo'?'...':'Get Solo $8'}</Button>
            <Button variant="outline-secondary" disabled={!!actionLoading} onClick={()=>handleCheckout('pro')}>{actionLoading==='pro'?'...':'Get Pro $15'}</Button>
          </>}
          {isActive && <Button variant="outline-primary" disabled={!!actionLoading} onClick={handlePortal}>{actionLoading==='portal'?'...':'Manage billing'}</Button>}
          <Button variant="link" onClick={load}>Refresh</Button>
        </div>
      </Card.Body>
    </Card>
  );
}
