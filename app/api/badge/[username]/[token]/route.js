import { NextResponse } from "next/server";
import { apiClient } from "/lib/apiClient";
import {
  processRepoDistribution,
  processActivityTimeline,
  calculateStats,
  processLanguageDistribution,
} from "/lib/badgeDataProcessor";
import { generateBadgeSVG } from "/lib/svgBadgeGenerator";

export async function GET(request, { params }) {
  const { username, token } = params;

  try {
    // Fetch data with a larger limit to ensure we have enough for charts
    const shareData = await apiClient.getPublicShare(username, token, {
      page: 1,
      limit: 100,
    });

    if (!shareData) {
      return new NextResponse("Share not found", { status: 404 });
    }

    // Process data forcharts
    const repos = processRepoDistribution(shareData);
    const timeline = processActivityTimeline(shareData);
    const stats = calculateStats(shareData);
    const languages = processLanguageDistribution(shareData);

    // Generate SVG
    const svg = generateBadgeSVG({ repos, timeline, stats, languages });

    // Set response headers for SVG and caching
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control":
          "public, max-age=300, s-maxage=600, stale-while-revalidate=400",
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
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache",
      },
    });
  }
}
