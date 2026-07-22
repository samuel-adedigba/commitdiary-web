// Layout mirrors assets/svg/commit_diary_badge_pro.html, but renders as pure SVG
// so the badge remains portable in external embeds and image contexts.
const REPO_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#06b6d4",
  "#f59e0b",
  "#ef4444",
  "#10b981",
  "#ec4899",
  "#f97316",
];

const escapeXml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const truncate = (value, max) => {
  const input = String(value ?? "");
  return input.length > max ? `${input.slice(0, max - 1)}...` : input;
};

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const describeDonutArc = (startAngle, endAngle, outerRadius, innerRadius) => {
  const startOuter = polarToCartesian(0, 0, outerRadius, startAngle);
  const endOuter = polarToCartesian(0, 0, outerRadius, endAngle);
  const startInner = polarToCartesian(0, 0, innerRadius, startAngle);
  const endInner = polarToCartesian(0, 0, innerRadius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? "1" : "0";

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
};

const formatDateLabel = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatGeneratedLabel = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};

const getStatusLabel = (daysSinceLastActive) => {
  if (typeof daysSinceLastActive !== "number") return "No recent activity";
  if (daysSinceLastActive === 0) return "Active today";
  if (daysSinceLastActive === 1) return "Active yesterday";
  if (typeof daysSinceLastActive === "number" && daysSinceLastActive < 7) {
    return `Active ${daysSinceLastActive}d ago`;
  }
  return "Recently active";
};

const getHeatColor = (count, maxCount) => {
  if (!count) return "#4b5563";
  const ratio = maxCount > 0 ? count / maxCount : 0;
  if (ratio > 0.75) return "#3b82f6";
  if (ratio > 0.5) return "#60a5fa";
  if (ratio > 0.25) return "#93c5fd";
  return "#bfdbfe";
};

export const generateBadgeSVG = ({ repos, timeline, stats, languages = [] }) => {
  const width = 1480;
  const height = 1960;
  const outerPad = 70;
  const contentWidth = width - outerPad * 2;
  const maxTimelineCount = Math.max(1, ...timeline.map((item) => item.count || 0));
  const activeDays = stats.activeDays || 0;
  const avgPerDay = stats.avgPerActiveDay || 0;
  const username = stats.username ? `@${stats.username}` : "@commitdiary";
  const statusLabel = getStatusLabel(stats.daysSinceLastActive);
  const generatedLabel = formatGeneratedLabel(stats.generatedAt);
  const startLabel = formatDateLabel(timeline[0]?.date);
  const endLabel = formatDateLabel(timeline[timeline.length - 1]?.date);

  const gap = 24;
  const statCardWidth = Math.floor((contentWidth - gap * 3) / 4);
  const topY = 240;
  const statCardHeight = 220;

  const weeklyDeltaIsNegative = String(stats.weeklyDelta || "").startsWith("-");
  const statCards = [
    {
      x: outerPad,
      y: topY,
      color: "#3b82f6",
      label: "TOTAL\nCOMMITS",
      value: String(stats.totalCommits || 0),
      delta: `${stats.weeklyDelta || "0%"} this week`,
      deltaColor: weeklyDeltaIsNegative ? "#f87171" : "#22c55e",
    },
    {
      x: outerPad + (statCardWidth + gap) * 1,
      y: topY,
      color: "#8b5cf6",
      label: "ACTIVE\nPROJECTS",
      value: String(stats.totalRepos || 0),
      delta: `${stats.totalRepos || 0} active`,
      deltaColor: "#bfb8ad",
    },
    {
      x: outerPad + (statCardWidth + gap) * 2,
      y: topY,
      color: "#06b6d4",
      label: "AVG/DAY",
      value: avgPerDay.toFixed(1),
      delta: "commits per active day",
      deltaColor: "#bfb8ad",
    },
    {
      x: outerPad + (statCardWidth + gap) * 3,
      y: topY,
      color: "#f59e0b",
      label: "ACTIVE\nDAYS",
      value: `${activeDays}/30`,
      delta: "this month",
      deltaColor: "#bfb8ad",
    },
  ];

  const statCardSvg = statCards
    .map((card) => {
      const lines = card.label.split("\n");
      return `
        <g transform="translate(${card.x}, ${card.y})">
          <rect width="${statCardWidth}" height="${statCardHeight}" rx="22" fill="#262624" stroke="#44403c" stroke-width="1.2"/>
          <rect width="${statCardWidth}" height="4" rx="22" fill="${card.color}"/>
          <text x="28" y="48" fill="#c7c2b8" font-size="22" letter-spacing="2">${escapeXml(lines[0])}</text>
          ${lines[1] ? `<text x="28" y="74" fill="#c7c2b8" font-size="22" letter-spacing="2">${escapeXml(lines[1])}</text>` : ""}
          <text x="28" y="138" fill="#f5f3ef" font-size="56" font-weight="500">${escapeXml(card.value)}</text>
          <text x="28" y="182" fill="${card.deltaColor}" font-size="20">${escapeXml(card.delta)}</text>
        </g>
      `;
    })
    .join("");

  const row2Y = topY + statCardHeight + 36;
  const chartH = 400;
  const leftW = 270;
  const midW = 270;
  const rightW = contentWidth - leftW - midW - gap * 2;
  const x1 = outerPad;
  const x2 = x1 + leftW + gap;
  const x3 = x2 + midW + gap;
  const langY = row2Y + chartH + 34;
  const langH = 260;
  const bottomY = langY + langH + 34;

  const timelineBars = timeline
    .map((item, index) => {
      const barAreaX = x1 + 34;
      const barAreaY = row2Y + chartH - 68;
      const barWidth = 5;
      const barGap = 3;
      const chartHeight = 170;
      const barHeight = Math.max(4, Math.round((item.count / maxTimelineCount) * chartHeight));
      const x = barAreaX + index * (barWidth + barGap);
      const y = barAreaY - barHeight;
      return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="2.5" fill="#3b82f6" opacity="${item.count ? 1 : 0.18}"/>`;
    })
    .join("");

  const heatColumns = 5;
  const heatCell = 26;
  const heatGap = 10;
  const heatRows = Math.ceil(timeline.length / heatColumns);
  const heatGridWidth = heatColumns * heatCell + (heatColumns - 1) * heatGap;
  const heatGridHeight = heatRows * heatCell + (heatRows - 1) * heatGap;
  const heatGridStartX = x2 + Math.floor((midW - heatGridWidth) / 2);
  const heatTopBound = row2Y + 110;
  const heatBottomBound = row2Y + chartH - 86;
  const heatGridStartY = heatTopBound + Math.floor((heatBottomBound - heatTopBound - heatGridHeight) / 2);
  const heatmapCells = timeline
    .map((item, index) => {
      const col = index % heatColumns;
      const row = Math.floor(index / heatColumns);
      const x = heatGridStartX + col * (heatCell + heatGap);
      const y = heatGridStartY + row * (heatCell + heatGap);
      return `<rect x="${x}" y="${y}" width="${heatCell}" height="${heatCell}" rx="4" fill="${getHeatColor(
        item.count,
        maxTimelineCount
      )}" opacity="${item.count ? 1 : 0.35}"/>`;
    })
    .join("");

  let currentAngle = 0;
  const donutRepos = repos.slice(0, 5);
  const donutSegments = donutRepos.length === 1
    ? `<circle r="67" fill="none" stroke="${REPO_COLORS[0]}" stroke-width="38"/>`
    : donutRepos.map((repo, index) => {
      const angle = ((repo.percentage || 0) / 100) * 360;
      const path = describeDonutArc(currentAngle, currentAngle + angle, 86, 48);
      currentAngle += angle;
      return `<path d="${path}" fill="${REPO_COLORS[index % REPO_COLORS.length]}"/>`;
      })
      .join("");

  const donutLegend = repos
    .slice(0, 5)
    .map((repo, index) => {
      const y = row2Y + 130 + index * 50;
      return `
        <rect x="${x3 + 330}" y="${y - 12}" width="16" height="16" rx="4" fill="${REPO_COLORS[index % REPO_COLORS.length]}"/>
        <text x="${x3 + 360}" y="${y + 2}" fill="#c7c2b8" font-size="24">${escapeXml(truncate(repo.name, 24))}</text>
        <text x="${x3 + rightW - 34}" y="${y + 2}" fill="#f5f3ef" font-size="24" text-anchor="end">${Math.round(repo.percentage || 0)}%</text>
      `;
    })
    .join("");

  const languageBase = languages.slice(0, 6);
  const languageTotal = Math.max(1, languageBase.reduce((sum, item) => sum + (item.percentage || 0), 0));
  let langOffset = 0;
  const languageSegments = languageBase
    .map((language) => {
      const normalized = Math.max(4, language.percentage || 0);
      const segmentWidth = (normalized / Math.max(100, languageTotal)) * (contentWidth - 48);
      const svg = `<rect x="${outerPad + 24 + langOffset}" y="${langY + 62}" width="${segmentWidth}" height="20" fill="${language.color}" />`;
      langOffset += segmentWidth;
      return svg;
    })
    .join("");

  const languageTags = languageBase
    .map((language, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = outerPad + 24 + col * 430;
      const y = langY + 110 + row * 66;
      const w = 408;
      return `
        <g transform="translate(${x}, ${y})">
          <rect width="${w}" height="46" rx="23" fill="#2d2d2a" stroke="#4b4b47" stroke-width="1.1"/>
          <circle cx="28" cy="23" r="7" fill="${language.color || REPO_COLORS[index % REPO_COLORS.length]}"/>
          <text x="48" y="30" fill="#d0cbc1" font-size="22">${escapeXml(language.name)}</text>
          <text x="${w - 20}" y="30" fill="#948d82" font-size="20" text-anchor="end">${Math.round(
            language.percentage || 0
          )}%</text>
        </g>
      `;
    })
    .join("");
  const streakW = 390;
  const recentW = contentWidth - streakW - gap;
  const streakCols = 4;
  const streakDotSize = 24;
  const streakDotGap = 8;
  const streakRows = Math.ceil(30 / streakCols);
  const streakGridWidth = streakCols * streakDotSize + (streakCols - 1) * streakDotGap;
  const streakGridHeight = streakRows * streakDotSize + (streakRows - 1) * streakDotGap;
  const streakGridAreaX = outerPad + 228;
  const streakGridAreaY = bottomY + 206;
  const streakGridAreaW = streakW - 252;
  const streakGridAreaH = 520 - 242;
  const streakGridStartX = streakGridAreaX + Math.floor((streakGridAreaW - streakGridWidth) / 2);
  const streakGridStartY = streakGridAreaY + Math.floor((streakGridAreaH - streakGridHeight) / 2);
  const streakDots = Array.from({ length: 30 }, (_, index) => {
    const col = index % streakCols;
    const row = Math.floor(index / streakCols);
    const x = streakGridStartX + col * (streakDotSize + streakDotGap);
    const y = streakGridStartY + row * (streakDotSize + streakDotGap);
    const active = Boolean(stats.monthlyActivity?.[index]);
    return `<rect x="${x}" y="${y}" width="${streakDotSize}" height="${streakDotSize}" rx="5" fill="${active ? "#3b82f6" : "#4b4b47"}"/>`;
  }).join("");

  const recentCommitItems = (stats.recentCommits || [])
    .slice(0, 4)
    .map((commit, index) => {
      const y = bottomY + 92 + index * 48;
      return `
        <circle cx="${outerPad + streakW + gap + 32}" cy="${y - 8}" r="7" fill="${commit.color || "#3b82f6"}"/>
        <text x="${outerPad + streakW + gap + 54}" y="${y}" fill="#f5f3ef" font-size="28">${escapeXml(
          truncate(commit.message, 44)
        )}</text>
        <text x="${outerPad + streakW + gap + recentW - 26}" y="${y}" fill="#b1aba0" font-size="22" text-anchor="end">${escapeXml(
          commit.time
        )}</text>
      `;
    })
    .join("");

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="badge-title badge-description">
      <title id="badge-title">CommitDiary activity report for ${escapeXml(username)}</title>
      <desc id="badge-description">${escapeXml(stats.totalCommits || 0)} commits across ${escapeXml(stats.totalRepos || 0)} repositories, with recent activity and language summaries.</desc>
      <defs>
        <linearGradient id="badge-border" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3b82f6"/>
          <stop offset="50%" stop-color="#8b5cf6"/>
          <stop offset="100%" stop-color="#06b6d4"/>
        </linearGradient>
        <linearGradient id="inner-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#343431"/>
          <stop offset="100%" stop-color="#2f2f2c"/>
        </linearGradient>
        <radialGradient id="top-orb" cx="0%" cy="0%">
          <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="bottom-orb" cx="100%" cy="100%">
          <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.16"/>
          <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0"/>
        </radialGradient>
        <style>
          text {
            font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
          }
        </style>
      </defs>

      <rect width="${width}" height="${height}" rx="30" fill="url(#badge-border)"/>
      <rect x="4" y="4" width="${width - 8}" height="${height - 8}" rx="28" fill="url(#inner-glow)"/>
      <circle cx="${width - 220}" cy="140" r="260" fill="url(#top-orb)"/>
      <circle cx="140" cy="${height - 100}" r="220" fill="url(#bottom-orb)"/>

      <text x="${outerPad}" y="98" fill="#f5f3ef" font-size="52" font-weight="500">Commit Diary · Activity Report</text>
      <circle cx="${width - outerPad - 619}" cy="86" r="9" fill="#22c55e"/>
      <circle cx="${width - outerPad - 619}" cy="86" r="14" fill="none" stroke="#22c55e" stroke-width="2.5" opacity="0.45"/>
      <text x="${width - outerPad - 595}" y="94" fill="#c7c2b8" font-size="28">${escapeXml(statusLabel)}</text>
      <rect x="${width - outerPad - 320}" y="58" width="320" height="54" rx="27" fill="#31312e" stroke="#4a4a46" stroke-width="1.2"/>
      <text x="${width - outerPad - 160}" y="94" fill="#d4cec3" font-size="28" text-anchor="middle">${escapeXml(username)}</text>

      <text x="${outerPad}" y="168" fill="#c7c2b8" font-size="30">Developer productivity snapshot · Last 30 days</text>

      ${statCardSvg}

      <g>
        <rect x="${x1}" y="${row2Y}" width="${leftW}" height="${chartH}" rx="24" fill="#262624" stroke="#44403c" stroke-width="1.2"/>
        <text x="${x1 + 34}" y="${row2Y + 52}" fill="#c7c2b8" font-size="26" letter-spacing="2">DAILY</text>
        <text x="${x1 + 34}" y="${row2Y + 84}" fill="#c7c2b8" font-size="26" letter-spacing="2">COMMITS</text>
        <text x="${x1 + 34}" y="${row2Y + 118}" fill="#c7c2b8" font-size="24" letter-spacing="2">· 30D</text>
        ${timelineBars}
        <text x="${x1 + 34}" y="${row2Y + chartH - 30}" fill="#c7c2b8" font-size="24">${escapeXml(startLabel)}</text>
        <text x="${x1 + leftW - 34}" y="${row2Y + chartH - 30}" fill="#c7c2b8" font-size="24" text-anchor="end">${escapeXml(endLabel)}</text>
      </g>

      <g>
        <rect x="${x2}" y="${row2Y}" width="${midW}" height="${chartH}" rx="24" fill="#262624" stroke="#44403c" stroke-width="1.2"/>
        <text x="${x2 + 34}" y="${row2Y + 52}" fill="#c7c2b8" font-size="26" letter-spacing="2">ACTIVITY</text>
        <text x="${x2 + 34}" y="${row2Y + 84}" fill="#c7c2b8" font-size="26" letter-spacing="2">HEATMAP</text>
        ${heatmapCells}
        <text x="${x2 + 34}" y="${row2Y + chartH - 54}" fill="#c7c2b8" font-size="24">Mon</text>
        <text x="${x2 + midW - 34}" y="${row2Y + chartH - 54}" fill="#c7c2b8" font-size="24" text-anchor="end">→ Today</text>
      </g>

      <g>
        <rect x="${x3}" y="${row2Y}" width="${rightW}" height="${chartH}" rx="24" fill="#262624" stroke="#44403c" stroke-width="1.2"/>
        <text x="${x3 + 32}" y="${row2Y + 52}" fill="#c7c2b8" font-size="30" letter-spacing="2">PROJECT DISTRIBUTION</text>
        <g transform="translate(${x3 + 190}, ${row2Y + 210})">${donutSegments}</g>
        <circle cx="${x3 + 190}" cy="${row2Y + 210}" r="48" fill="#262624"/>
        ${donutLegend}
      </g>

      <g>
        <rect x="${outerPad}" y="${langY}" width="${contentWidth}" height="${langH}" rx="24" fill="#262624" stroke="#44403c" stroke-width="1.2"/>
        <text x="${outerPad + 24}" y="${langY + 50}" fill="#c7c2b8" font-size="30" letter-spacing="2">LANGUAGE PROFICIENCY DISTRIBUTION</text>
        <rect x="${outerPad + 24}" y="${langY + 62}" width="${contentWidth - 48}" height="20" rx="10" fill="#3b3b37"/>
        <clipPath id="lang-clip">
          <rect x="${outerPad + 24}" y="${langY + 62}" width="${contentWidth - 48}" height="20" rx="10"/>
        </clipPath>
        <g clip-path="url(#lang-clip)">${languageSegments}</g>
        ${languageTags}
      </g>

      <g>
        <rect x="${outerPad}" y="${bottomY}" width="${streakW}" height="520" rx="24" fill="#262624" stroke="#44403c" stroke-width="1.2"/>
        <text x="${outerPad + 34}" y="${bottomY + 54}" fill="#c7c2b8" font-size="32" letter-spacing="2">STREAK &amp;</text>
        <text x="${outerPad + 34}" y="${bottomY + 92}" fill="#c7c2b8" font-size="32" letter-spacing="2">CONSISTENCY</text>
        <text x="${outerPad + 34}" y="${bottomY + 330}" fill="#f5f3ef" font-size="72" font-weight="500">${escapeXml(stats.streak || 0)}</text>
        <text x="${outerPad + 34}" y="${bottomY + 382}" fill="#c7c2b8" font-size="34">day streak</text>
        <text x="${outerPad + 228}" y="${bottomY + 170}" fill="#c7c2b8" font-size="24">Active days</text>
        <text x="${outerPad + 228}" y="${bottomY + 202}" fill="#c7c2b8" font-size="24">this month</text>
        ${streakDots}
      </g>

      <g>
        <rect x="${outerPad + streakW + gap}" y="${bottomY}" width="${recentW}" height="520" rx="24" fill="#262624" stroke="#44403c" stroke-width="1.2"/>
        <text x="${outerPad + streakW + gap + 34}" y="${bottomY + 54}" fill="#c7c2b8" font-size="32" letter-spacing="2">RECENT COMMITS</text>
        ${recentCommitItems}
      </g>

      <line x1="${outerPad}" y1="${height - 110}" x2="${width - outerPad}" y2="${height - 110}" stroke="#57534e" stroke-width="1.2"/>
      <text x="${outerPad}" y="${height - 52}" fill="#c7c2b8" font-size="24">Powered by </text>
      <text x="${outerPad + 136}" y="${height - 52}" fill="#3b82f6" font-size="24">CommitDiary</text>
      <text x="${outerPad + 274}" y="${height - 52}" fill="#c7c2b8" font-size="24">· Generated ${escapeXml(generatedLabel)}</text>

      <g transform="translate(${width - outerPad - 350}, ${height - 92})">
        <rect width="350" height="62" rx="16" fill="#2e2e2b" stroke="#66615b" stroke-width="1.2"/>
        <text x="175" y="40" fill="#f5f3ef" font-size="24" text-anchor="middle">CommitDiary activity</text>
      </g>
    </svg>
  `;
};
