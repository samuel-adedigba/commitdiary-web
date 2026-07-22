/** @type {import('next').NextConfig} */

// Determine allowed API URLs based on environment
const isDevelopment = process.env.NODE_ENV === "development";

// Security headers to protect against common web vulnerabilities
const createSecurityHeaders = ({ allowEmbedding = false } = {}) => [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-inline needed for Next.js, consider removing in strict mode
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com", // Allow known external stylesheets used in theme.scss
      "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
      "img-src 'self' data: https: http:", // Allow images from any source (including GitHub avatars)
      "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com",
      // Allow API calls to Supabase and your API server (http/https + WebSocket)
      isDevelopment
        ? "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in http://localhost:* ws://localhost:*"
        : "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in",
      allowEmbedding ? "frame-ancestors https: http:" : "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  ...(!allowEmbedding
    ? [{ key: "X-Frame-Options", value: "DENY" }]
    : []),
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
  outputFileTracingRoot: __dirname,

  async headers() {
    return [
      {
        // Embed routes intentionally allow HTTP(S) parents; all other routes deny framing.
        source: "/embed/:path*",
        headers: createSecurityHeaders({ allowEmbedding: true }),
      },
      {
        source: "/:path((?!embed(?:/|$)).*)",
        headers: createSecurityHeaders(),
      },
    ];
  },
};

module.exports = nextConfig;
