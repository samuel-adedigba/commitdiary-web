import Link from "next/link";
import PropTypes from "prop-types";
import { BrandLockup } from "../landing/BrandIdentity";
import { legalConfig, legalIdentityConfigured } from "../../lib/legalConfig";
import styles from "./legal.module.scss";

function isInternalLink(href) {
  return href.startsWith("/");
}

function DocumentLink({ href, label }) {
  if (isInternalLink(href)) {
    return <Link href={href}>{label}</Link>;
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label={`${label} (opens in a new tab)`}>
      {label} <span className={styles.externalHint} aria-hidden="true">(opens in a new tab)</span>
    </a>
  );
}

DocumentLink.propTypes = {
  href: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

export default function LegalDocument({ document }) {
  return (
    <div className={styles.pageShell}>
      <a className={styles.skipLink} href="#legal-content">
        Skip to policy content
      </a>

      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="CommitDiary home">
          <BrandLockup />
        </Link>
        <nav className={styles.headerNav} aria-label="Legal navigation">
          <Link href="/#pricing">Pricing</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/login" className={styles.headerAction}>Sign in</Link>
        </nav>
      </header>

      <main id="legal-content" className={styles.main}>
        <section className={styles.hero} aria-labelledby="legal-title">
          <div>
            <p className={styles.eyebrow}>{document.eyebrow}</p>
            <h1 id="legal-title">{document.title}</h1>
            <p className={styles.lead}>{document.description}</p>
          </div>
          <div className={styles.meta} aria-label="Policy details">
            <span>Version {legalConfig.policyVersion}</span>
            <span>Effective {legalConfig.effectiveDate}</span>
          </div>
        </section>

        {!legalIdentityConfigured ? (
          <aside className={styles.launchNotice} role="note">
            <strong>Live billing setup still required</strong>
            <p>
              Configure the verified legal entity name and registered or principal business address before Paddle domain review. This notice is complete in structure, but it is not a live-launch approval until those values are set.
            </p>
          </aside>
        ) : null}

        <div className={styles.documentGrid}>
          <aside className={styles.contents} aria-label="On this page">
            <p className={styles.contentsLabel}>On this page</p>
            <ol>
              {document.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title.replace(/^\d+\.\s/, "")}</a>
                </li>
              ))}
            </ol>
          </aside>

          <article className={styles.document}>
            <div className={styles.identityCard}>
              <span className={styles.cardLabel}>Published by</span>
              <strong>{legalConfig.legalName || "CommitDiary"}</strong>
              <span>{legalConfig.legalAddress || "Legal entity address to be configured before live billing"}</span>
              <a href={`mailto:${legalConfig.privacyEmail}`}>{legalConfig.privacyEmail}</a>
            </div>

            {document.sections.map((section) => (
              <section key={section.id} id={section.id} className={styles.section}>
                <h2>{section.title}</h2>
                {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.items ? (
                  <ul>
                    {section.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ) : null}
                {section.links ? (
                  <div className={styles.sectionLinks}>
                    {section.links.map((link) => <DocumentLink key={link.href} {...link} />)}
                  </div>
                ) : null}
              </section>
            ))}
          </article>
        </div>
      </main>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} CommitDiary</span>
        <nav aria-label="Policy links">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/refunds">Refunds</Link>
          <Link href="/cookies">Cookies</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </footer>
    </div>
  );
}

LegalDocument.propTypes = {
  document: PropTypes.shape({
    eyebrow: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    sections: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        paragraphs: PropTypes.arrayOf(PropTypes.string),
        items: PropTypes.arrayOf(PropTypes.string),
        links: PropTypes.arrayOf(
          PropTypes.shape({ href: PropTypes.string.isRequired, label: PropTypes.string.isRequired }),
        ),
      }),
    ).isRequired,
  }).isRequired,
};
