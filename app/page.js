import LandingPage from "../components/landing/LandingPage";
import { faqs, setupSteps } from "../components/landing/landing-content";
import { siteConfig, socialImage } from "../lib/siteConfig";

const siteUrl = siteConfig.siteUrl;
const organizationId = `${siteUrl}/#organization`;
const softwareId = `${siteUrl}/#software`;

export const metadata = {
  title: {
    absolute: "CommitDiary | Developer Work Journal for VS Code",
  },
  description:
    "Turn Git commits into clear engineering reports for standups, reviews, portfolios, and team updates with a local-first VS Code extension.",
  keywords: [
    "developer work journal",
    "Git commit report",
    "engineering progress report",
    "VS Code Git extension",
    "developer productivity tool",
    "standup update from Git",
    "AI engineering report",
    "software engineering journal",
  ],
  alternates: { canonical: siteUrl },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "CommitDiary",
    title: "CommitDiary | Developer work journal for VS Code",
    description:
      "Turn Git commits into useful standups, reviews, portfolios, and team updates with a local-first VS Code extension.",
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "CommitDiary | Developer work journal for VS Code",
    description:
      "Turn Git commits into clear engineering reports with a local-first VS Code extension.",
    images: [socialImage.url],
  },
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": softwareId,
    name: "CommitDiary",
    url: siteUrl,
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "Developer productivity and Git reporting",
    operatingSystem: "Windows, macOS, Linux",
    description:
      "CommitDiary turns Git commit history into clear engineering work reports for standups, reviews, release notes, Discord updates, and developer portfolios.",
    downloadUrl: siteConfig.marketplaceUrl,
    featureList: [
      "Automatic Git commit discovery",
      "Commit categorization",
      "Local commit journal",
      "Offline queueing",
      "Structured engineering reports",
      "AI reports through Stepper",
      "Discord notifications",
      "Shareable activity badges",
    ],
    isAccessibleForFree: true,
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId,
    name: "CommitDiary",
    url: siteUrl,
    logo: `${siteUrl}/images/brand/commitdiary-mark-512.png`,
    sameAs: [siteConfig.githubUrl],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: "CommitDiary",
    url: siteUrl,
    description: "A local-first developer work journal powered by Git history and Stepper.",
    publisher: { "@id": organizationId },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${siteUrl}/#webpage`,
    name: "CommitDiary | Developer Work Journal for VS Code",
    url: siteUrl,
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": softwareId },
    description: "Turn Git commits into clear engineering reports for standups, reviews, portfolios, and team updates with a local-first VS Code extension.",
  },
  {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Set up CommitDiary in VS Code",
    description: "Install the CommitDiary extension, create a workspace, and connect cloud sync when needed.",
    step: setupSteps.map((step) => ({
      "@type": "HowToStep",
      name: step.title,
      text: step.text,
      position: Number(step.number),
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
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
