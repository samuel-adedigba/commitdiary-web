import LandingPage from "../components/landing/LandingPage";
import { siteConfig, socialImage } from "../lib/siteConfig";

const siteUrl = siteConfig.siteUrl || undefined;

export const metadata = {
  title: {
    absolute: "CommitDiary | Turn Git Commits Into Clear Developer Work Reports",
  },
  description:
    "CommitDiary turns Git history into clear engineering work reports for standups, sprint reviews, retrospectives, release notes, Discord updates, and developer portfolios.",
  keywords: [
    "developer work journal",
    "Git work journal",
    "Git commit report",
    "AI commit summary",
    "engineering progress report",
    "developer standup tool",
    "VS Code Git extension",
    "developer productivity history",
  ],
  ...(siteUrl ? { alternates: { canonical: siteUrl } } : {}),
  openGraph: {
    type: "website",
    ...(siteUrl ? { url: siteUrl } : {}),
    siteName: "CommitDiary",
    title: "Turn Git history into clear engineering work reports",
    description:
      "A developer work journal that turns commits into useful standups, reviews, release notes, and proof of work.",
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "CommitDiary | Your Git history, made readable",
    description:
      "Turn commits into useful engineering reports with a VS Code extension and reliable AI through Stepper.",
    images: [socialImage.url],
  },
};

const faqItems = [
  [
    "What is CommitDiary?",
    "CommitDiary is a developer work journal that turns Git activity into clear reports about what changed and why it may matter.",
  ],
  [
    "How does CommitDiary work?",
    "The VS Code extension reads commit context, stores a local journal, and can sync authenticated data for reports, dashboards, badges, and notifications.",
  ],
  [
    "Does CommitDiary upload my whole repository?",
    "No. Authenticated cloud reporting sends commit metadata and bounded diff evidence, including sampled patch excerpts, instead of the whole repository.",
  ],
  [
    "What is Stepper?",
    "Stepper is the AI reliability engine behind CommitDiary. It handles provider routing, retries, failover, validation, callbacks, and structured output.",
  ],
];

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CommitDiary",
    url: siteUrl,
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "Developer productivity and Git reporting",
    operatingSystem: "Windows, macOS, Linux",
    description:
      "CommitDiary turns Git commit history into clear engineering work reports for standups, sprint reviews, retrospectives, release notes, Discord updates, and developer portfolios.",
    downloadUrl: siteConfig.marketplaceUrl || undefined,
    codeRepository: siteConfig.githubUrl || undefined,
    featureList: [
      "Automatic Git commit discovery",
      "Commit categorization",
      "Local commit journal",
      "Structured AI reports through Stepper",
      "Offline queueing",
      "Discord notifications",
      "Shareable activity badges",
    ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CommitDiary",
    url: siteUrl,
    logo: siteUrl ? `${siteUrl}/images/brand/commitdiary-mark-512.png` : undefined,
    sameAs: [
      siteConfig.githubUrl,
      siteConfig.marketplaceUrl,
    ].filter(Boolean),
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CommitDiary",
    url: siteUrl,
    description: "Developer work journal powered by Git history and Stepper.",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  },
];

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingPage />
    </>
  );
}
