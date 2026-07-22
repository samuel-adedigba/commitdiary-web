"use client";

import { Fragment, useState } from "react";
import NextImage from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import {
  Calendar,
  Copy,
  Download,
  ExternalLink,
  Eye,
  GitBranch,
  Image as ImageIcon,
  Plus,
  Share2,
  Trash2,
} from "react-feather";
import { apiClient } from "/lib/apiClient";
import { clearApiResourceCache, useApiResource } from "/hooks/useApiResource";
import { DataTable } from "components/DataTable";
import Select from "components/ui/Select";

const PAGE_SIZES = [10, 25, 50];
const EXPORT_FORMATS = [
  { format: "md", label: "Markdown" },
  { format: "csv", label: "CSV" },
];

const getPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const isShareInactive = (share) => Boolean(
  share?.revoked ||
  (share?.expires_at && new Date(share.expires_at).getTime() < Date.now()),
);

const SharesPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = getPositiveInteger(searchParams.get("page"), 1);
  const pageSizeValue = getPositiveInteger(searchParams.get("limit"), 10);
  const pageSize = PAGE_SIZES.includes(pageSizeValue) ? pageSizeValue : 10;
  const sharesResource = useApiResource(`shares:${page}:${pageSize}`, () =>
    apiClient.getShares({ page, limit: pageSize }),
  );
  const repositoriesResource = useApiResource("share-repositories", () =>
    apiClient.getRepositories(),
  );

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewShare, setPreviewShare] = useState(null);
  const [revokeShare, setRevokeShare] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [createError, setCreateError] = useState("");
  const [revokeError, setRevokeError] = useState("");
  const [badgeState, setBadgeState] = useState("idle");
  const [badgeRetryKey, setBadgeRetryKey] = useState(0);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [repositoryScope, setRepositoryScope] = useState("selected");
  const [selectedRepos, setSelectedRepos] = useState([]);
  const [confirmAllRepositories, setConfirmAllRepositories] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");
  const [live, setLive] = useState(false);

  const shares = sharesResource.data?.shares || [];
  const pagination = sharesResource.data?.pagination || {
    total: 0,
    page,
    limit: pageSize,
  };
  const repositories = repositoriesResource.data || [];
  const repositoryOptions = repositories.map((repository) => ({
    value: repository.name,
    label: repository.name,
  }));

  const updatePagination = (nextPage, nextPageSize = pageSize) => {
    const query = new URLSearchParams(searchParams.toString());
    query.set("page", String(nextPage));
    query.set("limit", String(nextPageSize));
    router.replace(`${pathname}?${query.toString()}`);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setRepositoryScope("selected");
    setSelectedRepos([]);
    setConfirmAllRepositories(false);
    setDateFrom("");
    setDateTo("");
    setExpiresInDays("");
    setLive(false);
    setCreateError("");
  };

  const closeCreateModal = () => {
    if (createLoading) return;
    setShowCreateModal(false);
    setCreateError("");
  };

  const handleCreateShare = async (event) => {
    event.preventDefault();
    if (createLoading) return;

    setCreateError("");
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setCreateError("Enter a title for this share.");
      return;
    }
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setCreateError("The end date must be on or after the start date.");
      return;
    }
    if (repositoriesResource.isLoading || repositoriesResource.error) {
      setCreateError("Wait until your repositories are available before creating a share.");
      return;
    }
    if (repositoryScope === "selected" && selectedRepos.length === 0) {
      setCreateError("Select at least one repository, or explicitly choose all repositories.");
      return;
    }
    if (repositoryScope === "all" && !confirmAllRepositories) {
      setCreateError("Confirm that this share may include activity from every repository.");
      return;
    }
    const expiryDays = expiresInDays ? Number(expiresInDays) : undefined;
    if (
      expiryDays !== undefined &&
      (!Number.isSafeInteger(expiryDays) || expiryDays < 1 || expiryDays > 3650)
    ) {
      setCreateError("Expiry must be a whole number between 1 and 3650 days.");
      return;
    }

    try {
      setCreateLoading(true);
      const result = await apiClient.createShare({
        title: normalizedTitle,
        description: description.trim() || undefined,
        repos: repositoryScope === "selected" ? selectedRepos : undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        expires_in_days: expiryDays,
        live,
      });

      clearApiResourceCache("shares:");
      resetForm();
      setShowCreateModal(false);
      setFeedback({ variant: "success", message: result.message });
    } catch (error) {
      setCreateError(error.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCopy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback({ variant: "success", message: `${label} copied to your clipboard.` });
    } catch {
      setFeedback({
        variant: "danger",
        message: `We could not copy the ${label.toLowerCase()}. Copy it manually and try again.`,
      });
    }
  };

  const openExternal = (url) => {
    const openedWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (openedWindow) openedWindow.opener = null;
  };

  const parseSharePath = (url) => {
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length >= 3 && parts[0] === "s") {
        return { origin: parsed.origin, username: parts[1], token: parts[2] };
      }
    } catch {
      return null;
    }
    return null;
  };

  const getBadgeUrl = (share) => {
    if (isShareInactive(share)) return null;
    const parts = parseSharePath(share?.url);
    return parts
      ? `${parts.origin}/api/badge/${parts.username}/${parts.token}`
      : null;
  };

  const openBadgePreview = (share) => {
    setBadgeState(isShareInactive(share) ? "unavailable" : "loading");
    setBadgeRetryKey(0);
    setPreviewShare(share);
  };

  const handleRevoke = async () => {
    if (!revokeShare || pendingAction) return;
    const actionKey = `${revokeShare.id}:revoke`;

    try {
      setPendingAction(actionKey);
      setRevokeError("");
      const result = await apiClient.revokeShare(revokeShare.id);
      const previousShareCount = shares.length;
      setRevokeShare(null);
      clearApiResourceCache("shares:");
      if (previousShareCount === 1 && page > 1) updatePagination(page - 1);
      setFeedback({ variant: "success", message: result.message });
    } catch (error) {
      setRevokeError(error.message);
    } finally {
      setPendingAction("");
    }
  };

  const handleExport = async (share, format) => {
    const actionKey = `${share.id}:export-${format}`;
    if (pendingAction) return;

    try {
      setPendingAction(actionKey);
      const result = await apiClient.exportShare(share.id, format);
      const downloadUrl = window.URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download =
        result.filename || `${share.title.replace(/[^a-z0-9_-]+/gi, "_")}.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setFeedback({ variant: "success", message: result.message });
    } catch (error) {
      setFeedback({ variant: "danger", message: error.message });
    } finally {
      setPendingAction("");
    }
  };

  const columns = [
    {
      accessorKey: "title",
      header: "Title",
      enableSorting: false,
      cell: ({ row }) => (
        <div>
          <div className="fw-semibold text-break">{row.original.title}</div>
          {row.original.description ? (
            <div className="text-muted small text-break">{row.original.description}</div>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "scope",
      header: "Scope",
      enableSorting: false,
      cell: ({ row }) => {
        const scope = row.original.scope || {};
        const hasRepoFilter = Array.isArray(scope.repos) && scope.repos.length > 0;
        const dateLabel = scope.from && scope.to
          ? `${new Date(scope.from).toLocaleDateString()} – ${new Date(scope.to).toLocaleDateString()}`
          : scope.from
            ? `From ${new Date(scope.from).toLocaleDateString()}`
            : scope.to
              ? `Until ${new Date(scope.to).toLocaleDateString()}`
              : "All time";

        return (
          <div className="small d-flex flex-column gap-1">
            {scope.live ? <Badge bg="info" className="align-self-start">Live</Badge> : null}
            <span>
              <GitBranch size={12} className="me-1" aria-hidden="true" />
              {hasRepoFilter ? `${scope.repos.length} selected` : "All repositories"}
            </span>
            <span>
              <Calendar size={12} className="me-1" aria-hidden="true" />
              {dateLabel}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "total_commits",
      header: "Commits",
      enableSorting: false,
      cell: ({ row }) => (
        <div>
          <Badge bg="primary">{Number(row.original.total_commits || 0)}</Badge>
          <span className="ms-2 text-muted small">
            {Number(row.original.total_repos || 0)} repositories
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const share = row.original;
        if (share.revoked) return <Badge bg="danger">Revoked</Badge>;
        if (share.expires_at && new Date(share.expires_at) < new Date()) {
          return <Badge bg="warning" text="dark">Expired</Badge>;
        }
        return <Badge bg="success">Active</Badge>;
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      enableSorting: false,
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const share = row.original;
        return (
          <div className="d-flex flex-wrap gap-2" aria-label={`Actions for ${share.title}`}>
            <Button
              size="sm"
              variant="outline-success"
              onClick={() => openExternal(share.url)}
              aria-label={`Open ${share.title}`}
              title="Open share page"
            >
              <ExternalLink size={14} aria-hidden="true" />
            </Button>
            <Button
              size="sm"
              variant="outline-info"
              onClick={() => openBadgePreview(share)}
              aria-label={`${isShareInactive(share) ? "Check badge availability for" : "Preview"} ${share.title}`}
              title={isShareInactive(share) ? "Badge unavailable for inactive share" : "Preview share badge"}
            >
              <Eye size={14} aria-hidden="true" />
            </Button>
            <Button
              size="sm"
              variant="outline-primary"
              onClick={() => handleCopy(share.url, "Share link")}
              aria-label={`Copy link for ${share.title}`}
              title="Copy share link"
            >
              <Copy size={14} aria-hidden="true" />
            </Button>
            {EXPORT_FORMATS.map(({ format, label }) => {
              const actionKey = `${share.id}:export-${format}`;
              return (
                <Button
                  key={format}
                  size="sm"
                  variant="outline-secondary"
                  disabled={Boolean(pendingAction)}
                  onClick={() => handleExport(share, format)}
                  aria-label={`Export ${share.title} as ${label}`}
                  title={`Export as ${label}`}
                >
                  {pendingAction === actionKey ? (
                    <Spinner size="sm" animation="border" role="status" />
                  ) : (
                    <Download size={14} aria-hidden="true" />
                  )}
                  <span className="ms-1">{format.toUpperCase()}</span>
                </Button>
              );
            })}
            {!share.revoked ? (
              <Button
                size="sm"
              variant="outline-danger"
              disabled={Boolean(pendingAction)}
                onClick={() => {
                  setRevokeError("");
                  setRevokeShare(share);
                }}
                aria-label={`Revoke ${share.title}`}
                title="Revoke share"
              >
                <Trash2 size={14} aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ];

  const pageError = sharesResource.error?.message;
  const badgeUrl = getBadgeUrl(previewShare);

  return (
    <Fragment>
      <Container fluid className="p-4 p-lg-6">
        <Row>
          <Col xs={12}>
            <div className="dashboard-page-header border-bottom pb-4 mb-4">
              <div>
                <h1 className="mb-1 h2 fw-bold d-flex align-items-center">
                  <Share2 size={28} className="me-2" aria-hidden="true" />
                  Share links
                </h1>
                <p className="mb-0 text-muted">
                  Create public, read-only views of selected commit activity.
                </p>
              </div>
              <Button className="dashboard-header-action" variant="primary" onClick={() => setShowCreateModal(true)}>
                <Plus size={18} className="me-2" aria-hidden="true" />
                Create share
              </Button>
            </div>
          </Col>
        </Row>

        {feedback ? (
          <Alert
            variant={feedback.variant}
            dismissible
            role={feedback.variant === "danger" ? "alert" : "status"}
            onClose={() => setFeedback(null)}
          >
            {feedback.message}
          </Alert>
        ) : null}
        {pageError ? (
          <Alert variant="danger" role="alert">
            <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
              <span>{pageError}</span>
              <Button
                size="sm"
                variant="outline-danger"
                onClick={sharesResource.error?.code === "PAGE_OUT_OF_RANGE"
                  ? () => updatePagination(1)
                  : sharesResource.refresh}
              >
                {sharesResource.error?.code === "PAGE_OUT_OF_RANGE"
                  ? "Return to first page"
                  : "Try again"}
              </Button>
            </div>
          </Alert>
        ) : null}

        <Card>
          <Card.Body className="p-0">
            <DataTable
              instanceId="shares-page-size"
              columns={columns}
              data={shares}
              loading={sharesResource.isLoading || sharesResource.isRefreshing}
              noData={!sharesResource.isLoading && shares.length === 0}
              pagingData={{
                total: pagination.total,
                pageIndex: pagination.page,
                pageSize: pagination.limit,
              }}
              pageSizes={PAGE_SIZES}
              onPaginationChange={(nextPage) => updatePagination(nextPage)}
              onSelectChange={(nextSize) => updatePagination(1, nextSize)}
            />
          </Card.Body>
        </Card>
      </Container>

      <Modal show={showCreateModal} onHide={closeCreateModal} size="lg" centered>
        <Modal.Header closeButton={!createLoading}>
          <Modal.Title>Create a share link</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateShare} noValidate>
          <Modal.Body>
            <p className="text-muted small">
              Anyone with the link can view the commit details you include. Repository code and remote URLs are not shared.
            </p>
            {createError ? <Alert variant="danger" role="alert">{createError}</Alert> : null}

            <Form.Group className="mb-3" controlId="share-title">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Weekly commit summary"
                value={title}
                maxLength={120}
                disabled={createLoading}
                onChange={(event) => setTitle(event.target.value)}
                required
                aria-describedby="share-title-help"
              />
              <Form.Text id="share-title-help">Use a short title your audience will recognize.</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3" controlId="share-description">
              <Form.Label>Description <span className="text-muted">(optional)</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Explain what this activity covers."
                value={description}
                maxLength={500}
                disabled={createLoading}
                onChange={(event) => setDescription(event.target.value)}
              />
              <Form.Text>{description.length}/500 characters</Form.Text>
            </Form.Group>

            <Form.Group as="fieldset" className="mb-3">
              <Form.Label as="legend">Repository access</Form.Label>
              <div className="d-flex flex-wrap gap-3 mb-3">
                <Form.Check
                  type="radio"
                  id="share-selected-repositories"
                  name="share-repository-scope"
                  label="Selected repositories"
                  checked={repositoryScope === "selected"}
                  disabled={createLoading}
                  onChange={() => {
                    setRepositoryScope("selected");
                    setConfirmAllRepositories(false);
                  }}
                />
                <Form.Check
                  type="radio"
                  id="share-all-repositories"
                  name="share-repository-scope"
                  label="All repositories"
                  checked={repositoryScope === "all"}
                  disabled={createLoading}
                  onChange={() => {
                    setRepositoryScope("all");
                    setSelectedRepos([]);
                  }}
                />
              </div>
              {repositoryScope === "selected" ? (
                <>
                  <Form.Label htmlFor="share-repositories">Choose repositories</Form.Label>
                  <Select
                    inputId="share-repositories"
                    instanceId="share-repositories"
                    isMulti
                    isClearable
                    isLoading={repositoriesResource.isLoading}
                    isDisabled={createLoading || Boolean(repositoriesResource.error)}
                    placeholder={repositories.length ? "Search repositories" : "No repositories available"}
                    options={repositoryOptions}
                    value={repositoryOptions.filter((option) => selectedRepos.includes(option.value))}
                    onChange={(options) => setSelectedRepos((options || []).map((option) => option.value))}
                    aria-describedby="share-repositories-help"
                  />
                  <Form.Text id="share-repositories-help">
                    Search and select one or more repositories to expose in this link.
                  </Form.Text>
                </>
              ) : (
                <Alert variant="warning" className="mb-0">
                  <p className="mb-2">
                    This includes commit activity from every current repository in your account.
                  </p>
                  <Form.Check
                    id="share-confirm-all-repositories"
                    label="I understand that all repository activity will be public to anyone with the link."
                    checked={confirmAllRepositories}
                    disabled={createLoading}
                    onChange={(event) => setConfirmAllRepositories(event.target.checked)}
                  />
                </Alert>
              )}
              {repositoriesResource.error ? (
                <Alert variant="warning" className="mt-2 mb-0 py-2" role="alert">
                  {repositoriesResource.error.message}
                  <Button
                    size="sm"
                    variant="link"
                    className="py-0"
                    onClick={repositoriesResource.refresh}
                  >
                    Try again
                  </Button>
                </Alert>
              ) : null}
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="share-date-from">
                  <Form.Label>Start date <span className="text-muted">(optional)</span></Form.Label>
                  <Form.Control
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    disabled={createLoading}
                    onChange={(event) => setDateFrom(event.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="share-date-to">
                  <Form.Label>End date <span className="text-muted">(optional)</span></Form.Label>
                  <Form.Control
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    disabled={createLoading}
                    onChange={(event) => setDateTo(event.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="share-expiry">
              <Form.Label>Expiry in days <span className="text-muted">(optional)</span></Form.Label>
              <Form.Control
                type="number"
                placeholder="No expiry"
                value={expiresInDays}
                min={1}
                max={3650}
                step={1}
                inputMode="numeric"
                disabled={createLoading}
                onChange={(event) => setExpiresInDays(event.target.value)}
              />
              <Form.Text>For example, enter 7 for one week or 30 for one month.</Form.Text>
            </Form.Group>

            <Form.Group>
              <Form.Check
                type="switch"
                id="share-live-mode"
                label="Keep this share up to date"
                checked={live}
                disabled={createLoading}
                onChange={(event) => setLive(event.target.checked)}
                aria-describedby="share-live-help"
              />
              <Form.Text id="share-live-help">
                Live shares refresh their snapshot at most once every 15 minutes when viewed.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeCreateModal} disabled={createLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={
                createLoading ||
                repositoriesResource.isLoading ||
                Boolean(repositoriesResource.error) ||
                (repositoryScope === "selected" && selectedRepos.length === 0) ||
                (repositoryScope === "all" && !confirmAllRepositories)
              }
            >
              {createLoading ? (
                <><Spinner size="sm" animation="border" className="me-2" />Creating share…</>
              ) : "Create share"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={Boolean(revokeShare)}
        onHide={() => {
          if (!pendingAction) {
            setRevokeError("");
            setRevokeShare(null);
          }
        }}
        centered
      >
        <Modal.Header closeButton={!pendingAction}>
          <Modal.Title>Revoke share link?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            The link for <strong>{revokeShare?.title}</strong> will stop working. You can still export its saved snapshot.
          </p>
          {revokeError ? <Alert variant="danger" role="alert" className="mt-3 mb-0">{revokeError}</Alert> : null}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            disabled={Boolean(pendingAction)}
            onClick={() => {
              setRevokeError("");
              setRevokeShare(null);
            }}
          >
            Keep share
          </Button>
          <Button variant="danger" disabled={Boolean(pendingAction)} onClick={handleRevoke}>
            {pendingAction.endsWith(":revoke") ? (
              <><Spinner size="sm" animation="border" className="me-2" />Revoking…</>
            ) : "Revoke share"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={Boolean(previewShare)}
        onHide={() => {
          setPreviewShare(null);
          setBadgeState("idle");
        }}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Badge preview{previewShare ? ` — ${previewShare.title}` : ""}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewShare ? (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex flex-wrap gap-2">
                <Button variant="primary" onClick={() => openExternal(previewShare.url)}>
                  <ExternalLink size={16} className="me-2" aria-hidden="true" />Open share page
                </Button>
                <Button variant="outline-primary" onClick={() => handleCopy(previewShare.url, "Share link")}>
                  <Copy size={16} className="me-2" aria-hidden="true" />Copy share link
                </Button>
                {badgeUrl ? (
                  <Button variant="outline-secondary" onClick={() => handleCopy(badgeUrl, "Badge URL")}>
                    <ImageIcon size={16} className="me-2" aria-hidden="true" />Copy badge URL
                  </Button>
                ) : null}
              </div>
              {badgeUrl ? (
                <Card>
                  <Card.Header>SVG activity badge</Card.Header>
                  <Card.Body className="p-2 p-md-3 text-center">
                    {badgeState === "error" ? (
                      <Alert variant="danger" role="alert" className="mb-0">
                        <p>We could not load this badge preview.</p>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => {
                            setBadgeState("loading");
                            setBadgeRetryKey((current) => current + 1);
                          }}
                        >
                          Try again
                        </Button>
                      </Alert>
                    ) : (
                      <>
                        {badgeState === "loading" ? (
                          <div className="py-5" role="status" aria-live="polite">
                            <Spinner animation="border" variant="primary" />
                            <p className="text-muted mt-2 mb-0">Loading badge preview…</p>
                          </div>
                        ) : null}
                        <NextImage
                          key={badgeRetryKey}
                          src={badgeUrl}
                          alt={`Activity badge preview for ${previewShare.title}`}
                          width={1480}
                          height={1960}
                          unoptimized
                          className={`w-100 h-auto rounded ${badgeState === "loading" ? "visually-hidden" : ""}`}
                          onLoad={() => setBadgeState("success")}
                          onError={() => setBadgeState("error")}
                        />
                      </>
                    )}
                  </Card.Body>
                </Card>
              ) : (
                <Alert variant="warning" className="mb-0">
                  {isShareInactive(previewShare)
                    ? "Badges are unavailable for revoked or expired shares."
                    : "This share URL cannot be used to build a badge."}
                </Alert>
              )}
            </div>
          ) : null}
        </Modal.Body>
      </Modal>
    </Fragment>
  );
};

export default SharesPage;
