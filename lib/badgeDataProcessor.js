import { detectLanguage } from "./languageDetector";

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

  return languages.slice(0, 6).map((l) => ({
    ...l,
    percentage: total > 0 ? (l.count / total) * 100 : 0,
  }));
};

/**
 * Calculates summary statistics for the badge.
 */
export const calculateStats = (shareData) => {
  return {
    totalCommits: shareData.total_commits || 0,
    totalRepos: shareData.total_repos || 0,
    username: shareData.username,
  };
};
