import { AuthProvider } from "../lib/auth-context";
// import theme style scss file
import "styles/theme.scss";

export const metadata = {
  title: "Commit Diary - Insights into your code activity",
  description:
    "Commit Diary is a professional dashboard for tracking, categorizing, and visualizing your git commit history.",
  keywords: "commit-diary, git-analytics, developer-tools, commit-tracker",
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
