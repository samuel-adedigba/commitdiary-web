"use client";

import { useState, useEffect } from "react";
import type { ComponentType } from "react";
import {
  Card,
  Form,
  Button,
  Alert,
  Badge,
  Collapse,
  ListGroup,
} from "react-bootstrap";
import {
  FiAlertTriangle,
  FiBarChart2,
  FiBell,
  FiBookOpen,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiChevronRight,
  FiCopy,
  FiEye,
  FiEyeOff,
  FiSend,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import {
  fetchWebhookSettings,
  updateWebhookSettings,
  testWebhook,
  deleteWebhookSettings,
  fetchWebhookLogs,
  type WebhookSettings as WebhookSettingsType,
  type WebhookLog,
} from "../../lib/apiClient";

export default function WebhookSettings() {
  const AlertTriangleIcon = FiAlertTriangle as ComponentType<{
    className?: string;
    "aria-hidden"?: boolean;
    size?: number;
  }>;
  const BarChartIcon = FiBarChart2 as ComponentType<{
    className?: string;
    "aria-hidden"?: boolean;
    size?: number;
  }>;
  const BellIcon = FiBell as ComponentType<{
    className?: string;
    "aria-hidden"?: boolean;
    size?: number;
  }>;
  const BookOpenIcon = FiBookOpen as ComponentType<{
    className?: string;
    "aria-hidden"?: boolean;
    size?: number;
  }>;
  const CheckIcon = FiCheck as ComponentType<{
    className?: string;
    "aria-hidden"?: boolean;
    size?: number;
  }>;
  const CheckCircleIcon = FiCheckCircle as ComponentType<{
    className?: string;
    "aria-hidden"?: boolean;
    size?: number;
  }>;
  const ChevronDownIcon = FiChevronDown as ComponentType<{
    className?: string;
    "aria-hidden"?: boolean;
    size?: number;
  }>;
  const ChevronRightIcon = FiChevronRight as ComponentType<{
    className?: string;
    "aria-hidden"?: boolean;
    size?: number;
  }>;
  const CopyIcon = FiCopy as ComponentType<{
    className?: string;
    "aria-hidden"?: boolean;
    size?: number;
  }>;
  const EyeIcon = FiEye as ComponentType<{
    className?: string;
    "aria-hidden"?: boolean;
    size?: number;
  }>;
  const EyeOffIcon = FiEyeOff as ComponentType<{
    className?: string;
    "aria-hidden"?: boolean;
    size?: number;
  }>;
  const SendIcon = FiSend as ComponentType<{
    className?: string;
    "aria-hidden"?: boolean;
    size?: number;
  }>;
  const TrashIcon = FiTrash2 as ComponentType<{
    className?: string;
    "aria-hidden"?: boolean;
    size?: number;
  }>;
  const XIcon = FiX as ComponentType<{
    className?: string;
    "aria-hidden"?: boolean;
    size?: number;
  }>;
  const [settings, setSettings] = useState<WebhookSettingsType | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "report_completed",
    "report_failed",
    "backfill_started",
    "backfill_completed",
    "backfill_failed",
    "sync_completed",
    "repo_enabled",
  ]);

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const availableEvents = [
    {
      value: "report_completed",
      label: "Report Completed",
      description: "When a commit report is successfully generated",
    },
    {
      value: "report_failed",
      label: "Report Failed",
      description: "When report generation fails",
    },
    {
      value: "backfill_started",
      label: "Backfill Started",
      description: "When automatic backfill begins for a repository",
    },
    {
      value: "backfill_completed",
      label: "Backfill Completed",
      description: "When backfill completes successfully",
    },
    {
      value: "backfill_failed",
      label: "Backfill Failed",
      description: "When backfill encounters errors",
    },
    {
      value: "sync_completed",
      label: "Sync Completed",
      description: "When commit sync completes",
    },
    {
      value: "repo_enabled",
      label: "Repository Enabled",
      description: "When auto-reports are enabled for a repository",
    },
  ];

  // Load existing settings
  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await fetchWebhookSettings();
      if (data.configured) {
        setSettings(data);
        setWebhookUrl(data.discord_webhook_url || "");
        setEnabled(data.enabled ?? true);
        setSelectedEvents(data.events || selectedEvents);
      }
    } catch (err) {}
  }

  async function handleSave() {
    if (!webhookUrl.trim()) {
      setError("Please enter a Discord webhook URL");
      return;
    }

    // Validate Discord webhook URL format
    const webhookPattern =
      /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
    if (!webhookPattern.test(webhookUrl)) {
      setError(
        "Invalid Discord webhook URL format. Please check the URL and try again.",
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const result = await updateWebhookSettings({
        discord_webhook_url: webhookUrl,
        enabled,
        events: selectedEvents,
      });

      setSettings(result.settings);
      setSuccess(result.message);

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save webhook settings",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleTest() {
    try {
      setTesting(true);
      setError(null);
      setSuccess(null);

      const result = await testWebhook();

      if (result.success) {
        setSuccess(
          "Test webhook delivered successfully! Check your Discord channel.",
        );
      } else {
        setError(`Test failed: ${result.error || "Unknown error"}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to test webhook");
    } finally {
      setTesting(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Are you sure you want to delete your webhook settings? This cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await deleteWebhookSettings();

      // Reset state
      setSettings(null);
      setWebhookUrl("");
      setEnabled(true);
      setSelectedEvents([
        "report_completed",
        "report_failed",
        "backfill_started",
        "backfill_completed",
        "backfill_failed",
        "sync_completed",
        "repo_enabled",
      ]);

      setSuccess("Webhook settings deleted successfully");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete webhook settings",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadLogs() {
    try {
      const data = await fetchWebhookLogs({ limit: 50 });
      setLogs(data.logs);
      setShowLogs(true);
    } catch (err) {
      setError("Failed to load delivery logs");
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setSuccess("Copied to clipboard!");
    setTimeout(() => setSuccess(null), 2000);
  }

  function toggleEvent(eventValue: string) {
    setSelectedEvents((prev) =>
      prev.includes(eventValue)
        ? prev.filter((e) => e !== eventValue)
        : [...prev, eventValue],
    );
  }

  return (
    <Card className="border shadow-sm">
      <Card.Header className="bg-white">
        <h5 className="mb-0 d-flex align-items-center gap-2">
          <BellIcon aria-hidden={true} />
          <span>Discord Webhook Notifications</span>
        </h5>
        <small className="text-muted">
          Receive real-time commit report notifications in your Discord server
        </small>
      </Card.Header>
      <Card.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            <AlertTriangleIcon className="me-2" aria-hidden={true} />
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
            <CheckCircleIcon className="me-2" aria-hidden={true} />
            {success}
          </Alert>
        )}

        {/* How to get Discord webhook instructions */}
        <div className="mb-4">
          <Button
            variant="link"
            onClick={() => setShowInstructions(!showInstructions)}
            className="p-0 text-decoration-none"
          >
            <BookOpenIcon className="me-2" aria-hidden={true} />
            How to get your Discord Webhook URL
            {showInstructions ? (
              <ChevronDownIcon className="ms-2" aria-hidden={true} />
            ) : (
              <ChevronRightIcon className="ms-2" aria-hidden={true} />
            )}
          </Button>

          <Collapse in={showInstructions}>
            <Card className="mt-2 bg-light">
              <Card.Body>
                <h6>Creating a Discord Webhook:</h6>
                <ol className="mb-0">
                  <li>
                    Open your Discord server and go to{" "}
                    <strong>Server Settings</strong>
                  </li>
                  <li>
                    Navigate to <strong>Integrations</strong> →{" "}
                    <strong>Webhooks</strong>
                  </li>
                  <li>
                    Click <strong>New Webhook</strong> (or{" "}
                    <strong>Create Webhook</strong>)
                  </li>
                  <li>
                    Give it a name (e.g., &quot;CommitDiary Notifications&quot;)
                  </li>
                  <li>
                    Select the channel where you want to receive notifications
                  </li>
                  <li>
                    Click <strong>Copy Webhook URL</strong>
                  </li>
                  <li>Paste the URL below and save</li>
                </ol>
                <Alert variant="info" className="mt-3 mb-0">
                  <small>
                    <strong>Note:</strong> The webhook URL should look like:
                    <br />
                    <code>
                      https://discord.com/api/webhooks/123456789/abcdef...
                    </code>
                  </small>
                </Alert>
              </Card.Body>
            </Card>
          </Collapse>
        </div>

        {/* Enable/Disable Toggle */}
        <Form.Group className="mb-3">
          <Form.Check
            type="switch"
            id="webhook-enabled"
            label="Enable Discord Notifications"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
        </Form.Group>

        {/* Webhook URL Input */}
        <Form.Group className="mb-3">
          <Form.Label>Discord Webhook URL *</Form.Label>
          <Form.Control
            type="url"
            placeholder="https://discord.com/api/webhooks/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            disabled={loading}
          />
          <Form.Text className="text-muted">
            Your Discord webhook URL from server settings
          </Form.Text>
        </Form.Group>

        {/* Event Subscriptions */}
        <Form.Group className="mb-3">
          <Form.Label>Notification Events</Form.Label>
          <div className="border rounded p-3">
            {availableEvents.map((event) => (
              <Form.Check
                key={event.value}
                type="checkbox"
                id={`event-${event.value}`}
                label={
                  <div>
                    <strong>{event.label}</strong>
                    <br />
                    <small className="text-muted">{event.description}</small>
                  </div>
                }
                checked={selectedEvents.includes(event.value)}
                onChange={() => toggleEvent(event.value)}
                className="mb-2"
              />
            ))}
          </div>
          <Form.Text className="text-muted">
            Select which events you want to receive notifications for
          </Form.Text>
        </Form.Group>

        {/* Webhook Secret (if configured) */}
        {settings?.webhook_secret && (
          <Form.Group className="mb-3">
            <Form.Label>Webhook Secret (for verification)</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control
                type={showSecret ? "text" : "password"}
                value={settings.webhook_secret}
                readOnly
              />
              <Button
                variant="outline-secondary"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? (
                  <>
                    <EyeOffIcon className="me-1" aria-hidden={true} /> Hide
                  </>
                ) : (
                  <>
                    <EyeIcon className="me-1" aria-hidden={true} /> Show
                  </>
                )}
              </Button>
              <Button
                variant="outline-primary"
                onClick={() => copyToClipboard(settings.webhook_secret)}
              >
                <CopyIcon className="me-1" aria-hidden={true} /> Copy
              </Button>
            </div>
            <Form.Text className="text-muted">
              This secret is used to verify webhook authenticity. Keep it
              secure.
            </Form.Text>
          </Form.Group>
        )}

        {/* Statistics (if configured) */}
        {settings?.stats && (
          <Card className="mb-3 bg-light">
            <Card.Body>
              <h6>Webhook Statistics</h6>
              <div className="row">
                <div className="col-md-4">
                  <small className="text-muted">Total Deliveries</small>
                  <div>
                    <strong>{settings.stats.total_deliveries || 0}</strong>
                  </div>
                </div>
                <div className="col-md-4">
                  <small className="text-muted">Last Success</small>
                  <div>
                    {settings.stats.last_success_at ? (
                      <Badge bg="success">
                        {new Date(
                          settings.stats.last_success_at,
                        ).toLocaleString()}
                      </Badge>
                    ) : (
                      <Badge bg="secondary">Never</Badge>
                    )}
                  </div>
                </div>
                <div className="col-md-4">
                  <small className="text-muted">Failure Count</small>
                  <div>
                    <Badge
                      bg={
                        settings.stats.failure_count > 0 ? "warning" : "success"
                      }
                    >
                      {settings.stats.failure_count || 0}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="d-flex gap-2 flex-wrap">
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={loading || !webhookUrl || selectedEvents.length === 0}
          >
            {loading
              ? "Saving..."
              : settings?.configured
                ? "Update Settings"
                : "Save Settings"}
          </Button>

          {settings?.configured && (
            <>
              <Button
                variant="outline-primary"
                onClick={handleTest}
                disabled={testing || !enabled}
              >
                {testing ? (
                  "Sending..."
                ) : (
                  <>
                    <SendIcon className="me-2" aria-hidden={true} /> Send Test
                  </>
                )}
              </Button>

              <Button variant="outline-secondary" onClick={loadLogs}>
                <BarChartIcon className="me-2" aria-hidden={true} /> View
                Delivery Logs
              </Button>

              <Button
                variant="outline-danger"
                onClick={handleDelete}
                disabled={loading}
              >
                <TrashIcon className="me-2" aria-hidden={true} /> Delete
                Settings
              </Button>
            </>
          )}
        </div>

        {/* Delivery Logs */}
        {showLogs && logs.length > 0 && (
          <Card className="mt-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Recent Deliveries</span>
              <Button variant="sm" size="sm" onClick={() => setShowLogs(false)}>
                <XIcon aria-hidden={true} />
              </Button>
            </Card.Header>
            <ListGroup
              variant="flush"
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
              {logs.map((log) => (
                <ListGroup.Item key={log.id}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <Badge
                        bg={log.success ? "success" : "danger"}
                        className="me-2"
                      >
                        {log.success ? (
                          <CheckIcon size={12} aria-hidden={true} />
                        ) : (
                          <XIcon size={12} aria-hidden={true} />
                        )}
                      </Badge>
                      <strong>{log.event_type}</strong>
                      {log.status_code && (
                        <Badge bg="secondary" className="ms-2">
                          HTTP {log.status_code}
                        </Badge>
                      )}
                      {log.error_message && (
                        <div className="text-danger mt-1">
                          <small>{log.error_message}</small>
                        </div>
                      )}
                    </div>
                    <small className="text-muted">
                      {new Date(log.created_at).toLocaleString()}
                    </small>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        )}
      </Card.Body>
    </Card>
  );
}
