import { rawCommits } from "./landing-content";
import styles from "./landing.module.scss";

export default function ProductPreview() {
  return (
    <div className={styles.previewShell} aria-label="Example Git commits transformed into a CommitDiary report">
      <div className={styles.previewToolbar}>
        <div className={styles.windowDots} aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span>workspace / auth-reliability</span>
        <span className={styles.syncedState}>
          <i aria-hidden="true" /> synced
        </span>
      </div>

      <div className={styles.previewGrid}>
        <section className={styles.commitPanel} aria-labelledby="raw-activity-title">
          <div className={styles.panelHeading}>
            <span id="raw-activity-title">Raw Git activity</span>
            <span>4 commits</span>
          </div>
          <ol className={styles.commitList}>
            {rawCommits.map((commit) => (
              <li key={`${commit.type}-${commit.scope}`}>
                <span className={styles.commitRail} aria-hidden="true">
                  <i />
                </span>
                <code>
                  <b>{commit.type}</b>
                  <span>({commit.scope})</span>: {commit.text}
                </code>
                <small>today</small>
              </li>
            ))}
          </ol>
        </section>

        <div className={styles.processingRail} aria-hidden="true">
          <span>categorize</span>
          <i />
          <span>group</span>
          <i />
          <span>validate</span>
        </div>

        <article className={styles.reportPanel} aria-labelledby="report-preview-title">
          <div className={styles.panelHeading}>
            <span>CommitDiary report</span>
            <span className={styles.readyPill}>report ready</span>
          </div>
          <p className={styles.reportEyebrow}>Daily engineering update</p>
          <h2 id="report-preview-title">Reliability work, made readable.</h2>
          <p>
            Today’s work improved authentication, webhook recovery, and dashboard maintainability.
          </p>
          <div className={styles.reportDivider} />
          <h3>Key changes</h3>
          <ul>
            <li>Added safer token refresh handling</li>
            <li>Improved failed webhook retries</li>
            <li>Split dashboard widgets into focused parts</li>
            <li>Added sync queue retry tests</li>
          </ul>
          <div className={styles.reportImpact}>
            <span>Impact</span>
            <p>The app is more resilient when sessions expire or callbacks fail.</p>
          </div>
        </article>
      </div>

      <div className={styles.stepperStatus}>
        <span className={styles.stepperMonogram} aria-hidden="true">S</span>
        <span>
          <strong>Validated by Stepper</strong>
          <small>Structured output · Retry-safe · Provider-flexible</small>
        </span>
        <span className={styles.statusChecks} aria-label="Three checks passed">✓ ✓ ✓</span>
      </div>
    </div>
  );
}
