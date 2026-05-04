import { detectLanguage } from "./languageDetector";

const LANGUAGE_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#64748b"];

const COMMIT_CATEGORY_COLORS = {
  feature: "#3b82f6",
  feat: "#3b82f6",
  fix: "#ef4444",
  bugfix: "#ef4444",
  refactor: "#8b5cf6",
  docs: "#06b6d4",
  chore: "#64748b",
  test: "#10b981",
  other: "#94a3b8",
};

const formatRelativeTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    return "just now";
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  if (diffDays === 1) {
    return "yesterday";
  }

  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const getCurrentStreak = (dayKeys) => {
  if (!dayKeys.length) return 0;

  const daySet = new Set(dayKeys);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let cursor = new Date(today);
  let streak = 0;

  while (daySet.has(cursor.toISOString().split("T")[0])) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  if (streak > 0) {
    return streak;
  }

  cursor = new Date(today);
  cursor.setDate(cursor.getDate() - 1);

  while (daySet.has(cursor.toISOString().split("T")[0])) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

/**
 * Processes repository distribution data for the donut chart.
 */
export const processRepoDistribution = (shareData) => {
  if (!shareData.repos || !shareData.repos.length) return [];

  const repos = shareData.repos.map((repo) => ({
    name: repo.repo_name,
    count: repo.commit_count || 0,
  }));

  // Sort by count descending
  repos.sort((a, b) => b.count - a.count);

  const total = repos.reduce((sum, r) => sum + r.count, 0);

  // Take top 7 and group the rest
  if (repos.length > 8) {
    const top = repos.slice(0, 7);
    const otherCount = repos.slice(7).reduce((sum, r) => sum + r.count, 0);
    top.push({ name: "Other", count: otherCount });
    return top.map((r) => ({
      ...r,
      percentage: total > 0 ? (r.count / total) * 100 : 0,
    }));
  }

  return repos.map((r) => ({
    ...r,
    percentage: total > 0 ? (r.count / total) * 100 : 0,
  }));
};

/**
 * Processes activity timeline data for the bar chart (last 30 days).
 */
export const processActivityTimeline = (shareData) => {
  const now = new Date();
  const timeline = [];
  const dailyCounts = {};

  // Flatten all commits
  const allCommits = shareData.repos
    ? shareData.repos.flatMap((r) => r.commits || [])
    : [];

  allCommits.forEach((commit) => {
    const date = new Date(commit.date || commit.created_at)
      .toISOString()
      .split("T")[0];
    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
  });

  // Generate last 30 days
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    timeline.push({
      date: dateStr,
      count: dailyCounts[dateStr] || 0,
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
    });
  }

  return timeline;
};

/**
 * Processes language distribution from commit data.
 */
export const processLanguageDistribution = (shareData) => {
  const allCommits = shareData.repos
    ? shareData.repos.flatMap((r) => r.commits || [])
    : [];

  const langCounts = {};

  allCommits.forEach((commit) => {
    const files = commit.files || [];
    const seenInCommit = new Set();

    files.forEach((file) => {
      // Handle both string array and object array for robustness
      const filePath = typeof file === "string" ? file : file.path;
      if (!filePath) return;

      const lang = detectLanguage(filePath);
      if (lang !== "Other" && !seenInCommit.has(lang)) {
        langCounts[lang] = (langCounts[lang] || 0) + 1;
        seenInCommit.add(lang);
      }
    });
  });

  const languages = Object.entries(langCounts).map(([name, count]) => ({
    name,
    count,
  }));

  // Sort by count descending
  languages.sort((a, b) => b.count - a.count);

  const total = languages.reduce((sum, l) => sum + l.count, 0);

  return languages.slice(0, 6).map((l, index) => ({
    ...l,
    percentage: total > 0 ? (l.count / total) * 100 : 0,
    color: LANGUAGE_COLORS[index % LANGUAGE_COLORS.length],
  }));
};

/**
 * Calculates summary statistics for the badge.
 */
export const calculateStats = (shareData) => {
  const allCommits = shareData.repos
    ? shareData.repos.flatMap((r) => r.commits || [])
    : [];
  const sortedCommits = [...allCommits].sort(
    (a, b) =>
      new Date(b.date || b.created_at).getTime() -
      new Date(a.date || a.created_at).getTime()
  );
  const now = new Date();
  const last30DaysStart = new Date(now);
  last30DaysStart.setDate(now.getDate() - 29);
  last30DaysStart.setHours(0, 0, 0, 0);
  const last7DaysStart = new Date(now);
  last7DaysStart.setDate(now.getDate() - 6);
  last7DaysStart.setHours(0, 0, 0, 0);
  const previous7DaysStart = new Date(now);
  previous7DaysStart.setDate(now.getDate() - 13);
  previous7DaysStart.setHours(0, 0, 0, 0);
  const previous7DaysEnd = new Date(now);
  previous7DaysEnd.setDate(now.getDate() - 7);
  previous7DaysEnd.setHours(23, 59, 59, 999);

  // Calculate Last Active
  let lastActive = null;
  let daysSinceLastActive = null;

  if (sortedCommits.length > 0) {
    lastActive = new Date(sortedCommits[0].date || sortedCommits[0].created_at);
    const diffTime = Math.abs(now - lastActive);
    daysSinceLastActive = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // Calculate Top Category
  const categoryCounts = {};
  allCommits.forEach((c) => {
    const cat = c.category || "Other";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  let topCategory = null;
  let maxCount = 0;
  Object.entries(categoryCounts).forEach(([cat, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topCategory = cat;
    }
  });

  const commitsLast30Days = sortedCommits.filter((commit) => {
    const commitDate = new Date(commit.date || commit.created_at);
    return commitDate >= last30DaysStart;
  });
  const commitsLast7Days = sortedCommits.filter((commit) => {
    const commitDate = new Date(commit.date || commit.created_at);
    return commitDate >= last7DaysStart;
  });
  const commitsPrevious7Days = sortedCommits.filter((commit) => {
    const commitDate = new Date(commit.date || commit.created_at);
    return commitDate >= previous7DaysStart && commitDate <= previous7DaysEnd;
  });
  const activeDayKeys = Array.from(
    new Set(
      commitsLast30Days.map((commit) =>
        new Date(commit.date || commit.created_at).toISOString().split("T")[0]
      )
    )
  ).sort();
  const activeDays = activeDayKeys.length;
  const currentStreak = getCurrentStreak(activeDayKeys);
  const avgPerActiveDay =
    activeDays > 0 ? commitsLast30Days.length / activeDays : 0;
  const previousWeekCount = commitsPrevious7Days.length;
  const weeklyDeltaValue =
    previousWeekCount === 0
      ? commitsLast7Days.length > 0
        ? 100
        : 0
      : ((commitsLast7Days.length - previousWeekCount) / previousWeekCount) * 100;
  const weeklyDeltaLabel =
    weeklyDeltaValue === 0
      ? "0%"
      : `${weeklyDeltaValue > 0 ? "+" : ""}${Math.round(weeklyDeltaValue)}%`;
  const recentCommits = sortedCommits.slice(0, 4).map((commit) => {
    const rawCategory = (commit.category || "other").toLowerCase();
    return {
      message: commit.message || "Untitled commit",
      time: formatRelativeTime(commit.date || commit.created_at),
      color: COMMIT_CATEGORY_COLORS[rawCategory] || COMMIT_CATEGORY_COLORS.other,
    };
  });
  const monthlyActivity = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(last30DaysStart);
    date.setDate(last30DaysStart.getDate() + index);
    return activeDayKeys.includes(date.toISOString().split("T")[0]);
  });

  return {
    totalCommits: shareData.total_commits || 0,
    totalRepos: shareData.total_repos || 0,
    username: shareData.username,
    lastActive,
    daysSinceLastActive,
    topCategory,
    activeDays,
    avgPerActiveDay,
    streak: currentStreak,
    weeklyDelta: weeklyDeltaLabel,
    recentCommits,
    monthlyActivity,
    generatedAt: new Date().toISOString(),
  };
};
