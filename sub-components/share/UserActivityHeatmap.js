import React from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

const UserActivityHeatmap = ({ commits = [] }) => {
  // Generate last 90 days
  const days = [];
  const now = new Date();
  for (let i = 89; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    days.push(date.toISOString().split("T")[0]);
  }

  // Map commits to days
  const dailyCommits = commits.reduce((acc, commit) => {
    const dateKey = (commit.date || commit.created_at || "").split("T")[0];
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {});

  const getIntensity = (count) => {
    if (!count) return 0;
    if (count < 2) return 1;
    if (count < 5) return 2;
    if (count < 10) return 3;
    return 4;
  };

  const colors = [
    "#ebedf0", // level 0
    "#9be9a8", // level 1
    "#40c463", // level 2
    "#30a14e", // level 3
    "#216e39", // level 4
  ];

  return (
    <div className="heatmap-container overflow-hidden p-3 bg-white rounded shadow-sm">
      <h6 className="text-muted mb-3 small text-uppercase fw-bold">
        Recent activity (90 Days)
      </h6>
      <div
        className="d-flex flex-wrap gap-1"
        style={{ maxWidth: "400px", margin: "0 auto" }}
      >
        {days.map((day) => {
          const count = dailyCommits[day] || 0;
          const level = getIntensity(count);

          return (
            <OverlayTrigger
              key={day}
              placement="top"
              overlay={<Tooltip>{`${day}: ${count} commits`}</Tooltip>}
            >
              <div
                className="rounded-1"
                style={{
                  width: "10px",
                  height: "10px",
                  backgroundColor: colors[level],
                  cursor: "pointer",
                }}
              />
            </OverlayTrigger>
          );
        })}
      </div>
      <div className="d-flex justify-content-end align-items-center gap-2 mt-3 small text-muted">
        <span>Less</span>
        <div className="d-flex gap-1">
          {colors.map((c, i) => (
            <div
              key={i}
              style={{ width: "8px", height: "8px", backgroundColor: c }}
              className="rounded-1"
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default UserActivityHeatmap;
