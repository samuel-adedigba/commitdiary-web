"use client";

const LOG_LEVEL = process.env.LOG_LEVEL || "error";
function logDebug(...args) {
  if (LOG_LEVEL === "debug") console.log(...args);
}
function logError(...args) {
  if (LOG_LEVEL === "debug" || LOG_LEVEL === "error") console.error(...args);
}

import { Fragment, useEffect, useState, useMemo } from "react";
import {
  Container,
  Col,
  Row,
  Card,
  Badge,
  Button,
  Form,
  InputGroup,
} from "react-bootstrap";
import { Search, Calendar, Filter } from "react-feather";
import { apiClient } from "/lib/apiClient";
import { useRealtimeCommits } from "/hooks/useRealtimeCommits";
import { DataTable } from "components/DataTable";

const CommitsPage = () => {
  const [commits, setCommits] = useState([]);
  const [totalCommits, setTotalCommits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Real-time subscription
  const { commits: realtimeCommits, isConnected } = useRealtimeCommits();

  const fetchCommits = async (page = currentPage, size = pageSize) => {
    try {
      setLoading(true);
      const params = {
        limit: size,
        offset: (page - 1) * size,
      };

      if (dateRange !== "all") {
        if (dateRange === "custom") {
          if (customStartDate)
            params.from = new Date(customStartDate).toISOString();
          if (customEndDate) params.to = new Date(customEndDate).toISOString();
        } else {
          const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
          const date = new Date();
          date.setDate(date.getDate() - days);
          params.from = date.toISOString();
        }
      }
      if (categoryFilter !== "all") {
        params.category = categoryFilter;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await apiClient.getCommits(params);
      logDebug("[Commits Page] Fetched commits:", response);
      logDebug("[Commits Page] Total commits:", response.total);
      logDebug("[Commits Page] Commits length:", response.commits?.length);

      setCommits(response.commits || []);
      const total = response.total || response.commits?.length || 0;
      logDebug("[Commits Page] Setting totalCommits to:", total);
      setTotalCommits(total);
    } catch (error) {
      logError("Failed to fetch commits:", error);
      setCommits([]);
      setTotalCommits(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters change
    const timeoutId = setTimeout(() => {
      fetchCommits(1, pageSize);
    }, 500); // Debounce search
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, categoryFilter, customStartDate, customEndDate, searchTerm]);

  // Fetch when page or page size changes
  useEffect(() => {
    fetchCommits(currentPage, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  // Handle realtime updates - prepend new commits to first page only
  useEffect(() => {
    if (realtimeCommits && realtimeCommits.length > 0 && currentPage === 1) {
      setCommits((prevCommits) => {
        const existingIds = new Set(prevCommits.map((c) => c.id));
        const newCommits = realtimeCommits.filter(
          (c) => !existingIds.has(c.id)
        );
        if (newCommits.length > 0) {
          setTotalCommits((prev) => prev + newCommits.length);
          return [...newCommits, ...prevCommits].slice(0, pageSize);
        }
        return prevCommits;
      });
    }
  }, [realtimeCommits, currentPage, pageSize]);

  const getCategoryColor = (category) => {
    const colors = {
      feature: "success",
      bugfix: "danger",
      refactor: "warning",
      docs: "info",
      test: "secondary",
      chore: "dark",
    };
    return colors[category?.toLowerCase()] || "primary";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // DataTable columns definition
  const columns = useMemo(
    () => [
      {
        header: "Message",
        accessorKey: "message",
        cell: ({ row }) => (
          <div className="d-flex flex-column">
            <span
              className="fw-semibold text-truncate"
              style={{ maxWidth: "300px" }}
            >
              {row.original.message}
            </span>
            <small className="text-muted font-monospace">
              {row.original.commit_hash?.substring(0, 7)}
            </small>
          </div>
        ),
      },
      {
        header: "Repository",
        accessorKey: "repo_name",
        cell: ({ row }) => (
          <span className="text-dark fw-medium">{row.original.repo_name}</span>
        ),
      },
      {
        header: "Category",
        accessorKey: "category",
        cell: ({ row }) => (
          <Badge bg={getCategoryColor(row.original.category)}>
            {row.original.category || "uncategorized"}
          </Badge>
        ),
      },
      {
        header: "Files",
        accessorKey: "files_changed",
        cell: ({ row }) => (
          <span className="text-muted">
            {row.original.files?.length || 0} files
          </span>
        ),
      },
      // {
      //   header: "Impact",
      //   accessorKey: "additions",
      //   cell: ({ row }) => (
      //     <div className="d-flex align-items-center gap-2">
      //       <small className="text-success">
      //         +{row.original.additions || 0}
      //       </small>
      //       <small className="text-danger">
      //         -{row.original.deletions || 0}
      //       </small>
      //     </div>
      //   ),
      // },
      {
        header: "Committed At",
        accessorKey: "committed_at",
        cell: ({ row }) => (
          <small className="text-muted">
            {formatDate(row.original.date || row.original.created_at)}
          </small>
        ),
      },
      {
        header: "Synced At",
        accessorKey: "synced_at",
        cell: ({ row }) => (
          <small className="text-muted">
            {formatDate(row.original.synced_at || row.original.created_at)}
          </small>
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
                <h3 className="mb-0 text-white">Commit History</h3>
                <p className="mb-0 text-white-50">
                  {isConnected ? "🟢 Live" : "🔴 Offline"} · {totalCommits}{" "}
                  total commits
                </p>
              </div>
              <div>
                <Button
                  variant="white"
                  onClick={() => fetchCommits(currentPage, pageSize)}
                  disabled={loading}
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col xl={4} lg={6} md={6} xs={12}>
            <InputGroup>
              <InputGroup.Text>
                <Search size={16} />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search commits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Col>
          <Col xl={3} lg={6} md={6} xs={12} className="mt-3 mt-md-0">
            <Form.Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="feature">Feature</option>
              <option value="bugfix">Bugfix</option>
              <option value="refactor">Refactor</option>
              <option value="docs">Documentation</option>
              <option value="test">Tests</option>
              <option value="chore">Chore</option>
            </Form.Select>
          </Col>
          <Col xl={3} lg={6} md={6} xs={12} className="mt-3 mt-xl-0">
            <Form.Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </Form.Select>
          </Col>
          {dateRange === "custom" && (
            <Col
              xl={3}
              lg={12}
              md={12}
              xs={12}
              className="mt-3 mt-xl-0 d-flex gap-2"
            >
              <Form.Control
                type="date"
                placeholder="Start Date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
              <Form.Control
                type="date"
                placeholder="End Date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </Col>
          )}
        </Row>

        <Row>
          <Col lg={12} md={12} xs={12}>
            <Card>
              <Card.Body className="p-0">
                <DataTable
                  columns={columns}
                  data={commits}
                  loading={loading}
                  noData={commits.length === 0}
                  pagingData={{
                    total: totalCommits,
                    pageIndex: currentPage,
                    pageSize: pageSize,
                  }}
                  onPaginationChange={(page) => setCurrentPage(page)}
                  onSelectChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  pageSizes={[10, 25, 50, 100]}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Fragment>
  );
};

export default CommitsPage;
