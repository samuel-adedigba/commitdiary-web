"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Modal, Button, Badge, Spinner, Alert } from "react-bootstrap";
import {
  FileText,
  Zap,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
} from "react-feather";
import { apiClient } from "/lib/apiClient";
import { useRealtimeReports } from "/hooks/useRealtimeReports";

/**
 * Modal component for viewing and generating commit reports
 * Now uses realtime subscriptions for instant updates instead of polling
 */
const ReportModal = ({ show, onHide, commit }) => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportStatus, setReportStatus] = useState(null);
  const [error, setError] = useState(null);
  const pollIntervalRef = useRef(null);
  const fallbackPollIntervalRef = useRef(null);

  // Use realtime subscriptions for instant updates
  const { isConnected, reportData, jobStatus } = useRealtimeReports(
    commit?.id,
    (update) => {
      if (update.type === "report_completed") {
        // Report just completed - refetch to get full status
        fetchReportStatus();
      } else if (update.type === "report_failed") {
        // Job failed - update status
        setReportStatus((prev) => ({
          ...prev,
          status: "failed",
          error_message: update.data?.error_message,
        }));
      }
    },
  );

  // Fetch report status
  const fetchReportStatus = useCallback(async () => {
    if (!commit?.id) return;

    try {
      setLoading(true);
      setError(null);
      const status = await apiClient.getCommitReport(String(commit.id));

      setReportStatus(status);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [commit?.id]);

  // Fetch report status when modal opens
  useEffect(() => {
    if (show && commit?.id) {
      fetchReportStatus();
    }

    // Cleanup polling on unmount or hide
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (fallbackPollIntervalRef.current) {
        clearInterval(fallbackPollIntervalRef.current);
        fallbackPollIntervalRef.current = null;
      }
    };
  }, [show, commit?.id, fetchReportStatus]);

  // Realtime-first polling strategy with fallback
  useEffect(() => {
    const isPending =
      reportStatus?.status === "pending" ||
      reportStatus?.status === "processing";

    if (!isPending) {
      // Not pending - clear any active polling
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (fallbackPollIntervalRef.current) {
        clearInterval(fallbackPollIntervalRef.current);
        fallbackPollIntervalRef.current = null;
      }
      return;
    }

    // If realtime is connected, use slow fallback polling (30s)
    // If not connected, use faster polling (5s) as primary mechanism
    if (isConnected) {
      // Clear fast polling if it exists
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      // Set up slow fallback polling
      fallbackPollIntervalRef.current = setInterval(() => {
        fetchReportStatus();
      }, 30000); // 30 seconds
    } else {
      // Clear fallback polling if it exists
      if (fallbackPollIntervalRef.current) {
        clearInterval(fallbackPollIntervalRef.current);
        fallbackPollIntervalRef.current = null;
      }

      // Set up fast polling as primary
      pollIntervalRef.current = setInterval(() => {
        fetchReportStatus();
      }, 5000); // 5 seconds
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (fallbackPollIntervalRef.current) {
        clearInterval(fallbackPollIntervalRef.current);
        fallbackPollIntervalRef.current = null;
      }
    };
  }, [reportStatus?.status, isConnected, fetchReportStatus]);

  const handleGenerateReport = async () => {
    if (!commit?.id) return;

    try {
      setGenerating(true);
      setError(null);
      const status = await apiClient.triggerCommitReport(String(commit.id));
      setReportStatus(status);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const getStatusBadge = () => {
    if (!reportStatus) return null;

    switch (reportStatus.status) {
      case "completed":
        return (
          <Badge bg="success">
            <CheckCircle size={12} className="me-1" /> Completed
          </Badge>
        );
      case "pending":
      case "processing":
        return (
          <Badge bg="warning">
            <Clock size={12} className="me-1" /> Processing
          </Badge>
        );
      case "failed":
        return (
          <Badge bg="danger">
            <AlertCircle size={12} className="me-1" /> Failed
          </Badge>
        );
      default:
        return <Badge bg="secondary">No Report</Badge>;
    }
  };

  const renderReportContent = () => {
    if (!reportStatus?.report) {
      return null;
    }

    const report = reportStatus.report;

    return (
      <div className="report-content">
        {/* Title */}
        {report.title && <h5 className="mb-3">{report.title}</h5>}

        {/* Summary */}
        {report.summary && (
          <div className="mb-4">
            <h4 className="text-muted mb-2">Summary</h4>
            <p>{report.summary}</p>
          </div>
        )}

        {/* Changes */}
        {report.changes && report.changes.length > 0 && (
          <div className="mb-4">
            <h4 className="text-muted mb-2">Changes</h4>
            <ul className="mb-0">
              {report.changes.map((change, idx) => (
                <li key={idx}>{change}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Rationale */}
        {report.rationale && (
          <div className="mb-4">
            <h4 className="text-muted mb-2">Rationale</h4>
            <p>{report.rationale}</p>
          </div>
        )}

        {/* Impact & Tests */}
        {report.impact_and_tests && (
          <div className="mb-4">
            <h4 className="text-muted mb-2">Impact & Tests</h4>
            <p>{report.impact_and_tests}</p>
          </div>
        )}

        {/* Next Steps */}
        {report.next_steps && report.next_steps.length > 0 && (
          <div className="mb-4">
            <h4 className="text-muted mb-2">Next Steps</h4>
            <ul className="mb-0">
              {report.next_steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Tags */}
        {report.tags && (
          <div className="mb-3">
            <h4 className="text-muted mb-2">Tags</h4>
            <div className="d-flex flex-wrap gap-1">
              {report.tags.split(",").map((tag, idx) => (
                <Badge key={idx} bg="light" text="dark" className="fw-normal">
                  {tag.trim()}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="border-top pt-3 mt-3">
          <small className="text-muted">
            Generated by <strong>{report.provider_used || "AI"}</strong>
            {report.generation_time_ms && (
              <> in {(report.generation_time_ms / 1000).toFixed(2)}s</>
            )}
          </small>
        </div>
      </div>
    );
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
          {getStatusBadge()}
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
                onClick={fetchReportStatus}
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? "spin" : ""} />
              </Button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
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
          renderReportContent()}
        {!loading &&
          (reportStatus?.status === "pending" ||
            reportStatus?.status === "processing") &&
          renderProcessing()}
        {!loading &&
          (reportStatus?.status === "not_found" ||
            reportStatus?.status === "failed" ||
            !reportStatus) &&
          renderNoReport()}
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
