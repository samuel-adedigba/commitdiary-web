import Image from "next/image";
import Link from "next/link";
import PropTypes from "prop-types";
import { authHighlights, authPageContent } from "./auth-content";
import styles from "./auth.module.scss";

export default function AuthShell({ page, children }) {
  const content = authPageContent[page];

  return (
    <div className={styles.authPage}>
      <a className={styles.skipLink} href="#auth-form">
        Skip to account form
      </a>

      <section className={styles.storyPanel} aria-labelledby={`${page}-story-title`}>
        <div className={styles.storyInner}>
          <Link href="/" className={styles.brand} aria-label="CommitDiary home">
            <Image
              src="/images/brand/commitdiary-mark.svg"
              alt=""
              aria-hidden="true"
              width={48}
              height={48}
              unoptimized
            />
            <span>
              <strong>CommitDiary</strong>
              <small>Work journal for developers</small>
            </span>
          </Link>

          <div className={styles.storyCopy}>
            <p className={styles.eyebrow}>{content.eyebrow}</p>
            <p className={styles.storyTitle} id={`${page}-story-title`}>
              {content.storyTitle}
            </p>
            <p>{content.storyDescription}</p>
          </div>

          <ol className={styles.highlights}>
            {authHighlights.map((item, index) => (
              <li key={item.id}>
                <span aria-hidden="true">0{index + 1}</span>
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className={styles.storyFooter}>Git records the change. CommitDiary keeps the story.</p>
        </div>
      </section>

      <main className={styles.formPanel} id="auth-form" tabIndex={-1}>
        <div className={styles.formWrap}>
          <div className={styles.formTopline}>
            <Link href="/" className={styles.backLink}>
              <span aria-hidden="true">←</span> Back to home
            </Link>
            <Link href="/" className={styles.mobileBrand} aria-label="CommitDiary home">
              <Image
                src="/images/brand/commitdiary-mark.svg"
                alt=""
                aria-hidden="true"
                width={38}
                height={38}
                unoptimized
              />
              <strong>CommitDiary</strong>
            </Link>
          </div>

          <header className={styles.formHeader}>
            <p className={styles.eyebrow}>{content.formEyebrow}</p>
            <h1 id={`${page}-form-title`}>{content.formTitle}</h1>
            <p>{content.formDescription}</p>
          </header>

          {children}
        </div>
      </main>
    </div>
  );
}

AuthShell.propTypes = {
  page: PropTypes.oneOf(["signIn", "signUp", "resetPassword", "newPassword"]).isRequired,
  children: PropTypes.node.isRequired,
};
