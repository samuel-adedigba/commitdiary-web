"use client";
import { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, Badge, Spinner } from "react-bootstrap";
import {
  Calendar,
  GitBranch,
  User,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "react-feather";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "/lib/apiClient";

// Import sub-components
import { UserActivityHeatmap, RepoTabNavigation } from "sub-components";

const EmbedSharePage = () => {
  const params = useParams();
  const { username, token } = params;

  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeRepo, setActiveRepo] = useState(null);
  const [expandedCommits, setExpandedCommits] = useState(new Set());

  useEffect(() => {
    fetchShare();
  }, [username, token]);

  const fetchShare = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiClient.getPublicShare(username, token, {
        page: 1,
        limit: 100,
      });
      setShareData(data);
      if (data.repos?.length > 0) {
        setActiveRepo(data.repos[0].repo_name);
      }
    } catch (error) {
      setError(error.message || "Failed to load share.");
    } finally {
      setLoading(false);
    }
  };

  const currentRepoData = useMemo(() => {
    return shareData?.repos?.find((r) => r.repo_name === activeRepo);
  }, [shareData, activeRepo]);

  const allCommits = useMemo(() => {
    if (!shareData?.repos) return [];
    return shareData.repos.flatMap((r) => r.commits || []);
  }, [shareData]);

  const toggleCommit = (commitSha) => {
    const newExpanded = new Set(expandedCommits);
    if (newExpanded.has(commitSha)) {
      newExpanded.delete(commitSha);
    } else {
      newExpanded.add(commitSha);
    }
    setExpandedCommits(newExpanded);
  };

  const getCategoryColor = (category) => {
    const colors = {
      feature: "primary",
      bugfix: "danger",
      refactor: "warning",
      docs: "info",
      test: "success",
      chore: "secondary",
    };
    return colors[category?.toLowerCase()] || "secondary";
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center bg-white"
        style={{ minHeight: "300px" }}
      >
        <Spinner animation="border" variant="primary" size="sm" />
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="p-4 text-center bg-white border rounded">
        <small className="text-danger">{error || "Preview not found"}</small>
      </div>
    );
  }

  return (
    <div className="bg-white" style={{ minHeight: "100vh" }}>
      {/* Compact Header */}
      <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light-soft">
        <div>
          <h6 className="mb-0 fw-bold text-dark">{shareData.title}</h6>
          <small className="text-muted">@{shareData.username}</small>
        </div>
        <Link
          href={`/s/${username}/${token}`}
          target="_blank"
          className="btn btn-sm btn-outline-primary py-0 px-2 d-flex align-items-center gap-1"
          style={{ fontSize: "10px" }}
        >
          Full View <ExternalLink size={10} />
        </Link>
      </div>

      <div className="p-3">
        {/* Heatmap Section */}
        <div className="mb-4">
          <UserActivityHeatmap commits={allCommits} />
        </div>

        {/* Tab Navigation */}
        <RepoTabNavigation
          repos={shareData.repos}
          activeRepo={activeRepo}
          onSelect={setActiveRepo}
        />

        {/* Repository Content */}
        {currentRepoData && (
          <div className="mt-3">
            <div className="d-flex justify-content-between align-items-end mb-2 px-1">
              <span
                className="small text-muted fw-bold text-uppercase"
                style={{ fontSize: "9px" }}
              >
                Commits in {activeRepo}
              </span>
              <span
                className="badge bg-primary rounded-pill"
                style={{ fontSize: "9px" }}
              >
                {currentRepoData.commit_count}
              </span>
            </div>

            <div className="list-group list-group-flush border rounded-3 overflow-hidden shadow-sm">
              {currentRepoData.commits?.slice(0, 10).map((commit) => (
                <div key={commit.sha} className="list-group-item p-2">
                  <div
                    className="d-flex justify-content-between align-items-start"
                    onClick={() => toggleCommit(commit.sha)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex align-items-center gap-1 mb-1">
                        <Badge
                          bg={getCategoryColor(commit.category)}
                          style={{ fontSize: "8px", padding: "2px 4px" }}
                        >
                          {commit.category}
                        </Badge>
                        <span
                          className="fw-semibold text-dark text-truncate small"
                          style={{ fontSize: "11px" }}
                        >
                          {commit.message}
                        </span>
                      </div>
                      <div
                        className="d-flex align-items-center gap-2 text-muted"
                        style={{ fontSize: "9px" }}
                      >
                        <span className="font-monospace">
                          {commit.sha.slice(0, 7)}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(commit.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="ms-2 text-muted">
                      {expandedCommits.has(commit.sha) ? (
                        <ChevronDown size={12} />
                      ) : (
                        <ChevronRight size={12} />
                      )}
                    </div>
                  </div>

                  {expandedCommits.has(commit.sha) &&
                    commit.files?.length > 0 && (
                      <div className="mt-2 pt-2 border-top">
                        {commit.files.slice(0, 5).map((file, idx) => {
                          const filePath =
                            typeof file === "string" ? file : file.path;
                          const changeType = file.changeType || "M";
                          return (
                            <div
                              key={idx}
                              className="d-flex align-items-center justify-content-between py-1 px-1 rounded bg-light-soft mb-1"
                              style={{ fontSize: "9px" }}
                            >
                              <span
                                className="text-truncate me-2"
                                title={filePath}
                              >
                                {filePath.split("/").pop()}
                              </span>
                              <Badge
                                bg={
                                  changeType === "A"
                                    ? "success"
                                    : changeType === "D"
                                    ? "danger"
                                    : "warning"
                                }
                                size="sm"
                                style={{ fontSize: "7px" }}
                              >
                                {changeType}
                              </Badge>
                            </div>
                          );
                        })}
                        {commit.files.length > 5 && (
                          <div
                            className="text-center text-muted mt-1"
                            style={{ fontSize: "8px" }}
                          >
                            + {commit.files.length - 5} more files
                          </div>
                        )}
                      </div>
                    )}
                </div>
              ))}
              {currentRepoData.commits?.length > 10 && (
                <div className="list-group-item text-center bg-light py-2">
                  <Link
                    href={`/s/${username}/${token}`}
                    target="_blank"
                    className="small text-primary text-decoration-none"
                    style={{ fontSize: "10px" }}
                  >
                    View all {currentRepoData.commit_count} commits on dashboard
                    →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Subtle Footer */}
        <div className="text-center mt-4 pb-2 border-top pt-3">
          <small className="text-muted-50" style={{ fontSize: "9px" }}>
            powered by <strong>CommitDiary</strong>
          </small>
        </div>
      </div>

      <style jsx global>{`
        body {
          background-color: transparent !important;
        }
        .bg-light-soft {
          background-color: rgba(0, 0, 0, 0.02);
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default EmbedSharePage;
