import { expect, it } from "vitest";
import { generateBadgeSVG } from "../svgBadgeGenerator";
import { processRepoDistribution } from "../badgeDataProcessor";

const baseStats = {
  totalCommits: 4,
  totalRepos: 1,
  username: "user<unsafe>",
  activeDays: 2,
  avgPerActiveDay: 2,
  streak: 1,
  weeklyDelta: "-20%",
  recentCommits: [],
  monthlyActivity: [],
  generatedAt: "2026-07-22T00:00:00.000Z",
  daysSinceLastActive: 0,
};

it("renders valid accessible dimensions and a full donut for one repository", () => {
  const svg = generateBadgeSVG({
    repos: [{ name: "api", count: 4, percentage: 100 }],
    timeline: [{ date: "2026-07-22", count: 4 }],
    stats: baseStats,
    languages: [],
  });

  expect(svg).toContain('width="1480" height="1960"');
  expect(svg).toContain('aria-labelledby="badge-title badge-description"');
  expect(svg).toContain('stroke="#3b82f6" stroke-width="38"');
  expect(svg).toContain("@user&lt;unsafe&gt;");
  expect(svg).not.toContain('height="auto"');
  expect(svg).not.toContain("rgba(");
});

it("groups repositories beyond the five badge legend slots", () => {
  const repos = processRepoDistribution({
    repos: Array.from({ length: 7 }, (_, index) => ({
      repo_name: `repo-${index + 1}`,
      commit_count: 7 - index,
    })),
  });

  expect(repos).toHaveLength(5);
  expect(repos[4]).toMatchObject({ name: "Other", count: 6 });
  expect(repos.reduce((total, repo) => total + repo.percentage, 0)).toBeCloseTo(100);
});
