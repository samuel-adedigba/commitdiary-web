import { NextResponse } from "next/server";
import { apiClient } from "/lib/apiClient";
import {
  processRepoDistribution,
  processActivityTimeline,
  calculateStats,
  processLanguageDistribution,
} from "/lib/badgeDataProcessor";
import { generateBadgeSVG } from "/lib/svgBadgeGenerator";
import { ApiError } from "/lib/apiClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request, { params }) {
  const { username, token } = await params;

  try {
    // Badge calculations need the bounded snapshot across all included repositories.
    const shareData = await apiClient.getPublicShare(username, token, {
      page: 1,
      limit: 500,
      includeAllRepos: true,
    });

    if (!shareData) {
      return new NextResponse("Share not found", { status: 404 });
    }

    // Process data for charts.
    const repos = processRepoDistribution(shareData);
    const timeline = processActivityTimeline(shareData);
    const stats = calculateStats(shareData);
    const languages = processLanguageDistribution(shareData);

    // Generate SVG
    const svg = generateBadgeSVG({ repos, timeline, stats, languages });

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    // Return a simple error SVG so it doesn't just show a broken image link
    const errorSvg = `
      <svg width="400" height="50" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="50" fill="#fee2e2" rx="6" stroke="#ef4444" stroke-width="1"/>
        <text x="20" y="30" font-family="sans-serif" font-size="14" fill="#b91c1c">
          CommitDiary: Failed to load report
        </text>
      </svg>
    `;
    return new NextResponse(errorSvg, {
      status: error instanceof ApiError ? error.status : 500,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-store",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
}
