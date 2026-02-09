/** @type {import('next').NextConfig} */

// Determine allowed API URLs based on environment
const isDevelopment = process.env.NODE_ENV === "development";
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Security headers to protect against common web vulnerabilities
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-inline needed for Next.js, consider removing in strict mode
      "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for styled-components/tailwind
      "img-src 'self' data: https: http:", // Allow images from any source (including GitHub avatars)
      "font-src 'self' data:",
      // Allow API calls to Supabase and your API server (http/https + WebSocket)
      isDevelopment
        ? `connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in ${apiUrl} http://localhost:* ws://localhost:*`
        : `connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in ${apiUrl}`,
      "frame-ancestors 'none'", // Prevent clickjacking
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  {
    key: "X-Frame-Options",
    value: "DENY", // Prevent site from being embedded in iframes
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff", // Prevent MIME-sniffing
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin", // Control referrer information
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()", // Disable unnecessary browser features
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block", // Enable XSS protection in older browsers
  },
];

const nextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
