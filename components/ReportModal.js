"use client";

import { useState } from "react";
import { Modal, Button, Spinner, Alert } from "react-bootstrap";
import {
  FileText,
  Zap,
  RefreshCw,
} from "react-feather";
import { useReportStatus } from "/hooks/useReportStatus";
import ReportStatusBadge from "components/reports/ReportStatusBadge";
import ReportContent from "components/reports/ReportContent";

/**
 * Modal component for viewing and generating commit reports
 * Now uses realtime subscriptions for instant updates instead of polling
 */
const ReportModal = ({ show, onHide, commit }) => {
  const [localError, setLocalError] = useState(null);
  const {
    reportStatus,
    loading,
    generating,
    error,
    timedOut,
    realtimeStatus,
    refresh,
    generate,
  } = useReportStatus(commit?.id, show);

  const handleGenerateReport = async () => {
    if (!commit?.id) return;
    setLocalError(null);
    await generate();
  };

  const renderNoReport = () => {
    return (
      <div className="text-center py-5">
        <FileText size={48} className="text-muted mb-3" />
        <h5 className="text-muted">No Report Available</h5>
        <p className="text-muted mb-4">
          Generate an AI-powered report for this commit to get insights.
        </p>
        <Button
          variant="primary"
          onClick={handleGenerateReport}
          disabled={generating}
        >
          {generating ? (
            <>
              <Spinner size="sm" className="me-2" />
              Generating...
            </>
          ) : (
            <>
              <Zap size={16} className="me-2" />
              Generate Report
            </>
          )}
        </Button>
      </div>
    );
  };

  const renderProcessing = () => {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" className="mb-3" />
        <h5>Generating Report...</h5>
        <p className="text-muted mb-0">
          This may take a few moments. The page will update automatically.
        </p>
        {reportStatus?.attempts > 0 && (
          <small className="text-muted">Attempt {reportStatus.attempts}</small>
        )}
      </div>
    );
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <FileText size={20} />
          Commit Report
          <ReportStatusBadge status={reportStatus?.status} />
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Commit Info */}
        {commit && (
          <div className="bg-light rounded p-3 mb-4">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <strong className="d-block mb-1">{commit.message}</strong>
                <small className="text-muted font-monospace">
                  {commit.sha?.substring(0, 7) ||
                    commit.commit_hash?.substring(0, 7)}
                </small>
                <small className="text-muted ms-2">in {commit.repo_name}</small>
              </div>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={refresh}
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? "spin" : ""} />
              </Button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {(error || localError) && (
          <Alert
            variant="danger"
            dismissible
            onClose={() => {
              setLocalError(null);
            }}
          >
            {error || localError}
          </Alert>
        )}
        {realtimeStatus === "degraded" && (
          <Alert variant="warning">
            Realtime updates are degraded. Using fallback polling.
          </Alert>
        )}
        {timedOut && (
          <Alert variant="warning">
            Report generation is taking longer than expected.
            <div className="mt-2 d-flex gap-2">
              <Button size="sm" variant="outline-secondary" onClick={refresh}>
                Refresh Status
              </Button>
              <Button size="sm" variant="outline-primary" onClick={handleGenerateReport}>
                Retry Generation
              </Button>
            </div>
          </Alert>
        )}

        {/* Loading State */}
        {loading && !reportStatus && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        )}

        {/* Content based on status */}
        {!loading &&
          reportStatus?.status === "completed" &&
          <ReportContent report={reportStatus.report} />}
        {!loading &&
          (reportStatus?.status === "pending" ||
            reportStatus?.status === "processing") &&
          renderProcessing()}
        {!loading &&
          (reportStatus?.status === "not_found" ||
            reportStatus?.status === "failed" ||
            !reportStatus) &&
          renderNoReport()}
        {!loading && reportStatus?.status === "failed" && reportStatus?.errorMessage && (
          <Alert variant="danger" className="mt-3 mb-0">
            {reportStatus.errorMessage}
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        {reportStatus?.status === "completed" && (
          <Button
            variant="outline-primary"
            onClick={handleGenerateReport}
            disabled={generating}
          >
            <RefreshCw size={14} className="me-1" />
            Regenerate
          </Button>
        )}
      </Modal.Footer>

      <style jsx global>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Modal>
  );
};

export default ReportModal;
