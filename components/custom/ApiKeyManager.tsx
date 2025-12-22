"use client";

import { useState, useEffect } from "react";
import { fetchApiKeys, generateApiKey, revokeApiKey, type ApiKey } from "/lib/apiClient";

export default function ApiKeyManager() {
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
        console.error('Failed to load API keys:', err);
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
        err instanceof Error ? err.message : "Failed to generate API key"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRevokeKey(keyId: string) {
    if (
      !confirm(
        "Are you sure you want to revoke this API key? This action cannot be undone."
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
          k.id === keyId ? { ...k, revoked_at: new Date().toISOString() } : k
        )
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">API Keys</h2>
        <p className="text-gray-600">
          Generate API keys for automation, CI/CD pipelines, or headless agents.
        </p>
      </div>

      {/* Generated Key Modal */}
      {generatedKey && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            ⚠️ Save Your API Key
          </h3>
          <p className="text-sm text-yellow-800 mb-4">
            This is the only time you will see this key. Copy it now and store
            it securely.
          </p>

          <div className="bg-white border border-yellow-300 rounded p-3 mb-4">
            <code className="text-sm font-mono break-all">
              {generatedKey.key}
            </code>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => copyToClipboard(generatedKey.key!)}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Copy to Clipboard
            </button>
            <button
              onClick={() => setGeneratedKey(null)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {/* Generate New Key */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Generate New API Key
        </h3>

        <div className="flex gap-6">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="e.g., CI/CD Pipeline, GitHub Actions"
            className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleGenerateKey}
            disabled={loading || !newKeyName.trim()}
            className="px-6 py-2 bg-blue-700 text-black rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {/* API Keys List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Your API Keys</h3>
        </div>

        {keys.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No API keys yet. Generate one to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {keys.map((key) => (
              <div
                key={key.id}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{key.name}</p>
                    {key.revoked_at && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        Revoked
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600 mt-1">
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
                  <p className="text-xs text-gray-500 font-mono mt-1">
                    ID: {key.id}
                  </p>
                </div>

                {!key.revoked_at && (
                  <button
                    onClick={() => handleRevokeKey(key.id)}
                    disabled={loading}
                    className="px-4 py-2 bg-red-900 text-red-800 text-sm rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Using API Keys
        </h3>
        <p className="text-sm text-blue-800 mb-3">
          Use API keys to authenticate from the VS Code extension or other
          tools:
        </p>
        <div className="bg-white border border-blue-300 rounded p-3">
          <code className="text-sm font-mono">
            X-API-Key: cd_your_api_key_here
          </code>
        </div>
      </div>
    </div>
  );
}
