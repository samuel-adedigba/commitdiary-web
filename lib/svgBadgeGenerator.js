const REPO_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

/**
 * Generates a donut chart path.
 */
const describeArc = (x, y, radius, startAngle, endAngle) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
};

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

export const generateBadgeSVG = ({
  repos,
  timeline,
  stats,
  languages = [],
}) => {
  const width = 850;
  const height = 500; // Increased height to prevent overlap

  // Create language tags (tighter spacing)
  const languageTags = languages
    .slice(0, 4)
    .map((lang, i) => {
      const x = i * 95;
      return `<g transform="translate(${x}, 0)">
        <rect width="85" height="22" fill="#f1f5f9" rx="11" />
        <text x="42.5" y="15" font-size="10" font-weight="600" fill="#475569" text-anchor="middle">${lang.name}</text>
      </g>`;
    })
    .join("");

  // Create donut segments
  let currentAngle = 0;
  const donutOuterRadius = 75;
  const donutInnerRadius = 50;
  const donutCenterX = 0;
  const donutCenterY = 0;

  const donutSegments = repos
    .map((repo, i) => {
      const angle = (repo.percentage / 100) * 360;
      if (angle === 0) return "";
      const startOuter = polarToCartesian(
        donutCenterX,
        donutCenterY,
        donutOuterRadius,
        currentAngle
      );
      const endOuter = polarToCartesian(
        donutCenterX,
        donutCenterY,
        donutOuterRadius,
        currentAngle + angle
      );
      const startInner = polarToCartesian(
        donutCenterX,
        donutCenterY,
        donutInnerRadius,
        currentAngle
      );
      const endInner = polarToCartesian(
        donutCenterX,
        donutCenterY,
        donutInnerRadius,
        currentAngle + angle
      );
      const largeArcFlag = angle <= 180 ? "0" : "1";
      const path = `M ${startOuter.x} ${startOuter.y} 
                  A ${donutOuterRadius} ${donutOuterRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}
                  L ${endInner.x} ${endInner.y}
                  A ${donutInnerRadius} ${donutInnerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}
                  Z`;
      currentAngle += angle;
      return `<path d="${path}" fill="${
        REPO_COLORS[i % REPO_COLORS.length]
      }" />`;
    })
    .join("");

  // Create bar chart (recalibrated width to fit)
  const maxCount = Math.max(...timeline.map((t) => t.count), 5);
  const chartWidth = 380; // Reduced to prevent overflow
  const chartHeight = 120; // Reduced to prevent bars touching title
  const barWidth = Math.max(8, Math.floor(chartWidth / timeline.length) - 4);

  const bars = timeline
    .map((t, i) => {
      const isRecent = i === timeline.length - 1;
      const scaledHeight = (t.count / maxCount) * chartHeight;
      const visualHeight = Math.max(barWidth, scaledHeight);
      const x = i * (barWidth + 4);
      const y = -visualHeight;
      // Recency highlight: brighter blue + full opacity if active, otherwise subtle
      const fill = isRecent ? "#60a5fa" : "#3b82f6";
      const opacity = t.count > 0 ? 0.7 + (t.count / maxCount) * 0.3 : 0.1;

      return `<rect x="${x}" y="${y}" width="${barWidth}" height="${visualHeight}" fill="${fill}" rx="${
        barWidth / 2
      }" opacity="${opacity}" />`;
    })
    .join("");

  // Create legend
  const legend = repos
    .map((repo, i) => {
      const y = i * 24;
      const displayName =
        repo.name.length > 20 ? repo.name.substring(0, 17) + "..." : repo.name;
      return `
      <g transform="translate(0, ${y})">
        <rect width="12" height="12" fill="${
          REPO_COLORS[i % REPO_COLORS.length]
        }" rx="3"/>
        <text x="20" y="10" class="legend-text">${displayName} <tspan fill="#94a3b8" font-weight="400">― ${repo.percentage.toFixed(
        1
      )}%</tspan></text>
      </g>`;
    })
    .join("");

  return `
    <svg width="100%" height="auto" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:1" />
        </linearGradient>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&amp;display=swap');
          svg { font-family: 'Poppins', 'Segoe UI', Ubuntu, Sans-Serif; }
          .title { font-weight: 700; font-size: 24px; fill: #1e293b; }
          .subtitle { font-size: 15px; fill: #64748b; }
          .legend-text { font-weight: 600; font-size: 14px; fill: #334155; }
          .axis-label { font-size: 11px; fill: #94a3b8; }
          .stat-value { font-weight: 700; font-size: 32px; fill: #2563eb; }
          .stat-label { font-weight: 600; font-size: 13px; fill: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; }
          .chart-title { font-weight: 700; font-size: 15px; fill: #1e293b; text-transform: uppercase; letter-spacing: 0.8px; }
          .card-bg { filter: drop-shadow(0 4px 10px rgba(0,0,0,0.05)); }
        </style>
      </defs>

      <!-- Layer 1: Background -->
      <rect class="card-bg" width="100%" height="100%" fill="url(#bg-grad)" rx="24" stroke="#e2e8f0" stroke-width="2"/>

      <!-- Layer 2: Header -->
      <g class="header-group" transform="translate(45, 60)">
        <text y="0" class="title">Commit Diary Activity Report</text>
        <text y="28" class="subtitle">@${
          stats.username
        } • Live Activity Insights</text>
      </g>

      <!-- Layer 3: Distribution (Middle Row) -->
      <g class="donut-group" transform="translate(45, 130)">
        <text y="0" class="chart-title">Project Share</text>
        <g transform="translate(75, 90)">${donutSegments}</g>
        <g transform="translate(180, 45)">${legend}</g>
      </g>

      <!-- Layer 4: Activity Timeline (Middle Row) -->
      <g class="timeline-group" transform="translate(460, 130)">
        <text y="0" class="chart-title">Coding activity timeline</text>
        <g transform="translate(0, 160)">
          ${bars}
          <g transform="translate(0, 25)">
            <text class="axis-label">${timeline[0].date}</text>
            <text x="${chartWidth}" class="axis-label" text-anchor="end">${
    timeline[29].date
  }</text>
          </g>
        </g>
      </g>

      <!-- Layer 5: Summary Metrics (Bottom Row) -->
      <g class="stats-group" transform="translate(45, 370)">
        <rect width="760" height="100" fill="#eff6ff" rx="16" />
        
        <!-- Row 1: Counts -->
        <g transform="translate(30, 35)">
          <text class="stat-value" y="5">${stats.totalCommits}</text>
          <text x="75" y="-5" class="stat-label">Total commits</text>
        </g>
        <g transform="translate(260, 35)">
          <text class="stat-value" y="5">${stats.totalRepos}</text>
          <text x="55" y="-5" class="stat-label">Active Projects</text>
        </g>
        
        <!-- Row 2: Languages & Stats Overlay -->
        <g transform="translate(30, 68)">
          <text class="axis-label" y="14" font-weight="600" fill="#64748b">Primary stacks:</text>
          <g transform="translate(100, 0)">
            ${languageTags}
          </g>
        </g>

        <!-- Stats Overlay (Moved here for better space utilization) -->
         <g transform="translate(480, 25)">
             <text class="stat-label" fill="#64748b" font-weight="600">
               Last 30d • ${timeline.reduce(
                 (acc, t) => acc + t.count,
                 0
               )} commits
             </text>
             <g transform="translate(0, 30)">
               <text class="axis-label" y="8" font-weight="600" fill="#64748b">Top Focus:</text>
               ${
                 stats.topCategory
                   ? `<rect x="70" y="-4" width="90" height="22" rx="11" fill="#e0f2fe"/><text x="115" y="11" font-size="11" font-weight="700" fill="#0284c7" text-anchor="middle">${stats.topCategory}</text>`
                   : ""
               }
             </g>
         </g>
        
        <!-- Branding (Shifted to bottom right) -->
        <g transform="translate(740, 80)" text-anchor="end">
          <text x="-15" y="0" font-size="10" fill="#94a3b8">Powered by <tspan font-weight="700" fill="#2563eb" opacity="0.8">CommitDiary</tspan></text>
        </g>
      </g>

      <!-- Recency Indicator (Top Right) -->
      <g transform="translate(720, 60)">
         <circle cx="0" cy="-5" r="4" fill="${
           stats.daysSinceLastActive <= 1
             ? "#22c55e"
             : stats.daysSinceLastActive <= 7
             ? "#f59e0b"
             : "#94a3b8"
         }" />
         <text x="10" y="0" font-size="12" font-weight="600" fill="#64748b">
           Active: ${
             stats.daysSinceLastActive === 0
               ? "Today"
               : stats.daysSinceLastActive + "d ago"
           }
         </text>
      </g>
    </svg>
  `;
};
