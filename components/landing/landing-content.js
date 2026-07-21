import { configuredUrl, siteConfig } from "../../lib/siteConfig";

export const productLinks = {
  github: configuredUrl(siteConfig.githubUrl),
  marketplace: configuredUrl(siteConfig.marketplaceUrl),
  stepper: configuredUrl(siteConfig.stepperUrl),
};

export const navigation = [
  { label: "Features", href: "/features" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Templates", href: "/templates" },
  { label: "Privacy", href: "/privacy" },
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
    title: "Commit as usual",
    text: "CommitDiary starts with the Git history your work already creates.",
  },
  {
    number: "02",
    title: "Read the context",
    text: "The extension finds your commits, changed files, categories, and affected components.",
  },
  {
    number: "03",
    title: "Sync when you choose",
    text: "Authenticated sync unlocks reports, dashboards, badges, and team visibility.",
  },
  {
    number: "04",
    title: "Generate with Stepper",
    text: "Stepper routes the AI job, handles failures, and validates a predictable report.",
  },
  {
    number: "05",
    title: "Use the update",
    text: "Bring the result to standups, reviews, Discord, release notes, or your portfolio.",
  },
];

export const stepperCapabilities = [
  "Provider routing",
  "Retry and backoff",
  "Rate limits",
  "Circuit breakers",
  "Schema validation",
  "Secret redaction",
  "Callbacks",
  "Metrics",
];

export const featureGroups = [
  {
    eyebrow: "For your own work",
    title: "Remember the work, not the hashes.",
    text: "Keep a useful record of what you built, fixed, tested, and improved across repositories.",
    items: [
      "Automatic commit discovery",
      "Local commit journal",
      "Work categories and components",
      "Daily and weekly summaries",
      "Public activity badges",
    ],
  },
  {
    eyebrow: "For team communication",
    title: "Give progress a shared language.",
    text: "Turn implementation details into updates that engineering and product teams can both read.",
    items: [
      "Repository-level reports",
      "Sprint and review evidence",
      "Technical debt visibility",
      "Discord notifications",
      "Shareable report links",
    ],
  },
  {
    eyebrow: "For real workflows",
    title: "Keep working when systems wobble.",
    text: "Local storage, queued sync, report backfills, and Stepper keep the workflow dependable.",
    items: [
      "Offline queueing",
      "Retryable cloud sync",
      "Historical report backfills",
      "Authenticated data access",
      "Structured AI output",
    ],
  },
];

export const templates = [
  {
    id: "standup",
    label: "Daily standup",
    meta: "Yesterday · Today · Blockers",
    title: "A standup that reflects the work.",
    body: "Improved API sync reliability and added retry coverage for failed queue jobs.",
    detail:
      "Next: test repository report generation and confirm webhook retry behavior.",
    tags: ["sync", "test", "reliability"],
  },
  {
    id: "weekly",
    label: "Weekly update",
    meta: "Progress · Impact · Next",
    title: "A week of commits, made readable.",
    body: "This week focused on sync reliability, report generation, and dashboard visibility.",
    detail:
      "The system is better prepared for unstable networks and delayed AI callbacks.",
    tags: ["reporting", "dashboard", "api"],
  },
  {
    id: "sprint",
    label: "Sprint review",
    meta: "Outcome · Work · Review note",
    title: "Show the outcome behind the tickets.",
    body: "The repository reporting flow moved closer to production readiness.",
    detail:
      "Work covered commit discovery, Stepper jobs, dashboard states, and Discord notifications.",
    tags: ["sprint", "delivery", "product"],
  },
  {
    id: "debt",
    label: "Technical debt",
    meta: "Change · Reason · Follow-up",
    title: "Make invisible maintenance visible.",
    body: "Separated dashboard components and moved sync handling into focused modules.",
    detail:
      "The codebase is easier to maintain and future report changes should be safer.",
    tags: ["refactor", "architecture", "quality"],
  },
];

export const useCases = [
  ["Standups", "Walk in with a clear update, not a rushed scan of yesterday’s commits."],
  ["Weekly reports", "Explain progress, impact, and the work that still needs attention."],
  ["Sprint reviews", "Give product and engineering teams one readable view of delivery."],
  ["Retrospectives", "See patterns in fixes, tests, technical debt, and delivery flow."],
  ["Portfolio proof", "Share a real work history through reports and activity badges."],
  ["Open source", "Summarize contributor work, releases, fixes, and repository progress."],
];

export const personas = [
  {
    label: "New developers",
    title: "Explain your work with confidence.",
    text: "See how features, fixes, tests, refactors, and chores add up to meaningful progress.",
  },
  {
    label: "Experienced developers",
    title: "Preserve context across complex work.",
    text: "Track architecture changes, incidents, refactors, and cross-repository progress without rebuilding the story later.",
  },
  {
    label: "Product and engineering teams",
    title: "Read progress without reading every diff.",
    text: "Share useful outcomes while keeping code review and engineering judgment where they belong.",
  },
];

export const faqs = [
  {
    question: "What is CommitDiary?",
    answer:
      "CommitDiary is a developer work journal. It turns Git activity into clear reports that explain what you worked on, what changed, and why it may matter.",
  },
  {
    question: "How does CommitDiary work?",
    answer:
      "The VS Code extension discovers your commits and analyzes their metadata, changed files, categories, components, and diff summaries. Authenticated sync can then generate reports, dashboards, badges, and notifications.",
  },
  {
    question: "Does CommitDiary upload my whole repository?",
    answer:
      "No. Basic reporting uses commit metadata, file paths, categories, components, and diff summaries. CommitDiary does not need a full repository upload to describe your work.",
  },
  {
    question: "What does Stepper do?",
    answer:
      "Stepper is the reliability engine behind AI reports. It handles provider routing, retries, rate limits, failover, validation, callbacks, and structured output.",
  },
  {
    question: "Which AI provider powers CommitDiary?",
    answer:
      "Stepper is provider-flexible. The active AI provider depends on the deployment configuration, so CommitDiary is not tied to one vendor.",
  },
  {
    question: "Can I use CommitDiary offline?",
    answer:
      "Yes. Commit discovery and local storage work in your editor. Unsynced work can wait in a local queue until you reconnect.",
  },
  {
    question: "Can CommitDiary create standup and release updates?",
    answer:
      "Yes. Its structured reports can be shaped into standups, weekly updates, sprint reviews, technical debt reports, release notes, and portfolio summaries.",
  },
  {
    question: "Does CommitDiary replace code review?",
    answer:
      "No. CommitDiary summarizes engineering activity. It does not replace code review, testing, product context, or engineering judgment.",
  },
];

export const footerGroups = [
  {
    title: "Product",
    links: [
      ["Features", "/features"],
      ["How it works", "/how-it-works"],
      ["Report templates", "/templates"],
      ["Privacy", "/privacy"],
    ],
  },
  {
    title: "Developers",
    links: [
      ["Documentation", "/docs"],
      ["GitHub repository", "/github"],
      ["VS Code Marketplace", "/marketplace"],
      ["Stepper source", productLinks.stepper],
    ],
  },
  {
    title: "Use CommitDiary",
    links: [
      ["Install the extension", "/install"],
      ["Sign in", "/login"],
      ["Open dashboard", "/dashboard"],
      ["Discord setup", "/discord"],
    ],
  },
];
