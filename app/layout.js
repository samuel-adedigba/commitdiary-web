import { AuthProvider } from "../lib/auth-context";
import { siteConfig } from "../lib/siteConfig";
// import theme style scss file
import "styles/theme.scss";

export const metadata = {
  title: {
    default: "CommitDiary | Developer Work Journal",
    template: "%s · CommitDiary",
  },
  description:
    "CommitDiary turns Git history into clear engineering work reports for developers and product teams.",
  ...(siteConfig.siteUrl ? { metadataBase: new URL(siteConfig.siteUrl) } : {}),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "64x64" },
      { url: "/images/brand/commitdiary-mark-192.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.ico",
    apple: "/images/brand/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-light">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
