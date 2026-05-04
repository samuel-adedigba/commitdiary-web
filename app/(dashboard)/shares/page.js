"use client";
import { Fragment, useEffect, useState } from "react";
import {
  Container,
  Col,
  Row,
  Card,
  Button,
  Modal,
  Form,
  Badge,
  Alert,
} from "react-bootstrap";
import {
  Share2,
  Plus,
  Trash2,
  Copy,
  Download,
  Calendar,
  GitBranch,
  Eye,
  ExternalLink,
  Image,
} from "react-feather";
import { apiClient } from "/lib/apiClient";
import { DataTable } from "components/DataTable";

const SharesPage = () => {
  const [shares, setShares] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewShare, setPreviewShare] = useState(null);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedRepos, setSelectedRepos] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");
  const [live, setLive] = useState(false);

  useEffect(() => {
    fetchShares();
    fetchRepositories();
  }, []);

  const fetchShares = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getShares();
      setShares(data.shares || []);
    } catch (error) {
      setError("Failed to load shares");
    } finally {
      setLoading(false);
    }
  };

  const fetchRepositories = async () => {
    try {
      const data = await apiClient.getRepositories();
      setRepositories(data || []);
    } catch (error) {
    }
  };

  const handleCreateShare = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setCreateLoading(true);
      const params = {
        title: title.trim(),
        description: description.trim() || undefined,
        repos: selectedRepos.length > 0 ? selectedRepos : undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        expires_in_days: expiresInDays ? parseInt(expiresInDays) : undefined,
        live: live,
      };

      const result = await apiClient.createShare(params);

      setSuccess(
        `Share created! ${result.total_commits} commits from ${result.total_repos} repos`
      );

      // Reset form
      setTitle("");
      setDescription("");
      setSelectedRepos([]);
      setDateFrom("");
      setDateTo("");
      setDateTo("");
      setExpiresInDays("");
      setLive(false);

      // Refresh shares list
      await fetchShares();

      // Close modal after a delay
      setTimeout(() => {
        setShowCreateModal(false);
        setSuccess("");
      }, 2000);
    } catch (error) {
      setError(error.message || "Failed to create share");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    setSuccess("Link copied to clipboard!");
    setTimeout(() => setSuccess(""), 2000);
  };

  const parseSharePath = (url) => {
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length >= 3 && parts[0] === "s") {
        return { username: parts[1], token: parts[2] };
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const getBadgeUrl = (share) => {
    const parts = parseSharePath(share.url);
    if (!parts) return null;
    return `${window.location.origin}/api/badge/${parts.username}/${parts.token}`;
  };

  const handlePreviewShare = (share) => {
    setPreviewShare(share);
    setPreviewVersion(Date.now());
    setShowPreviewModal(true);
  };

  const handleRevoke = async (shareId) => {
    if (
      !confirm(
        "Are you sure you want to revoke this share? The link will no longer work."
      )
    ) {
      return;
    }

    try {
      await apiClient.revokeShare(shareId);
      setSuccess("Share revoked successfully");
      await fetchShares();
      setTimeout(() => setSuccess(""), 2000);
    } catch (error) {
      setError("Failed to revoke share");
    }
  };

  const handleExport = async (shareId, format, title) => {
    try {
      const blob = await apiClient.exportShare(shareId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError("Failed to export share");
    }
  };

  const columns = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div>
          <div className="fw-semibold">{row.original.title}</div>
          {row.original.description && (
            <div className="text-muted small">{row.original.description}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "scope",
      header: "Scope",
      cell: ({ row }) => {
        const scope = row.original.scope || {};
        const hasRepoFilter = Array.isArray(scope.repos) && scope.repos.length > 0;
        return (
          <div className="small">
            {scope.live && (
              <div>
                <Badge bg="info" className="me-2">Live</Badge>
                Auto-refresh
              </div>
            )}
            <div>
              <GitBranch size={12} className="me-1" />
              {hasRepoFilter ? `${scope.repos.length} selected repos` : "All repos"}
            </div>
            {hasRepoFilter && (
              <div>
                {scope.repos.slice(0, 2).join(", ")}
                {scope.repos.length > 2 ? ` +${scope.repos.length - 2} more` : ""}
              </div>
            )}
            {!scope.from && !scope.to && (
              <div>
                <Calendar size={12} className="me-1" />
                All time
              </div>
            )}
            {scope.from && scope.to && (
              <div>
                <Calendar size={12} className="me-1" />
                {new Date(scope.from).toLocaleDateString()} -{" "}
                {new Date(scope.to).toLocaleDateString()}
              </div>
            )}
            {scope.from && !scope.to && (
              <div>
                <Calendar size={12} className="me-1" />
                From {new Date(scope.from).toLocaleDateString()}
              </div>
            )}
            {!scope.from && scope.to && (
              <div>
                <Calendar size={12} className="me-1" />
                Until {new Date(scope.to).toLocaleDateString()}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "total_commits",
      header: "Commits",
      cell: ({ row }) => {
        const share = row.original;
        const totalCommits = Number(share.total_commits || 0);
        const totalRepos = Number(share.total_repos || 0);
        const scopeReposCount = Array.isArray(share.scope?.repos)
          ? share.scope.repos.length
          : 0;
        const reposLabel =
          totalRepos > 0
            ? `${totalRepos} repos`
            : scopeReposCount > 0
              ? `${scopeReposCount} selected repos`
              : "all repos";
        const pendingSnapshot = totalCommits === 0 && !!share.scope?.live;

        return (
          <div>
            <Badge bg={pendingSnapshot ? "warning" : "primary"}>
              {pendingSnapshot ? "Syncing..." : totalCommits}
            </Badge>
            <span className="ms-2 text-muted small">{reposLabel}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const share = row.original;
        if (share.revoked) {
          return <Badge bg="danger">Revoked</Badge>;
        }
        if (share.expires_at && new Date(share.expires_at) < new Date()) {
          return <Badge bg="warning">Expired</Badge>;
        }
        if (share.expires_at) {
          const daysLeft = Math.ceil(
            (new Date(share.expires_at) - new Date()) / (1000 * 60 * 60 * 24)
          );
          return <Badge bg="success">Active ({daysLeft}d left)</Badge>;
        }
        return <Badge bg="success">Active</Badge>;
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="d-flex gap-2">
          <Button
            size="sm"
            variant="outline-success"
            onClick={() => window.open(row.original.url, "_blank")}
            title="Open share page"
          >
            <ExternalLink size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-info"
            onClick={() => handlePreviewShare(row.original)}
            title="Preview share and badge"
          >
            <Eye size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => handleCopyLink(row.original.url)}
            title="Copy link"
          >
            <Copy size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() =>
              handleExport(row.original.id, "md", row.original.title)
            }
            title="Export as Markdown"
          >
            <Download size={14} />
          </Button>
          {!row.original.revoked && (
            <Button
              size="sm"
              variant="outline-danger"
              onClick={() => handleRevoke(row.original.id)}
              title="Revoke share"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Fragment>
      <Container fluid className="p-6">
        {/* Header */}
        <Row>
          <Col lg={12} md={12} xs={12}>
            <div className="border-bottom pb-4 mb-4 d-flex align-items-center justify-content-between">
              <div className="mb-2 mb-lg-0">
                <h1 className="mb-1 h2 fw-bold">
                  <Share2 size={28} className="me-2" />
                  Shareable Links
                </h1>
                <p className="mb-0 text-muted">
                  Create and manage public shareable commit diary links
                </p>
              </div>
              <div>
                <Button
                  variant="primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus size={18} className="me-2" />
                  Create Share
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* Alerts */}
        {error && (
          <Row>
            <Col lg={12}>
              <Alert variant="danger" dismissible onClose={() => setError("")}>
                {error}
              </Alert>
            </Col>
          </Row>
        )}
        {success && (
          <Row>
            <Col lg={12}>
              <Alert
                variant="success"
                dismissible
                onClose={() => setSuccess("")}
              >
                {success}
              </Alert>
            </Col>
          </Row>
        )}

        {/* Shares Table */}
        <Row>
          <Col lg={12}>
            <Card>
              <Card.Body className="p-0">
                <DataTable
                  columns={columns}
                  data={shares}
                  loading={loading}
                  noData={shares.length === 0}
                  pagingData={{
                    total: shares.length,
                    pageIndex: 1,
                    pageSize: 10,
                  }}
                  pageSizes={[10, 25, 50]}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Create Share Modal */}
      <Modal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Create Shareable Link</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateShare}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>
                Title <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Weekly Commit Summary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Optional description for this share"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Repositories (leave empty for all)</Form.Label>
              <Form.Select
                multiple
                value={selectedRepos}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  );
                  setSelectedRepos(selected);
                }}
                size="sm"
                style={{ height: "120px" }}
              >
                {repositories.map((repo) => (
                  <option key={repo.id} value={repo.name}>
                    {repo.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Hold Ctrl/Cmd to select multiple repositories
              </Form.Text>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>From Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>To Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Expires In (days)</Form.Label>
              <Form.Control
                type="number"
                placeholder="Leave empty for no expiry"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                min="1"
              />
              <Form.Text className="text-muted">
                Common values: 7 (week), 30 (month), 365 (year)
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="live-mode-switch"
                label="Live Mode: Auto-update with new commits"
                checked={live}
                onChange={(e) => setLive(e.target.checked)}
              />
              <Form.Text className="text-muted">
                If enabled, the share link will always show the latest data
                (updated on access).
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createLoading}>
              {createLoading ? "Creating..." : "Create Share"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        show={showPreviewModal}
        onHide={() => {
          setShowPreviewModal(false);
          setPreviewShare(null);
        }}
        size="xl"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Share Preview {previewShare ? `- ${previewShare.title}` : ""}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewShare && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  onClick={() => window.open(previewShare.url, "_blank")}
                >
                  <ExternalLink size={16} className="me-2" />
                  Open Share Page
                </Button>
                <Button
                  variant="outline-primary"
                  onClick={() => handleCopyLink(previewShare.url)}
                >
                  <Copy size={16} className="me-2" />
                  Copy Share Link
                </Button>
                {getBadgeUrl(previewShare) && (
                  <Button
                    variant="outline-secondary"
                    onClick={() => handleCopyLink(getBadgeUrl(previewShare))}
                  >
                    <Image size={16} className="me-2" />
                    Copy Badge URL
                  </Button>
                )}
              </div>

              {getBadgeUrl(previewShare) && (
                <Card>
                  <Card.Header className="py-2">SVG Badge (Full Width Preview)</Card.Header>
                  <Card.Body>
                    <img
                      src={`${getBadgeUrl(previewShare)}?v=${previewVersion}`}
                      alt="Share badge preview"
                      style={{ width: "100%", height: "auto", borderRadius: 8 }}
                    />
                  </Card.Body>
                </Card>
              )}

            </div>
          )}
        </Modal.Body>
      </Modal>
    </Fragment>
  );
};

export default SharesPage;
