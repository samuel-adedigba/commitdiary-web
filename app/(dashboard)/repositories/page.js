"use client";
import { Fragment, useEffect, useState, useMemo } from "react";
import { Container, Col, Row, Card, Badge, Button } from "react-bootstrap";
import { GitBranch, RefreshCw, Calendar } from "react-feather";
import { apiClient } from "/lib/apiClient";
import { DataTable } from "components/DataTable";

const RepositoriesPage = () => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getRepositories();
      setRepositories(data);
    } catch (error) {
      console.error("Failed to fetch repositories:", error);
    } finally {
      setLoading(false);
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

  // DataTable columns definition
  const columns = useMemo(
    () => [
      {
        header: "Repository",
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="d-flex align-items-center">
            <GitBranch size={18} className="text-primary me-2" />
            <div>
              <div className="fw-semibold">{row.original.name}</div>
              {row.original.description && (
                <small className="text-muted">{row.original.description}</small>
              )}
            </div>
          </div>
        ),
      },
      // {
      //   header: "Branch",
      //   accessorKey: "branch",
      //   cell: ({ row }) =>
      //     row.original.branch ? (
      //       <Badge bg="light" text="dark">
      //         {row.original.branch}
      //       </Badge>
      //     ) : (
      //       <span className="text-muted">-</span>
      //     ),
      // },
      // {
      //   header: "Remote",
      //   accessorKey: "remote_url",
      //   cell: ({ row }) =>
      //     row.original.remote_url ? (
      //       <Badge bg="secondary">
      //         {new URL(row.original.remote_url).hostname}
      //       </Badge>
      //     ) : (
      //       <span className="text-muted">Local</span>
      //     ),
      // },
      {
        header: "Commits",
        accessorKey: "commit_count",
        cell: ({ row }) => (
          <strong className="text-primary">
            {row.original.commit_count || 0}
          </strong>
        ),
      },
      {
        header: "Last Sync",
        accessorKey: "last_sync_at",
        cell: ({ row }) => (
          <div className="d-flex align-items-center gap-2">
            <Calendar size={14} className="text-muted" />
            <small className="text-muted">
              {formatDate(row.original.last_sync_at || row.original.updated_at)}
            </small>
          </div>
        ),
      },
      {
        header: "Path",
        accessorKey: "path",
        cell: ({ row }) =>
          row.original.path ? (
            <small
              className="text-muted font-monospace text-truncate d-block"
              style={{ maxWidth: "250px" }}
            >
              {row.original.path}
            </small>
          ) : (
            <span className="text-muted">-</span>
          ),
      },
    ],
    []
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
