import { AuthProvider } from "../lib/auth-context";
// import theme style scss file
import "styles/theme.scss";

export const metadata = {
  title: "Commit Diary - Insights into your code activity",
  description:
    "Commit Diary is a professional dashboard for tracking, categorizing, and visualizing your git commit history.",
  keywords: "commit-diary, git-analytics, developer-tools, commit-tracker",
  metadataBase: new URL("https://commitdiary-web.vercel.app"),
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
  openGraph: {
    title: "Commit Diary - Insights into your code activity",
    description:
      "Professional dashboard for tracking and visualizing your git commit history.",
    images: ["/images/logo.png"],
  },
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
