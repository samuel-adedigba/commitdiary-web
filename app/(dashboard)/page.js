"use client";
// import node module libraries
import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { Container, Col, Row } from "react-bootstrap";
import { GitCommit, GitBranch, Layers, TrendingUp } from "react-feather";

// import widget/custom components
import {
  ActiveRepositories,
  RecentCommits,
  StatsOverview,
} from "sub-components";

// import API client
import { apiClient } from "/lib/apiClient";
import { useRealtimeCommits } from "/hooks/useRealtimeCommits";

const Home = () => {
  const [metrics, setMetrics] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [recentCommits, setRecentCommits] = useState([]);
  const [loading, setLoading] = useState(true);

  const { commits: realtimeCommits, isConnected } = useRealtimeCommits();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (realtimeCommits?.length > 0) {
      setRecentCommits(realtimeCommits.slice(0, 5));
    }
  }, [realtimeCommits]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsData, reposData, commitsResponse] = await Promise.all([
        apiClient.getAllMetrics("30d"),
        apiClient.getRepositories(),
        apiClient.getCommits({ limit: 5 }),
      ]);

      setMetrics(metricsData);
      setRepositories(Array.isArray(reposData) ? reposData : []);
      setRecentCommits(
        Array.isArray(commitsResponse?.commits) ? commitsResponse.commits : []
      );
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch dashboard data:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const statsData = metrics
    ? [
        {
          id: 1,
          title: "Total Commits",
          value: metrics.total_commits || 0,
          icon: <GitCommit className="fs-4" />,
          iconColorVariant: "primary",
          classValue: "mb-4",
        },
        {
          id: 2,
          title: "Active Repositories",
          value: repositories.length || 0,
          icon: <GitBranch className="fs-4" />,
          iconColorVariant: "success",
          classValue: "mb-4",
        },
        {
          id: 3,
          title: "Categories",
          value: metrics.by_category?.length || 0,
          icon: <Layers className="fs-4" />,
          iconColorVariant: "warning",
          classValue: "mb-4",
        },
        {
          id: 4,
          title: "Commits (Last 7 Days)",
          value: metrics.by_date
            ? metrics.by_date
                .filter((d) => {
                  const date = new Date(d.date);
                  const now = new Date();
                  const diffTime = Math.abs(now - date);
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return diffDays <= 7;
                })
                .reduce((acc, curr) => acc + curr.count, 0)
            : 0,
          icon: <TrendingUp className="fs-4" />,
          iconColorVariant: "info",
          classValue: "mb-4",
        },
      ]
    : [];

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
    const diff = new Date() - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return days < 7 ? `${days}d ago` : date.toLocaleDateString();
  };

  return (
    <Fragment>
      <div className="bg-primary pt-10 pb-21"></div>
      <Container fluid className="mt-n22 px-6">
        <Row>
          <Col lg={12} md={12} xs={12}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <h3 className="mb-0 text-white">CommitDiary Dashboard</h3>
                <p className="mb-0 text-white-50">
                  {isConnected ? "🟢 Live Updates" : "🔴 Offline"}
                </p>
              </div>
              <Link href="/commits" className="btn btn-white">
                View All Commits
              </Link>
            </div>
          </Col>
          {loading ? (
            <Col xs={12} className="mt-6 text-center text-white">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </Col>
          ) : (
            <StatsOverview statsData={statsData} />
          )}
        </Row>

        <Row className="my-6">
          <Col xl={6} lg={12} md={12} xs={12} className="mb-6 mb-xl-0">
            <RecentCommits
              commits={recentCommits}
              getCategoryColor={getCategoryColor}
              formatDate={formatDate}
            />
          </Col>
          <Col xl={6} lg={12} md={12} xs={12}>
            <ActiveRepositories repositories={repositories} />
          </Col>
        </Row>
      </Container>
    </Fragment>
  );
};
export default Home;
