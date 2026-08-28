import Link from "next/link";
import LandingFooter from "./LandingFooter";
import LandingHeader from "./LandingHeader";
import PricingSection from "./PricingSection";
import ProductPreview from "./ProductPreview";
import {
  faqs,
  featureGroups,
  setupSteps,
  useCases,
  workflowSteps,
} from "./landing-content";
import styles from "./landing.module.scss";

function SectionHeading({ id, label, title, text, align = "left" }) {
  return (
    <div className={`${styles.sectionHeading} ${align === "center" ? styles.centered : ""}`}>
      <p className={styles.eyebrow}>{label}</p>
      <h2 id={id}>{title}</h2>
      {text ? <p className={styles.sectionLead}>{text}</p> : null}
    </div>
  );
}

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

export default function LandingPage() {
  return (
    <div className={styles.siteShell}>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>
      <LandingHeader />

      <main id="main-content">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p className={styles.heroBadge}>
                <i aria-hidden="true" /> Developer work journal for VS Code
              </p>
              <h1 id="hero-title">
                Turn the work in Git into a story people can use.
              </h1>
              <p className={styles.heroLead}>
                CommitDiary turns commits into clear engineering reports for standups, reviews, portfolios, and the next person who needs context.
              </p>
              <div className={styles.heroActions}>
                <Link href="/install" className={styles.primaryButton}>
                  Install for VS Code <ArrowIcon />
                </Link>
                <Link href="/#how-it-works" className={styles.secondaryButton}>
                  See how it works
                </Link>
              </div>
              <p className={styles.trustLine}>
                <span aria-hidden="true">⌁</span>
                Local-first by default. Sync only when you choose.
              </p>
            </div>

            <div className={styles.heroAside}>
              <ProductPreview />
            </div>
          </div>
          <div className={styles.heroFootnote} aria-label="CommitDiary report inputs">
            <span>Commits</span>
            <span>Changed files</span>
            <span>Categories</span>
            <span>Components</span>
            <span>Diff context</span>
          </div>
        </section>

        <section id="features" className={styles.featuresSection} aria-labelledby="features-title">
          <SectionHeading
            id="features-title"
            label="Why it exists"
            title="Git records the change. CommitDiary keeps the context."
            text="You already do the work. CommitDiary gives that work a readable, reusable shape without asking you to maintain another journal."
          />
          <div className={styles.featureGrid}>
            {featureGroups.map((group, index) => (
              <article key={group.eyebrow} className={styles.featureCard}>
                <div className={styles.featureCardTop}>
                  <span>0{index + 1}</span>
                  <p>{group.eyebrow}</p>
                </div>
                <h3>{group.title}</h3>
                <p>{group.text}</p>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}><span aria-hidden="true">+</span>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className={styles.workflowSection} aria-labelledby="workflow-title">
          <div className={styles.workflowIntro}>
            <SectionHeading
              id="workflow-title"
              label="How it works"
              title="A small layer between the commit and the conversation."
              text="CommitDiary stays close to your editor, your Git history, and your actual workflow."
            />
            <Link href="/docs" className={styles.inlineLink}>
              Read the developer docs <ArrowIcon />
            </Link>
          </div>
          <ol className={styles.workflowList}>
            {workflowSteps.map((step) => (
              <li key={step.number}>
                <span className={styles.stepNumber}>{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="setup" className={styles.setupSection} aria-labelledby="setup-title">
          <SectionHeading
            id="setup-title"
            label="Start here"
            title="From Marketplace install to first report."
            text="The local path takes minutes. Cloud features are optional and stay behind an authenticated connection."
          />
          <ol className={styles.setupGrid}>
            {setupSteps.map((step) => (
              <li key={step.number} className={styles.setupCard}>
                <span className={styles.stepNumber}>{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className={styles.setupActions}>
            <Link href="/install" className={styles.primaryButton}>Install the extension <ArrowIcon /></Link>
            <Link href="/docs" className={styles.inlineLink}>Open the setup guide <ArrowIcon /></Link>
          </div>
        </section>

        <section className={styles.useCaseSection} aria-labelledby="use-cases-title">
          <SectionHeading
            id="use-cases-title"
            label="Where it helps"
            title="Useful whenever software work needs explaining."
            align="center"
          />
          <div className={styles.useCaseGrid}>
            {useCases.map(([title, text], index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="privacy" className={styles.privacySection} aria-labelledby="privacy-title">
          <div className={styles.privacyGrid}>
            <div>
              <p className={styles.eyebrow}>Developer trust</p>
              <h2 id="privacy-title">Keep the repository private. Keep the work understandable.</h2>
              <p>
                CommitDiary does not upload the whole repository. Authenticated cloud reporting uses commit metadata and bounded diff evidence made from file paths, statistics, and sampled patch excerpts.
              </p>
              <Link href="/#faq" className={styles.darkInlineLink}>
                Read the privacy questions <ArrowIcon />
              </Link>
            </div>
            <ul className={styles.trustList}>
              <li><span>01</span><div><strong>Local journal</strong><p>Commit discovery begins in the editor.</p></div></li>
              <li><span>02</span><div><strong>Offline queue</strong><p>Unsynced work can wait until you reconnect.</p></div></li>
              <li><span>03</span><div><strong>Authenticated sync</strong><p>Hosted features require a signed-in connection.</p></div></li>
              <li><span>04</span><div><strong>Human judgment</strong><p>Reports support review; they do not replace it.</p></div></li>
            </ul>
          </div>
          <aside className={styles.limitationNote}>
            <span>Important</span>
            <p>AI reports only know the context they receive. Review them against the code, tests, and business intent before relying on them.</p>
          </aside>
        </section>

        <PricingSection />

        <section id="faq" className={styles.faqSection} aria-labelledby="faq-title">
          <SectionHeading
            id="faq-title"
            label="Questions, answered plainly"
            title="Know what you are installing before you install it."
          />
          <div className={styles.faqList}>
            {faqs.map((faq, index) => (
              <details key={faq.question}>
                <summary>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {faq.question}
                  <i aria-hidden="true" />
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.finalCta} aria-labelledby="final-cta-title">
          <div className={styles.finalCtaMark} aria-hidden="true">cd/</div>
          <div>
            <p className={styles.eyebrow}>Your work is already in Git</p>
            <h2 id="final-cta-title">Give it a memory people can read.</h2>
            <p>Install the VS Code extension and make your next commit easier to explain.</p>
          </div>
          <div className={styles.finalActions}>
            <Link href="/install" className={styles.lightButton}>Install for VS Code <ArrowIcon /></Link>
            <Link href="/#pricing" className={styles.outlineLightButton}>See plans</Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
