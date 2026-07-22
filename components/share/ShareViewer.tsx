"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Badge, Button, Card, Col, Form, Row } from "react-bootstrap";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  GitBranch,
  User,
} from "react-feather";
import Pagination from "@/components/ui/Pagination";
import RepoTabNavigation from "@/sub-components/share/RepoTabNavigation";
import type { ShareCommit, ShareViewData } from "@/src/types/share";

type ShareViewerProps = {
  data: ShareViewData;
  username: string;
  token: string;
  variant?: "full" | "embed";
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
  onRepositoryChange: (repoName: string) => void;
};

const CATEGORY_COLORS: Record<string, string> = {
  feature: "primary",
  feat: "primary",
  fix: "danger",
  bugfix: "danger",
  refactor: "warning",
  docs: "info",
  test: "success",
  chore: "secondary",
};

const PAGE_SIZES = [10, 20, 50];

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleDateString();
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category?.toLowerCase()] || "secondary";
}

function getFilePath(file: ShareCommit["files"][number]): string {
  return typeof file === "string" ? file : file.path;
}

function CommitSummary({ commit, expanded }: { commit: ShareCommit; expanded: boolean }) {
  const hasFiles = commit.files.length > 0;

  return (
    <>
      <span className="flex-grow-1 min-w-0">
        <span className="d-flex flex-wrap align-items-center gap-2 mb-2">
          <Badge bg={getCategoryColor(commit.category)} className="text-uppercase">
            {commit.category || "Other"}
          </Badge>
          <span className="fw-semibold text-dark text-break">{commit.message}</span>
        </span>
        <span className="d-flex flex-wrap align-items-center gap-3 text-muted small">
          <span className="font-monospace bg-light px-2 rounded">{commit.sha.slice(0, 7)}</span>
          <span className="d-flex align-items-center">
            <User size={12} className="me-1" aria-hidden="true" />{commit.author_name}
          </span>
          <span className="d-flex align-items-center">
            <Calendar size={12} className="me-1" aria-hidden="true" />{formatDate(commit.date)}
          </span>
        </span>
      </span>
      {hasFiles ? (
        <span className="text-muted flex-shrink-0" aria-hidden="true">
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>
      ) : null}
    </>
  );
}

export default function ShareViewer({
  data,
  username,
  token,
  variant = "full",
  onPageChange,
  onPageSizeChange,
  onRepositoryChange,
}: ShareViewerProps) {
  const [expandedCommits, setExpandedCommits] = useState<Set<string>>(new Set());
  const [copyFeedback, setCopyFeedback] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const isEmbed = variant === "embed";
  const activeRepository = data.repos.find(
    (repository) => repository.repo_name === data.selected_repo,
  ) || data.repos[0];
  const pageOrigin = typeof window === "undefined" ? "" : window.location.origin;
  const sharePath = `/s/${encodeURIComponent(username)}/${encodeURIComponent(token)}`;
  const fullViewHref = `${sharePath}?repo=${encodeURIComponent(data.selected_repo || "")}`;

  const toggleCommit = (sha: string) => {
    setExpandedCommits((current) => {
      const next = new Set(current);
      if (next.has(sha)) next.delete(sha);
      else next.add(sha);
      return next;
    });
  };

  const copyText = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyFeedback({ variant: "success", message: successMessage });
    } catch {
      setCopyFeedback({
        variant: "danger",
        message: "We could not copy this text. Select it manually and try again.",
      });
    }
  };

  const copyEmbedCode = () => {
    const embedUrl = `${pageOrigin}/embed/${encodeURIComponent(username)}/${encodeURIComponent(token)}`;
    return copyText(
      `<iframe src="${embedUrl}" width="100%" height="500" style="border:0;border-radius:12px;overflow:hidden" title="CommitDiary activity"></iframe>`,
      "Embed code copied to your clipboard.",
    );
  };

  const copyBadgeMarkdown = () => {
    const badgeUrl = `${pageOrigin}/api/badge/${encodeURIComponent(username)}/${encodeURIComponent(token)}`;
    const shareUrl = `${pageOrigin}${sharePath}`;
    return copyText(
      `[![CommitDiary activity](${badgeUrl})](${shareUrl})`,
      "Badge Markdown copied to your clipboard.",
    );
  };

  return (
    <div className={isEmbed ? "bg-white min-vh-100" : "mx-auto"}>
      <header
        className={
          isEmbed
            ? "p-3 border-bottom d-flex justify-content-between align-items-start gap-3 bg-light"
            : "mb-4"
        }
      >
        <div className="min-w-0">
          <h1 className={isEmbed ? "h6 mb-1 fw-bold text-dark text-break" : "h2 fw-bold mb-2 text-dark text-break"}>
            {data.title}
          </h1>
          <div className="d-flex flex-wrap align-items-center gap-2 text-muted small">
            <Badge bg="white" text="dark" className="border">@{data.username}</Badge>
            <span aria-hidden="true">•</span>
            <span>{data.total_commits} commits</span>
            <span aria-hidden="true">•</span>
            <span>{data.total_repos} repositories</span>
          </div>
          {!isEmbed && data.description ? (
            <p className="mt-3 mb-0 text-muted text-break">{data.description}</p>
          ) : null}
        </div>

        {isEmbed ? (
          <Link
            href={fullViewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 flex-shrink-0"
          >
            Full view <ExternalLink size={12} aria-hidden="true" />
            <span className="visually-hidden">(opens in a new tab)</span>
          </Link>
        ) : (
          <div className="d-flex flex-wrap gap-2 mt-3">
            <Button size="sm" variant="outline-secondary" onClick={copyEmbedCode}>
              <Copy size={14} className="me-2" aria-hidden="true" />Copy embed code
            </Button>
            <Button size="sm" variant="primary" onClick={copyBadgeMarkdown}>
              <Copy size={14} className="me-2" aria-hidden="true" />Copy badge Markdown
            </Button>
          </div>
        )}
      </header>

      {copyFeedback ? (
        <Alert
          variant={copyFeedback.variant}
          dismissible
          role={copyFeedback.variant === "danger" ? "alert" : "status"}
          onClose={() => setCopyFeedback(null)}
          className={isEmbed ? "m-3" : ""}
        >
          {copyFeedback.message}
        </Alert>
      ) : null}

      <main className={isEmbed ? "p-3" : ""}>
        {data.repositories.length > 0 ? (
          <>
            {!isEmbed ? (
              <div className="mb-2 d-flex flex-wrap gap-2 align-items-center justify-content-between">
                <h2 className="h5 fw-bold mb-0">Repositories</h2>
                <Badge bg="primary" className="rounded-pill px-3">
                  {data.total_repos} total
                </Badge>
              </div>
            ) : null}

            <RepoTabNavigation
              repos={data.repositories}
              activeRepo={data.selected_repo}
              onSelect={onRepositoryChange}
            />

            {activeRepository ? (
              <Card className="border-0 shadow-sm overflow-hidden mb-4 rounded-4">
                <Card.Header className="bg-white py-3 border-0">
                  <div className="d-flex justify-content-between align-items-center gap-3">
                    <div className="d-flex align-items-center min-w-0">
                      <div className="bg-primary-subtle p-2 rounded-3 me-3 flex-shrink-0">
                        <GitBranch size={20} className="text-primary" aria-hidden="true" />
                      </div>
                      <h2 className="h5 mb-0 fw-bold text-break">
                        {activeRepository.repo_name}
                      </h2>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <div className="fw-bold text-dark">{activeRepository.total_commits}</div>
                      <div className="small text-muted">Commits</div>
                    </div>
                  </div>
                </Card.Header>

                <Card.Body className="p-0">
                  {activeRepository.commits.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {activeRepository.commits.map((commit) => {
                        const expanded = expandedCommits.has(commit.sha);
                        const detailsId = `commit-${commit.sha}-files`;
                        const hasFiles = commit.files.length > 0;
                        return (
                          <article key={commit.sha} className="list-group-item border-start-0 border-end-0 p-0">
                            {hasFiles ? (
                              <button
                                type="button"
                                className="w-100 border-0 bg-white text-start py-3 px-3 px-md-4 d-flex justify-content-between align-items-start gap-3"
                                onClick={() => toggleCommit(commit.sha)}
                                aria-expanded={expanded}
                                aria-controls={detailsId}
                              >
                                <CommitSummary commit={commit} expanded={expanded} />
                              </button>
                            ) : (
                              <div className="w-100 bg-white py-3 px-3 px-md-4 d-flex justify-content-between align-items-start gap-3">
                                <CommitSummary commit={commit} expanded={false} />
                              </div>
                            )}

                            {expanded && hasFiles ? (
                              <div id={detailsId} className="mx-3 mx-md-4 mb-3 pt-3 border-top">
                                <h3 className="h6 text-muted text-uppercase mb-3">Changed files</h3>
                                <div className="d-flex flex-column gap-2">
                                  {commit.files.map((file, index) => {
                                    const filePath = getFilePath(file);
                                    const changeType = typeof file === "string" ? "M" : file.changeType || "M";
                                    return (
                                      <div
                                        key={`${filePath}-${index}`}
                                        className="d-flex align-items-center justify-content-between gap-2 py-2 bg-light rounded px-2"
                                      >
                                        <div className="d-flex align-items-center gap-2 overflow-hidden min-w-0">
                                          <Badge bg={changeType === "A" ? "success" : changeType === "D" ? "danger" : "warning"} text={changeType === "M" ? "dark" : undefined}>
                                            {changeType}
                                          </Badge>
                                          <code className="text-muted text-truncate" title={filePath}>{filePath}</code>
                                        </div>
                                        {typeof file !== "string" ? (
                                          <div className="small flex-shrink-0">
                                            <span className="text-success">+{file.additions || 0}</span>
                                            <span className="mx-1 text-muted">/</span>
                                            <span className="text-danger">-{file.deletions || 0}</span>
                                          </div>
                                        ) : null}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : null}
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted">No commits match this page and filter.</div>
                  )}
                </Card.Body>
              </Card>
            ) : null}

            {!isEmbed && activeRepository && data.pagination.total > 0 ? (
              <Row className="align-items-center gy-3 mb-4">
                <Col md>
                  <Pagination
                    total={data.pagination.total}
                    currentPage={data.pagination.page}
                    pageSize={data.pagination.limit}
                    onChange={onPageChange}
                    className="mb-0"
                  />
                </Col>
                <Col md="auto">
                  <Form.Group controlId="share-page-size" className="d-flex align-items-center gap-2">
                    <Form.Label className="mb-0 text-nowrap">Commits per page</Form.Label>
                    <Form.Select
                      size="sm"
                      value={data.pagination.limit}
                      onChange={(event) => onPageSizeChange(Number(event.target.value))}
                    >
                      {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            ) : null}

            {isEmbed && activeRepository && activeRepository.has_more ? (
              <div className="text-center mb-3">
                <Link
                  href={fullViewHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="small text-decoration-none"
                >
                  View all {activeRepository.total_commits} commits
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </Link>
              </div>
            ) : null}
          </>
        ) : (
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4 text-center">
              <h2 className="h5">No repository activity yet</h2>
              <p className="text-muted mb-0">This share does not contain any repositories.</p>
            </Card.Body>
          </Card>
        )}
      </main>

      <footer className="text-center py-4 border-top mt-4">
        <span className="text-muted small">Activity insights by </span>
        <strong className="text-primary">CommitDiary</strong>
      </footer>
    </div>
  );
}
