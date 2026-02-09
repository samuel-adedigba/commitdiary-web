"use client";
import { Fragment, useEffect, useState, useMemo, useCallback } from "react";
import {
  Container,
  Col,
  Row,
  Card,
  Badge,
  Button,
  Form,
  ProgressBar,
  Spinner,
  Alert,
} from "react-bootstrap";
import {
  GitBranch,
  RefreshCw,
  Calendar,
  Zap,
  AlertCircle,
  CheckCircle,
  RotateCw,
} from "react-feather";
import { apiClient } from "/lib/apiClient";
import { DataTable } from "components/DataTable";

const RepositoriesPage = () => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [togglingRepos, setTogglingRepos] = useState(new Set()); // Track which repos are being toggled
  const [retryingRepos, setRetryingRepos] = useState(new Set()); // Track repos being retried
  const [pollingRepos, setPollingRepos] = useState(new Set()); // Track repos being polled for backfill

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      // Use the endpoint that includes enable_reports and backfill status
      const data = await apiClient.getReposWithReportSettings();

      setRepositories(data.repos || data);

      // Start polling for any repos with active backfills
      const activeBackfills = (data.repos || []).filter(
        (r) => r.backfill?.status === "processing",
      );
      if (activeBackfills.length > 0) {
        setPollingRepos(new Set(activeBackfills.map((r) => String(r.id))));
      }
    } catch (error) {
      // Fallback to regular getRepositories if new endpoint fails
      try {
        const fallbackData = await apiClient.getRepositories();

        setRepositories(
          fallbackData.map((r) => ({
            ...r,
            enable_reports: false,
            backfill: null,
          })),
        );
      } catch (fallbackError) {
      }
    } finally {
      setLoading(false);
    }
  };

  // Poll for backfill progress on repos with active backfills
  useEffect(() => {
    if (pollingRepos.size === 0) return;

    const interval = setInterval(async () => {
      for (const repoId of pollingRepos) {
        try {
          const data = await apiClient.getBackfillStatus(repoId);
          if (data.backfill) {
            setRepositories((prev) =>
              prev.map((repo) => {
                if (String(repo.id) === repoId) {
                  const isNowComplete = data.backfill.status === "completed";
                  return {
                    ...repo,
                    backfill: data.backfill,
                    enable_reports: isNowComplete ? true : repo.enable_reports,
                  };
                }
                return repo;
              }),
            );

            // Stop polling if backfill is done
            if (data.backfill.status !== "processing") {
              setPollingRepos((prev) => {
                const next = new Set(prev);
                next.delete(repoId);
                return next;
              });
            }
          }
        } catch (err) {
          console.error(`Error polling backfill status for repo ${repoId}:`, err);
          // Stop polling if we get repeated errors (likely API issues)
          // This prevents infinite polling when the backend is having problems
          setPollingRepos((prev) => {
            const next = new Set(prev);
            next.delete(repoId);
            return next;
          });
          
          // Update the repo to show an error state
          setRepositories((prev) =>
            prev.map((repo) => {
              if (String(repo.id) === repoId && repo.backfill?.status === "processing") {
                return {
                  ...repo,
                  backfill: {
                    ...repo.backfill,
                    status: "failed",
                    errorMessage: "Failed to check backfill status due to API error"
                  }
                };
              }
              return repo;
            }),
          );
        }
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [pollingRepos]);

  const handleToggleReports = async (repoId, currentEnabled) => {
    const repoIdStr = String(repoId);

    // Optimistic update for disable, show loading for enable
    setTogglingRepos((prev) => new Set([...prev, repoIdStr]));

    try {
      const result = await apiClient.toggleRepoReports(
        repoIdStr,
        !currentEnabled,
      );

      if (!currentEnabled && result.backfill) {
        // Enabling with backfill - update repo with backfill status, don't mark enabled yet
        setRepositories((prev) =>
          prev.map((repo) =>
            repo.id === repoId
              ? { ...repo, backfill: result.backfill, enable_reports: false }
              : repo,
          ),
        );
        // Start polling for this repo only if backfill is in processing state
        if (result.backfill?.status === "processing") {
          setPollingRepos((prev) => new Set([...prev, repoIdStr]));
        }
      } else {
        // Direct enable (no backfill needed) or disable
        setRepositories((prev) =>
          prev.map((repo) =>
            repo.id === repoId
              ? { ...repo, enable_reports: result.enabled, backfill: null }
              : repo,
          ),
        );
      }
    } catch (error) {
      console.error(`Failed to toggle reports for repo ${repoId}:`, error);
      // Revert the optimistic update on error
      setRepositories((prev) =>
        prev.map((repo) =>
          repo.id === repoId
            ? { ...repo, enable_reports: currentEnabled }
            : repo,
        ),
      );
    } finally {
      setTogglingRepos((prev) => {
        const next = new Set(prev);
        next.delete(repoIdStr);
        return next;
      });
    }
  };

  const handleRetryBackfill = async (repoId) => {
    const repoIdStr = String(repoId);
    setRetryingRepos((prev) => new Set([...prev, repoIdStr]));

    try {
      const result = await apiClient.retryBackfill(repoIdStr);

      setRepositories((prev) =>
        prev.map((repo) =>
          repo.id === repoId ? { ...repo, backfill: result.backfill } : repo,
        ),
      );

      // Start polling for this repo only if backfill is in processing state
      if (result.backfill?.status === "processing") {
        setPollingRepos((prev) => new Set([...prev, repoIdStr]));
      }
    } catch (error) {
      console.error(`Failed to retry backfill for repo ${repoId}:`, error);
      // Show error state to user
      setRepositories((prev) =>
        prev.map((repo) =>
          repo.id === repoId ? {
            ...repo,
            backfill: repo.backfill ? {
              ...repo.backfill,
              status: "failed",
              errorMessage: "Failed to retry backfill. Please try again later."
            } : null
          } : repo,
        ),
      );
    } finally {
      setRetryingRepos((prev) => {
        const next = new Set(prev);
        next.delete(repoIdStr);
        return next;
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderBackfillStatus = useCallback((repo) => {
    const backfill = repo.backfill;
    if (!backfill) return null;

    const { status, totalCommits, completedCommits, failedCommits } = backfill;
    const progress =
      totalCommits > 0
        ? Math.round((completedCommits / totalCommits) * 100)
        : 0;

    if (status === "processing") {
      return (
        <div className="mt-2">
          <div className="d-flex align-items-center gap-2 mb-1">
            <Spinner animation="border" size="sm" variant="primary" />
            <small className="text-primary fw-medium">
              Generating reports: {completedCommits}/{totalCommits}
            </small>
          </div>
          <ProgressBar
            now={progress}
            variant="primary"
            animated
            style={{ height: "6px" }}
          />
        </div>
      );
    }

    if (status === "completed") {
      return (
        <div className="mt-1">
          <small className="text-success d-flex align-items-center gap-1">
            <CheckCircle size={12} />
            All {totalCommits} reports generated
          </small>
        </div>
      );
    }

    if (status === "failed" || status === "partial") {
      const isRetrying = retryingRepos.has(String(repo.id));
      return (
        <div className="mt-2">
          <div className="d-flex align-items-center justify-content-between">
            <small className="text-danger d-flex align-items-center gap-1">
              <AlertCircle size={12} />
              {failedCommits} of {totalCommits} failed
            </small>
            <Button
              variant="outline-warning"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRetryBackfill(repo.id);
              }}
              disabled={isRetrying}
              className="py-0 px-2"
              style={{ fontSize: "0.75rem" }}
            >
              {isRetrying ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <>
                  <RotateCw size={10} className="me-1" />
                  Retry
                </>
              )}
            </Button>
          </div>
          {backfill.errorMessage && (
            <small className="text-muted d-block mt-1">
              {backfill.errorMessage}
            </small>
          )}
          <ProgressBar style={{ height: "6px" }} className="mt-1">
            <ProgressBar
              variant="success"
              now={(completedCommits / totalCommits) * 100}
              key={1}
            />
            <ProgressBar
              variant="danger"
              now={(failedCommits / totalCommits) * 100}
              key={2}
            />
          </ProgressBar>
        </div>
      );
    }

    return null;
  }, [retryingRepos]);

  // DataTable columns definition
  const columns = useMemo(
    () => [
      {
        header: "Repository",
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="d-flex align-items-start">
            <GitBranch size={18} className="text-primary me-2 mt-1" />
            <div style={{ flex: 1 }}>
              <div className="fw-semibold">{row.original.name}</div>
              {row.original.description && (
                <small className="text-muted">{row.original.description}</small>
              )}
              {renderBackfillStatus(row.original)}
            </div>
          </div>
        ),
      },
      {
        header: "Remote",
        accessorKey: "remote",
        cell: ({ row }) => {
          try {
            return row.original.remote ? (
              <Badge bg="secondary">
                {new URL(row.original.remote).hostname}
              </Badge>
            ) : (
              <span className="text-muted">Local</span>
            );
          } catch {
            return <span className="text-muted">Local</span>;
          }
        },
      },
      {
        header: "Last Updated",
        accessorKey: "updated_at",
        cell: ({ row }) => (
          <div className="d-flex align-items-center gap-2">
            <Calendar size={14} className="text-muted" />
            <small className="text-muted">
              {formatDate(row.original.updated_at)}
            </small>
          </div>
        ),
      },
      {
        header: "Auto Reports",
        accessorKey: "enable_reports",
        cell: ({ row }) => {
          const isToggling = togglingRepos.has(String(row.original.id));
          const isBackfilling = row.original.backfill?.status === "processing";
          const hasFailedBackfill =
            row.original.backfill?.status === "failed" ||
            row.original.backfill?.status === "partial";
          return (
            <div className="d-flex align-items-center gap-2">
              <Form.Check
                type="switch"
                id={`report-toggle-${row.original.id}`}
                checked={row.original.enable_reports || isBackfilling}
                onChange={() =>
                  handleToggleReports(
                    row.original.id,
                    row.original.enable_reports || isBackfilling,
                  )
                }
                disabled={isToggling || isBackfilling}
                className="m-0"
              />
              {isBackfilling && (
                <Badge
                  bg="warning"
                  text="dark"
                  className="d-flex align-items-center gap-1"
                >
                  <Spinner
                    animation="border"
                    size="sm"
                    style={{ width: "10px", height: "10px" }}
                  />
                  Setting up
                </Badge>
              )}
              {row.original.enable_reports && !isBackfilling && (
                <Badge bg="success" className="d-flex align-items-center gap-1">
                  <Zap size={10} />
                  AI
                </Badge>
              )}
              {hasFailedBackfill && !row.original.enable_reports && (
                <Badge bg="danger" className="d-flex align-items-center gap-1">
                  <AlertCircle size={10} />
                  Setup Failed
                </Badge>
              )}
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [togglingRepos, retryingRepos, pollingRepos, renderBackfillStatus],
  );

  return (
    <Fragment>
      <div className="bg-primary pt-10 pb-21"></div>
      <Container fluid className="mt-n22 px-6">
        <Row>
          <Col lg={12} md={12} xs={12}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h3 className="mb-0 text-white">Repositories</h3>
                <p className="mb-0 text-white-50">
                  {repositories.length} total repositories
                </p>
              </div>
              <div>
                <Button
                  variant="white"
                  onClick={fetchRepositories}
                  disabled={loading}
                >
                  <RefreshCw size={16} className="me-2" />
                  {loading ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        <Row>
          <Col lg={12} md={12} xs={12}>
            <Card>
              <Card.Body className="p-0">
                <DataTable
                  columns={columns}
                  data={repositories}
                  loading={loading}
                  noData={repositories.length === 0}
                  pagingData={{
                    total: repositories.length,
                    pageIndex: currentPage,
                    pageSize: pageSize,
                  }}
                  onPaginationChange={(page) => setCurrentPage(page)}
                  onSelectChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  pageSizes={[5, 10, 25, 50]}
                  customNoDataIcon={
                    <div className="text-center py-6">
                      <GitBranch size={48} className="text-muted mb-3" />
                      <h5 className="text-muted">No repositories found</h5>
                      <p className="text-muted">
                        Sync commits from VS Code extension to see repositories
                        here
                      </p>
                    </div>
                  }
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Fragment>
  );
};

export default RepositoriesPage;
