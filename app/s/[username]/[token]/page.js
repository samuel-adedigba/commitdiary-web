"use client";
import { useEffect, useState, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Spinner,
  Accordion,
} from "react-bootstrap";
import {
  Calendar,
  GitBranch,
  User,
  ChevronDown,
  ChevronRight,
} from "react-feather";
import { useParams } from "next/navigation";
import { apiClient } from "/lib/apiClient";

// Import new sub-components
import { UserActivityHeatmap, RepoTabNavigation } from "sub-components";

const PublicSharePage = () => {
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
        limit: 100, // Fetch more for widget feel
      });
      setShareData(data);
      if (data.repos?.length > 0) {
        setActiveRepo(data.repos[0].repo_name);
      }
    } catch (error) {
      setError(
        error.message ||
          "Failed to load share. The link may be invalid, expired, or revoked."
      );
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
      <Container
        fluid
        className="p-6 d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Fetching insights...</p>
        </div>
      </Container>
    );
  }

  if (error || !shareData) {
    return (
      <Container fluid className="p-6">
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-5 text-center">
            <h3 className="text-danger mb-3">Oops! Link unavailable</h3>
            <p className="text-muted">
              {error || "This shareable summary could not be found."}
            </p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container
      fluid
      className="p-4 bg-light"
      style={{ minHeight: "100vh", maxWidth: "1000px" }}
    >
      <Row className="justify-content-center">
        <Col xs={12}>
          {/* Header Widget */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-5 gap-3">
            <div>
              <h2 className="fw-bold mb-1 text-dark">{shareData.title}</h2>
              <div className="d-flex align-items-center gap-2 text-muted small">
                <Badge bg="white" text="dark" className="border shadow-sm">
                  @{shareData.username}
                </Badge>
                <span>•</span>
                <span className="d-flex align-items-center">
                  <Calendar size={14} className="me-1" /> activity report
                </span>
              </div>
            </div>
            <div className="text-md-end d-flex flex-column align-items-md-end gap-2">
              <div>
                <div className="h4 fw-bold text-primary mb-0">
                  {shareData.total_commits}
                </div>
                <div
                  className="small text-muted text-uppercase fw-bold"
                  style={{ letterSpacing: "1px", fontSize: "10px" }}
                >
                  Total Commits
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                <button
                  className="btn btn-sm btn-outline-secondary py-1 px-3 rounded-pill"
                  onClick={() => {
                    const embedCode = `<iframe src="${window.location.origin}/embed/${username}/${token}" width="100%" height="500" style="border:0; border-radius:12px; overflow:hidden;" title="CommitDiary Preview"></iframe>`;
                    navigator.clipboard.writeText(embedCode);
                    alert("Embed code copied to clipboard!");
                  }}
                  style={{ fontSize: "11px" }}
                >
                  Copy Embed Code
                </button>
                <button
                  className="btn btn-sm btn-primary py-1 px-3 rounded-pill shadow-sm"
                  onClick={() => {
                    const badgeMarkdown = `[![CommitActivity](${window.location.origin}/api/badge/${username}/${token})](${window.location.origin}/s/${username}/${token})`;
                    navigator.clipboard.writeText(badgeMarkdown);
                    alert("Badge markdown copied to clipboard!");
                  }}
                  style={{ fontSize: "11px" }}
                >
                  Copy Badge Markdown
                </button>
              </div>
            </div>
          </div>

          {/* Activity Heatmap Widget */}
          {/* <div className="mb-5">
            <UserActivityHeatmap commits={allCommits} />
          </div> */}

          {/* Repository Explorer */}
          <div className="mb-2 d-flex align-items-center justify-content-between">
            <h5 className="fw-bold mb-0">Project Explorer</h5>
            <Badge bg="primary" className="rounded-pill px-3">
              {shareData.total_repos} Total Projects
            </Badge>
          </div>

          <RepoTabNavigation
            repos={shareData.repos}
            activeRepo={activeRepo}
            onSelect={setActiveRepo}
          />

          {/* Active Repo Details */}
          {currentRepoData && (
            <Card
              className="border-0 shadow-sm overflow-hidden mb-4"
              style={{ borderRadius: "15px" }}
            >
              <Card.Header className="bg-white py-3 border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary-soft p-2 rounded-3 me-3">
                      <GitBranch size={20} className="text-primary" />
                    </div>
                    <div>
                      <h5 className="mb-0 fw-bold">
                        {currentRepoData.repo_name}
                      </h5>
                      {/* <small className="text-muted">
                        {currentRepoData.repo_remote || "Local repository"}
                      </small> */}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold text-dark">
                      {currentRepoData.commit_count}
                    </div>
                    <div className="small text-muted">Commits</div>
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="list-group list-group-flush">
                  {currentRepoData.commits?.map((commit) => (
                    <div
                      key={commit.sha}
                      className="list-group-item border-start-0 border-end-0 py-3 px-4"
                    >
                      <div
                        className="d-flex justify-content-between align-items-start"
                        onClick={() => toggleCommit(commit.sha)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="flex-grow-1">
                          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                            <Badge
                              bg={getCategoryColor(commit.category)}
                              className="text-uppercase"
                              style={{ fontSize: "10px" }}
                            >
                              {commit.category}
                            </Badge>
                            <span className="fw-semibold text-dark">
                              {commit.message}
                            </span>
                          </div>
                          <div
                            className="d-flex align-items-center gap-3 text-muted"
                            style={{ fontSize: "12px" }}
                          >
                            <span className="font-monospace bg-light px-2 rounded">
                              {commit.sha.slice(0, 7)}
                            </span>
                            <span className="d-flex align-items-center">
                              <User size={12} className="me-1" />{" "}
                              {commit.author_name}
                            </span>
                            <span className="d-flex align-items-center">
                              <Calendar size={12} className="me-1" />{" "}
                              {new Date(commit.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="ms-3 text-muted">
                          {expandedCommits.has(commit.sha) ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </div>
                      </div>

                      {expandedCommits.has(commit.sha) &&
                        commit.files?.length > 0 && (
                          <div className="mt-4 pt-3 border-top">
                            <div
                              className="fw-bold small text-muted text-uppercase mb-3"
                              style={{
                                fontSize: "10px",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Modified Files
                            </div>
                            <div className="d-flex flex-column gap-2">
                              {commit.files.map((file, idx) => {
                                const filePath =
                                  typeof file === "string" ? file : file.path;
                                const changeType = file.changeType || "M";
                                return (
                                  <div
                                    key={idx}
                                    className="d-flex align-items-center justify-content-between py-1 bg-light-soft rounded px-2"
                                  >
                                    <div className="d-flex align-items-center gap-2 overflow-hidden">
                                      <Badge
                                        bg={
                                          changeType === "A"
                                            ? "success"
                                            : changeType === "D"
                                            ? "danger"
                                            : "warning"
                                        }
                                        style={{
                                          width: "20px",
                                          fontSize: "9px",
                                        }}
                                      >
                                        {changeType}
                                      </Badge>
                                      <code
                                        className="text-muted text-truncate small"
                                        title={filePath}
                                      >
                                        {filePath}
                                      </code>
                                    </div>
                                    <div className="small">
                                      <span className="text-success">
                                        +{file.additions || 0}
                                      </span>
                                      <span className="mx-1 text-muted">/</span>
                                      <span className="text-danger">
                                        -{file.deletions || 0}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Footer Branding */}
          <div className="text-center py-5">
            <div className="d-inline-flex align-items-center px-4 py-2 bg-white rounded-pill shadow-sm border">
              <span className="text-muted small me-2">Insights by</span>
              <span
                className="fw-bold text-primary mb-0"
                style={{ letterSpacing: "-0.5px" }}
              >
                CommitDiary
              </span>
            </div>
            <p className="mt-3 text-muted-50 small">Track. Analyze. Share.</p>
          </div>
        </Col>
      </Row>

      <style jsx global>{`
        .bg-primary-soft {
          background-color: rgba(13, 110, 253, 0.1);
        }
        .bg-light-soft {
          background-color: rgba(0, 0, 0, 0.02);
        }
        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>
    </Container>
  );
};

export default PublicSharePage;
