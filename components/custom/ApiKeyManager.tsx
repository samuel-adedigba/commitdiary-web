"use client";

import { useState, useEffect } from "react";
import type { ComponentType } from "react";
import { Alert, Badge, Button, Card, Form } from "react-bootstrap";
import { FiAlertTriangle } from "react-icons/fi";
import {
  fetchApiKeys,
  generateApiKey,
  revokeApiKey,
  type ApiKey,
} from "/lib/apiClient";

export default function ApiKeyManager() {
  const AlertTriangleIcon = FiAlertTriangle as ComponentType<{
    className?: string;
    "aria-hidden"?: boolean;
  }>;
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<ApiKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing API keys on mount
  useEffect(() => {
    async function loadKeys() {
      try {
        const existingKeys = await fetchApiKeys();
        setKeys(existingKeys);
      } catch (err) {
        // Don't show error for initial fetch - user might not be authenticated yet
      }
    }
    loadKeys();
  }, []);

  async function handleGenerateKey() {
    if (!newKeyName.trim()) {
      setError("Please enter a name for the API key");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const key = await generateApiKey(newKeyName);
      setGeneratedKey(key);
      setKeys((prev) => [...prev, key]);
      setNewKeyName("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate API key",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRevokeKey(keyId: string) {
    if (
      !confirm(
        "Are you sure you want to revoke this API key? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await revokeApiKey(keyId);
      setKeys((prev) =>
        prev.map((k) =>
          k.id === keyId ? { ...k, revoked_at: new Date().toISOString() } : k,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke API key");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  }

  return (
    <div className="api-key-manager">
      <div className="api-key-intro mb-4">
        <h3 className="mb-2">Connect your developer tools</h3>
        <p className="text-muted mb-0">
          Generate API keys for automation, CI/CD pipelines, or headless agents.
        </p>
      </div>

      {/* Generated Key Modal */}
      {generatedKey && (
        <div className="api-key-generated mb-4">
          <h4 className="mb-2 d-flex align-items-center gap-2">
            <AlertTriangleIcon aria-hidden={true} />
            Save Your API Key
          </h4>
          <p className="mb-4">
            This is the only time you will see this key. Copy it now and store
            it securely.
          </p>

          <div className="api-key-value mb-4">
            <code className="font-monospace text-break">
              {generatedKey.key}
            </code>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <Button
              onClick={() => copyToClipboard(generatedKey.key!)}
              variant="primary"
            >
              Copy to Clipboard
            </Button>
            <Button
              onClick={() => setGeneratedKey(null)}
              variant="outline-secondary"
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Generate New Key */}
      <Card className="mb-4">
        <Card.Body>
          <h4 className="mb-1">Generate a new key</h4>
          <p className="small text-muted mb-4">Use a clear name so you can identify this connection later.</p>

          <Form.Label htmlFor="api-key-name">Key name</Form.Label>
          <div className="d-flex gap-3 flex-column flex-sm-row">
            <Form.Control
              id="api-key-name"
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g., CI/CD Pipeline, GitHub Actions"
              maxLength={100}
            />
            <Button
              onClick={handleGenerateKey}
              disabled={loading || !newKeyName.trim()}
              className="flex-shrink-0"
            >
              {loading ? "Generating..." : "Generate key"}
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* API Keys List */}
      <Card className="mb-4 overflow-hidden">
        <Card.Header>
          <h4 className="mb-0">Your API keys</h4>
        </Card.Header>

        {keys.length === 0 ? (
          <div className="api-key-empty text-center text-muted">
            No API keys yet. Generate one to get started.
          </div>
        ) : (
          <div>
            {keys.map((key) => (
              <div
                key={key.id}
                className="api-key-row d-flex align-items-center justify-content-between gap-3"
              >
                <div className="flex-grow-1 min-width-0">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <p className="fw-semibold mb-0">{key.name}</p>
                    {key.revoked_at && (
                      <Badge bg="danger">Revoked</Badge>
                    )}
                  </div>
                  <div className="d-flex gap-3 flex-wrap small text-muted mt-1">
                    <span>
                      Created: {new Date(key.created_at).toLocaleDateString()}
                    </span>
                    {key.last_used_at && (
                      <span>
                        Last used:{" "}
                        {new Date(key.last_used_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="small text-muted font-monospace text-break mb-0 mt-1">
                    ID: {key.id}
                  </p>
                </div>

                {!key.revoked_at && (
                  <Button
                    onClick={() => handleRevokeKey(key.id)}
                    disabled={loading}
                    variant="outline-danger"
                    size="sm"
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Usage Instructions */}
      <div className="api-key-help">
        <h4 className="mb-2">
          Using API Keys
        </h4>
        <p className="small mb-3">
          Use API keys to authenticate from the VS Code extension or other
          tools:
        </p>
        <div className="api-key-command">
          <code className="small font-monospace text-break">
            X-API-Key: cd_your_api_key_here
          </code>
        </div>
      </div>
    </div>
  );
}
