"use client";
import {
  Fragment,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  Container,
  Col,
  Row,
  Card,
  Badge,
  Button,
  Form,
  Spinner,
  Alert,
} from "react-bootstrap";
import {
  GitBranch,
  RefreshCw,
  Calendar,
  Zap,
  AlertCircle,
  RotateCw,
} from "react-feather";
import { apiClient } from "/lib/apiClient";
import { useBackfillStatus } from "/hooks/useBackfillStatus";
import BackfillProgress from "components/reports/BackfillProgress";
import { DataTable } from "components/DataTable";

const RepositoriesPage = () => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [togglingRepos, setTogglingRepos] = useState(new Set()); // Track which repos are being toggled
  const [retryingRepos, setRetryingRepos] = useState(new Set()); // Track repos being retried
  const [pollingRepos, setPollingRepos] = useState(new Set()); // Track repos being polled for backfill
  const [isRecovering, setIsRecovering] = useState(false); // Track global recovery state

  const fetchRepositories = useCallback(async () => {
    try {
      setLoading(true);
      // Use the endpoint that includes enable_reports and backfill status
      const data = await apiClient.getReposWithReportSettings();

      setRepositories(data.repos || data);

      // Start polling for any repos with active backfills
      const activeBackfills = (data.repos || []).filter(
        (r) =>
          r.backfill?.status === "processing" ||
          r.backfill?.status === "pending",
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
      } catch (fallbackError) {}
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  const activePollingRepoIds = useMemo(
    () => Array.from(pollingRepos),
    [pollingRepos],
  );

  useBackfillStatus({
    repoIds: activePollingRepoIds,
    enabled: activePollingRepoIds.length > 0,
    onBackfillUpdate: (repoId, backfill) => {
      setRepositories((prev) =>
        prev.map((repo) =>
          String(repo.id) === String(repoId)
            ? {
                ...repo,
                backfill,
              }
            : repo,
        ),
      );
    },
    onTerminalState: (repoId) => {
      setPollingRepos((prev) => {
        const next = new Set(prev);
        next.delete(String(repoId));
        return next;
      });
      fetchRepositories();
    },
  });

  const handleToggleReports = async (repoId, currentEnabled) => {
    const repoIdStr = String(repoId);

    // Prevent multiple simultaneous toggles
    if (togglingRepos.has(repoIdStr)) {
      return;
    }

    setTogglingRepos((prev) => new Set([...prev, repoIdStr]));

    try {
      const result = await apiClient.toggleRepoReports(
        repoIdStr,
        !currentEnabled,
      );

      if (!currentEnabled && result.backfill) {
        // Enabling with backfill - update repo with backfill status
        setRepositories((prev) =>
          prev.map((repo) =>
            repo.id === repoId
              ? { ...repo, backfill: result.backfill, enable_reports: false }
              : repo,
          ),
        );

        if (
          result.backfill?.status === "processing" ||
          result.backfill?.status === "pending"
        ) {
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
      // Revert to original state on error
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
          repo.id === repoId
            ? {
                ...repo,
                backfill: repo.backfill
                  ? {
                      ...repo.backfill,
                      status: "failed",
                      errorMessage:
                        "Failed to retry backfill. Please try again later.",
                    }
                  : null,
              }
            : repo,
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

  const handleGlobalRecovery = async () => {
    setIsRecovering(true);
    try {
      const result = await apiClient.recoverJobs();
      console.log('Global recovery results:', result);
      
      // Show success message to user
      alert(`Recovery completed: ${result.results.recovered} jobs recovered, ${result.results.failed} jobs failed`);
      
      // Refresh repositories to see updated status
      await fetchRepositories();
    } catch (error) {
      console.error('Global recovery failed:', error);
      alert(`Recovery failed: ${error.message}`);
    } finally {
      setIsRecovering(false);
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

  const renderBackfillStatus = useCallback(
    (repo) => (
      <BackfillProgress
        repo={repo}
        pollingRepos={pollingRepos}
        retryingRepos={retryingRepos}
        onRetry={handleRetryBackfill}
      />
    ),
    [pollingRepos, retryingRepos],
  );

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
          const isBackfilling =
            row.original.backfill?.status === "processing" ||
            row.original.backfill?.status === "pending";
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
              <div className="d-flex gap-2">
                <Button
                  variant="outline-light"
                  onClick={handleGlobalRecovery}
                  disabled={isRecovering}
                  size="sm"
                >
                  {isRecovering ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Recovering...
                    </>
                  ) : (
                    <>
                      <RotateCw size={16} className="me-2" />
                      Recover Jobs
                    </>
                  )}
                </Button>
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
