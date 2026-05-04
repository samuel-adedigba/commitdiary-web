import { Button, ProgressBar, Spinner } from "react-bootstrap";
import { AlertCircle, CheckCircle, RotateCw } from "react-feather";
import { isActiveBackfill, isStalledBackfill } from "/lib/reports/backfillStatus";

const BackfillProgress = ({ repo, pollingRepos, retryingRepos, onRetry }) => {
  const backfill = repo.backfill;
  if (!backfill) return null;

  const { status, totalCommits, completedCommits, failedCommits } = backfill;
  const progress =
    totalCommits > 0 ? Math.round((completedCommits / totalCommits) * 100) : 0;

  if (isStalledBackfill(backfill)) {
    const isRetrying = retryingRepos.has(String(repo.id));
    return (
      <div className="mt-2">
        <div className="d-flex align-items-center justify-content-between">
          <small className="text-warning d-flex align-items-center gap-1">
            <AlertCircle size={12} />
            Setup stalled
          </small>
          <Button
            variant="outline-warning"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRetry(repo.id);
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
          <small className="text-muted d-block mt-1">{backfill.errorMessage}</small>
        )}
      </div>
    );
  }

  if (isActiveBackfill(backfill)) {
    if (totalCommits === 0) {
      return (
        <div className="mt-2">
          <div className="d-flex align-items-center gap-2 mb-1">
            <Spinner animation="border" size="sm" variant="warning" />
            <small className="text-warning fw-medium">Initializing...</small>
          </div>
        </div>
      );
    }

    const isPolling = pollingRepos.has(String(repo.id));
    return (
      <div className="mt-2">
        <div className="d-flex align-items-center gap-2 mb-1">
          <Spinner animation="border" size="sm" variant="primary" />
          <small className="text-primary fw-medium">
            {isPolling ? "Generating reports:" : "Setting up:"} {completedCommits}/
            {totalCommits}
          </small>
        </div>
        <ProgressBar
          now={progress}
          variant="primary"
          animated={isPolling}
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
              onRetry(repo.id);
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
          <small className="text-muted d-block mt-1">{backfill.errorMessage}</small>
        )}
      </div>
    );
  }

  return null;
};

export default BackfillProgress;
