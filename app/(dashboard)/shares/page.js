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
} from "react-feather";
import { apiClient } from "/lib/apiClient";
import { DataTable } from "components/DataTable";

const SharesPage = () => {
  const [shares, setShares] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
      console.error("Failed to fetch shares:", error);
      setError("Failed to load shares");
    } finally {
      setLoading(false);
    }
  };

  const fetchRepositories = async () => {
    try {
      const data = await apiClient.getRepositories();
      setRepositories(data.repos || []);
    } catch (error) {
      console.error("Failed to fetch repositories:", error);
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
      setExpiresInDays("");

      // Refresh shares list
      await fetchShares();

      // Close modal after a delay
      setTimeout(() => {
        setShowCreateModal(false);
        setSuccess("");
      }, 2000);
    } catch (error) {
      console.error("Failed to create share:", error);
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
      console.error("Failed to revoke share:", error);
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
      console.error("Failed to export share:", error);
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
        const scope = row.original.scope;
        return (
          <div className="small">
            {scope.repos && scope.repos.length > 0 && (
              <div>
                <GitBranch size={12} className="me-1" />
                {scope.repos.length} repos
              </div>
            )}
            {scope.from && (
              <div>
                <Calendar size={12} className="me-1" />
                From {new Date(scope.from).toLocaleDateString()}
              </div>
            )}
            {scope.to && (
              <div>
                <Calendar size={12} className="me-1" />
                To {new Date(scope.to).toLocaleDateString()}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "total_commits",
      header: "Commits",
      cell: ({ row }) => (
        <div>
          <Badge bg="primary">{row.original.total_commits}</Badge>
          <span className="ms-2 text-muted small">
            {row.original.total_repos} repos
          </span>
        </div>
      ),
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
    </Fragment>
  );
};

export default SharesPage;
