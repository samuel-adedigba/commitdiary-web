import Link from "next/link";
import LandingFooter from "./LandingFooter";
import LandingHeader from "./LandingHeader";
import ProductPreview from "./ProductPreview";
import {
  faqs,
  featureGroups,
  personas,
  productLinks,
  stepperCapabilities,
  templates,
  useCases,
  workflowSteps,
} from "./landing-content";
import styles from "./landing.module.scss";

const pains = [
  {
    index: "01",
    title: "Standups become guesswork",
    text: "The context is scattered across commits, so the update sounds smaller than the work.",
  },
  {
    index: "02",
    title: "Managers need outcomes",
    text: "Product leads need progress, risk, and testing context, not a list of file changes.",
  },
  {
    index: "03",
    title: "Maintenance disappears",
    text: "Refactors, tests, infrastructure, and cleanup matter even when they do not look like features.",
  },
  {
    index: "04",
    title: "Work history goes unused",
    text: "Git already records the effort. It rarely turns that history into something easy to learn from.",
  },
];

const anatomyFields = [
  ["Title", "The change in one line"],
  ["Summary", "What happened and why"],
  ["Changes", "Specific work completed"],
  ["Rationale", "The reason behind it"],
  ["Impact + tests", "Risk and coverage"],
  ["Next steps", "What follows"],
  ["Tags", "Searchable context"],
];

function SectionHeading({ label, title, text, align = "left" }) {
  return (
    <div className={`${styles.sectionHeading} ${align === "center" ? styles.centered : ""}`}>
      <p className={styles.eyebrow}>{label}</p>
      <h2>{title}</h2>
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
                <i aria-hidden="true" /> Developer work journal · Git + Stepper
              </p>
              <h1 id="hero-title">
                Turn your Git history into a clear story of your engineering work.
              </h1>
              <p className={styles.heroLead}>
                CommitDiary explains what you built, fixed, refactored, tested, and shipped without making you rewrite your commit history by hand.
              </p>
              <div className={styles.heroActions}>
                <Link href="/install" className={styles.primaryButton}>
                  Install the VS Code extension <ArrowIcon />
                </Link>
                <Link href="/github" className={styles.secondaryButton}>
                  View the source on GitHub
                </Link>
              </div>
              <p className={styles.trustLine}>
                <span aria-hidden="true">⌁</span>
                Works from your Git workflow. Local-first. Sync when authenticated.
              </p>
            </div>

            <div className={styles.heroAside}>
              <div className={styles.heroAnnotation} aria-hidden="true">
                <span>01</span>
                <p>raw work</p>
                <i />
                <span>02</span>
                <p>clear report</p>
              </div>
              <ProductPreview />
            </div>
          </div>
          <div className={styles.heroFootnote}>
            <span>Commit metadata</span>
            <span>Changed files</span>
            <span>Work categories</span>
            <span>Affected components</span>
            <span>Diff summaries</span>
          </div>
        </section>

        <section className={styles.definitionStrip} aria-labelledby="definition-title">
          <div>
            <p className={styles.eyebrow}>What is CommitDiary?</p>
            <h2 id="definition-title">A work journal built from the development you already do.</h2>
          </div>
          <p>
            CommitDiary is a developer work journal that turns Git history into clear, human-readable engineering reports for standups, sprint reviews, retrospectives, release notes, and portfolios.
          </p>
        </section>

        <section className={styles.problemSection} aria-labelledby="problem-title">
          <SectionHeading
            label="The missing context"
            title="Git knows what changed. It does not explain why it mattered."
            text="At the end of a busy day, the hard part is not finding the commit hash. It is explaining the work clearly to yourself and everyone around you."
          />
          <div className={styles.painGrid}>
            {pains.map((pain) => (
              <article key={pain.index} className={styles.painCard}>
                <span>{pain.index}</span>
                <h3>{pain.title}</h3>
                <p>{pain.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className={styles.workflowSection} aria-labelledby="workflow-title">
          <div className={styles.workflowIntro}>
            <SectionHeading
              label="From code to communication"
              title="Your workflow stays the same. The result gets clearer."
              text="CommitDiary sits above Git. It turns low-level activity into a useful memory of the work without asking you to maintain another journal."
            />
            <Link href="/docs" className={styles.inlineLink}>
              Read the setup guide <ArrowIcon />
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

        <section className={styles.stepperSection} aria-labelledby="stepper-title">
          <div className={styles.stepperGrid}>
            <div className={styles.stepperCopy}>
              <p className={styles.eyebrow}>The reliability engine</p>
              <span className={styles.stepperWordmark} aria-hidden="true">stepper/</span>
              <h2 id="stepper-title">AI reports should be structured and dependable, not random chatbot text.</h2>
              <p>
                Stepper powers CommitDiary’s AI report generation. It sends each job to a configured provider, handles the rough edges, and returns a predictable report your workflow can use.
              </p>
              <Link href={productLinks.stepper} className={styles.darkInlineLink}>
                Explore Stepper on GitHub <ArrowIcon />
              </Link>
            </div>

            <div className={styles.stepperConsole}>
              <div className={styles.consoleHeader}>
                <span>report-job / cd_4f29</span>
                <span>healthy</span>
              </div>
              <ol>
                <li><span>01:18:02</span><b>queued</b><p>Report job accepted</p></li>
                <li><span>01:18:03</span><b>routed</b><p>Provider selected by config</p></li>
                <li><span>01:18:05</span><b>parsed</b><p>Response normalized</p></li>
                <li><span>01:18:05</span><b>valid</b><p>Seven report fields passed</p></li>
                <li><span>01:18:06</span><b>delivered</b><p>Callback completed</p></li>
              </ol>
              <div className={styles.consoleResult}>
                <span aria-hidden="true">✓</span>
                <div>
                  <strong>Structured report ready</strong>
                  <small>Fallback available · cache hydrated</small>
                </div>
              </div>
            </div>
          </div>
          <ul className={styles.capabilityStrip} aria-label="Stepper reliability features">
            {stepperCapabilities.map((capability) => (
              <li key={capability}>{capability}</li>
            ))}
          </ul>
        </section>

        <section id="features" className={styles.featuresSection} aria-labelledby="features-title">
          <SectionHeading
            label="Built for the work around the code"
            title="Everything Git history needs to become useful communication."
            text="From one developer tracking a week of work to a team preparing a sprint review, CommitDiary keeps the source familiar and the output readable."
            align="center"
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

          <div className={styles.anatomyPanel}>
            <div className={styles.anatomyIntro}>
              <p className={styles.eyebrow}>Report anatomy</p>
              <h3>Seven fields. One consistent shape.</h3>
              <p>
                Every AI report follows a clear structure, so it can move from the dashboard to Discord, a shared link, or your next meeting.
              </p>
            </div>
            <ol className={styles.anatomyList}>
              {anatomyFields.map(([field, description], index) => (
                <li key={field}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{field}</strong>
                  <p>{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="templates" className={styles.templatesSection} aria-labelledby="templates-title">
          <div className={styles.templatesIntro}>
            <SectionHeading
              label="Report templates"
              title="Write for the moment your team is in."
              text="A standup needs a different shape from a sprint review. CommitDiary keeps the facts and changes the frame."
            />
            <Link href="/templates" className={styles.inlineLink}>
              Explore report templates <ArrowIcon />
            </Link>
          </div>
          <div className={styles.templateGrid}>
            {templates.map((template) => (
              <article key={template.id} className={styles.templateCard}>
                <header>
                  <span>{template.label}</span>
                  <small>{template.meta}</small>
                </header>
                <div className={styles.templateBody}>
                  <h3>{template.title}</h3>
                  <p>{template.body}</p>
                  <div>
                    <span>Impact / next</span>
                    <p>{template.detail}</p>
                  </div>
                </div>
                <footer>
                  {template.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </footer>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.demoSection} aria-labelledby="demo-title">
          <div className={styles.demoHeading}>
            <p className={styles.eyebrow}>A week in context</p>
            <h2 id="demo-title">See five days of work become one useful memory.</h2>
          </div>
          <div className={styles.weekTimeline}>
            {[
              ["Mon", "Auth cleanup", "refactor"],
              ["Tue", "Webhook retry fix", "fix"],
              ["Wed", "Dashboard split", "refactor"],
              ["Thu", "Queue test coverage", "test"],
              ["Fri", "Weekly report", "ready"],
            ].map(([day, work, type], index) => (
              <div key={day} className={styles.weekDay}>
                <span>{day}</span>
                <i aria-hidden="true">{index === 4 ? "✓" : ""}</i>
                <strong>{work}</strong>
                <small>{type}</small>
              </div>
            ))}
          </div>
          <div className={styles.badgePreview}>
            <span className={styles.badgeAvatar} aria-hidden="true">S</span>
            <div>
              <strong>Samuel · Backend work journal</strong>
              <p>12 commits summarized this week</p>
            </div>
            <ul aria-label="Weekly work breakdown">
              <li><b>3</b> features</li>
              <li><b>4</b> fixes</li>
              <li><b>2</b> refactors</li>
              <li><b>3</b> tests</li>
            </ul>
            <span className={styles.badgeVerified}>CommitDiary verified</span>
          </div>
        </section>

        <section className={styles.comparisonSection} aria-labelledby="comparison-title">
          <SectionHeading
            label="A readable layer above Git"
            title="More than commit counts. More useful than raw logs."
            text="CommitDiary does not replace Git, code review, or engineering judgment. It makes the history they create easier to understand."
          />
          <div className={styles.comparisonTableWrap}>
            <table className={styles.comparisonTable}>
              <caption>What raw Git history shows compared with CommitDiary reports</caption>
              <thead>
                <tr>
                  <th scope="col">The question</th>
                  <th scope="col">Raw Git log</th>
                  <th scope="col">CommitDiary</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["What happened?", "Commit messages and files", "A plain-language work summary"],
                  ["Why did it matter?", "Manual interpretation", "Rationale and likely impact"],
                  ["What needs attention?", "Not shown", "Testing areas and next steps"],
                  ["Can I share it?", "Copy and rewrite", "Ready for updates, links, and Discord"],
                  ["Can a non-engineer read it?", "Usually difficult", "Designed for shared understanding"],
                ].map(([question, git, diary]) => (
                  <tr key={question}>
                    <th scope="row">{question}</th>
                    <td><span aria-hidden="true">:</span>{git}</td>
                    <td><span aria-hidden="true">✓</span>{diary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="privacy" className={styles.privacySection} aria-labelledby="privacy-title">
          <div className={styles.privacyGrid}>
            <div>
              <p className={styles.eyebrow}>Developer trust</p>
              <h2 id="privacy-title">Summarize the work without uploading the whole repository.</h2>
              <p>
                CommitDiary uses commit metadata, file paths, categories, components, and diff summaries. It keeps a local journal and syncs authenticated data for cloud reports and sharing.
              </p>
              <Link href="/privacy" className={styles.darkInlineLink}>
                Read how CommitDiary handles data <ArrowIcon />
              </Link>
            </div>
            <ul className={styles.trustList}>
              <li><span>01</span><div><strong>Local commit storage</strong><p>Your journal begins in the editor.</p></div></li>
              <li><span>02</span><div><strong>Offline queueing</strong><p>Work can wait safely until you reconnect.</p></div></li>
              <li><span>03</span><div><strong>Authenticated sync</strong><p>Cloud features require a signed-in connection.</p></div></li>
              <li><span>04</span><div><strong>Assisted analysis</strong><p>Reports support judgment; they do not replace it.</p></div></li>
            </ul>
          </div>
          <aside className={styles.limitationNote}>
            <span>Important</span>
            <p>
              AI reports only know the context they receive. They may not know the full business reason, final production state, or whether every test ran.
            </p>
          </aside>
        </section>

        <section className={styles.useCaseSection} aria-labelledby="use-cases-title">
          <SectionHeading
            label="Made for where work gets explained"
            title="Use CommitDiary wherever progress needs a clear voice."
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
          <div className={styles.personaGrid}>
            {personas.map((persona) => (
              <article key={persona.label}>
                <p>{persona.label}</p>
                <h3>{persona.title}</h3>
                <span>{persona.text}</span>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className={styles.accessSection} aria-labelledby="access-title">
          <div className={styles.accessCopy}>
            <p className={styles.eyebrow}>Start with your next commit</p>
            <h2 id="access-title">The extension is the front door.</h2>
            <p>
              Install CommitDiary in VS Code, create your account, connect with an API key, and let your work journal build from there.
            </p>
          </div>
          <div className={styles.accessCard}>
            <div>
              <span>CommitDiary for VS Code</span>
              <strong>Install from the Marketplace</strong>
            </div>
            <ul>
              <li>Automatic commit discovery</li>
              <li>Local work journal</li>
              <li>Cloud reports when connected</li>
            </ul>
            <Link href="/install" className={styles.primaryButton}>
              Install CommitDiary <ArrowIcon />
            </Link>
          </div>
        </section>

        <section className={styles.faqSection} aria-labelledby="faq-title">
          <SectionHeading
            label="Questions, answered plainly"
            title="What developers ask before installing CommitDiary."
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

        <section className={styles.aiSummary} aria-labelledby="summary-title">
          <p className={styles.eyebrow}>CommitDiary in one paragraph</p>
          <h2 id="summary-title">A developer work journal powered by Git history and reliable AI reports.</h2>
          <p>
            CommitDiary turns commits, changed files, categories, components, and diff summaries into clear reports for standups, weekly updates, sprint reviews, retrospectives, release notes, Discord notifications, and public activity badges. Stepper handles provider routing, retries, validation, failover, callbacks, and structured AI output.
          </p>
        </section>

        <section className={styles.finalCta} aria-labelledby="final-cta-title">
          <div className={styles.finalCtaMark} aria-hidden="true">cd/</div>
          <div>
            <p className={styles.eyebrow}>Your work is already in Git</p>
            <h2 id="final-cta-title">Give it a memory people can read.</h2>
            <p>Install the extension and turn your next commit into a useful engineering update.</p>
          </div>
          <div className={styles.finalActions}>
            <Link href="/install" className={styles.lightButton}>
              Install the extension <ArrowIcon />
            </Link>
            <Link href="/github" className={styles.outlineLightButton}>
              Star CommitDiary on GitHub
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
