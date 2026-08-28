export const navigation = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Setup", href: "/#setup" },
  { label: "Docs", href: "/docs" },
];

export const rawCommits = [
  { type: "feat", scope: "auth", text: "add token refresh handling" },
  { type: "fix", scope: "api", text: "handle failed webhook retries" },
  { type: "refactor", scope: "ui", text: "split dashboard widgets" },
  { type: "test", scope: "sync", text: "add queue retry coverage" },
];

export const workflowSteps = [
  {
    number: "01",
    title: "Install in VS Code",
    text: "CommitDiary starts where your work already happens: inside the editor.",
  },
  {
    number: "02",
    title: "Keep a local journal",
    text: "Your commits, changed files, categories, and affected components stay useful even offline.",
  },
  {
    number: "03",
    title: "Connect when ready",
    text: "Authenticated sync adds hosted history, reports, sharing, and Discord delivery when you need them.",
  },
  {
    number: "04",
    title: "Turn work into an update",
    text: "Edit a structured report for a standup, review, portfolio, or the next person who needs context.",
  },
];

export const setupSteps = [
  {
    number: "01",
    title: "Install the extension",
    text: "Get CommitDiary from the VS Code Marketplace and open a Git repository.",
  },
  {
    number: "02",
    title: "Create your workspace",
    text: "Sign up for the dashboard so your editor can connect to your private workspace.",
  },
  {
    number: "03",
    title: "Connect cloud sync",
    text: "Create an API key in Settings, then run “CommitDiary: Setup Cloud Sync” in VS Code. The key stays in SecretStorage.",
  },
];

export const featureGroups = [
  {
    eyebrow: "Personal memory",
    title: "Remember what the work meant.",
    text: "Keep a useful history of features, fixes, tests, refactors, and maintenance across repositories.",
    items: ["Automatic commit discovery", "Local-first journal", "Categories and affected components"],
  },
  {
    eyebrow: "Team clarity",
    title: "Explain progress without the archaeology.",
    text: "Give engineering and product one readable layer above commit hashes and raw diffs.",
    items: ["Structured engineering reports", "Shareable activity and report links", "Discord delivery"],
  },
  {
    eyebrow: "Responsible AI",
    title: "Useful output, with its limits visible.",
    text: "Stepper validates the report path while you keep code review, testing, and judgment in charge.",
    items: ["Bounded diff evidence", "Retry-safe report jobs", "Provider-flexible structured output"],
  },
];

export const useCases = [
  ["Standups", "Walk in with a clear account of what changed and what comes next."],
  ["Reviews", "Show outcomes and maintenance work without asking everyone to read every diff."],
  ["Portfolios", "Turn real engineering history into proof of how you build."],
  ["Open source", "Give contributors and maintainers a readable record of repository progress."],
];

export const faqs = [
  {
    question: "What is CommitDiary?",
    answer:
      "CommitDiary is a developer work journal for VS Code. It turns Git activity into clear reports about what changed, why it mattered, and what may need attention next.",
  },
  {
    question: "How does the VS Code extension work?",
    answer:
      "The extension discovers commits in your repository and keeps a local journal. If you connect cloud sync, it sends authenticated, bounded commit evidence to the dashboard for reports and sharing.",
  },
  {
    question: "Does CommitDiary upload my whole repository?",
    answer:
      "No. Authenticated cloud reporting uses commit metadata, file paths, diff statistics, and bounded sampled patch excerpts. It does not upload the whole repository.",
  },
  {
    question: "Can I use CommitDiary offline?",
    answer:
      "Yes. Commit discovery and local storage work in the editor. Unsynced work can wait in a local queue until you reconnect.",
  },
  {
    question: "What does Stepper do?",
    answer:
      "Stepper is the reliability layer behind AI reports. It handles provider routing, retries, rate limits, failover, validation, callbacks, and structured output.",
  },
  {
    question: "Does it replace code review?",
    answer:
      "No. CommitDiary summarizes engineering activity. It does not replace code review, tests, product context, or engineering judgment.",
  },
  {
    question: "Who is CommitDiary for?",
    answer:
      "It is useful for solo developers, students, teams, maintainers, and anyone who needs to explain software work clearly—from daily updates to portfolio evidence.",
  },
];

export const footerGroups = [
  {
    title: "Product",
    links: [
      ["Features", "/#features"],
      ["How it works", "/#how-it-works"],
      ["Privacy", "/privacy"],
    ],
  },
  {
    title: "Developers",
    links: [
      ["Documentation", "/docs"],
      ["VS Code Marketplace", "/marketplace"],
      ["Setup guide", "/#setup"],
    ],
  },
  {
    title: "Use CommitDiary",
    links: [
      ["Install the extension", "/install"],
      ["Sign in", "/login"],
      ["Open dashboard", "/dashboard"],
      ["Pricing", "/#pricing"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Terms", "/terms"],
      ["Refunds", "/refunds"],
      ["Cookies", "/cookies"],
      ["Contact", "/contact"],
    ],
  },
];
