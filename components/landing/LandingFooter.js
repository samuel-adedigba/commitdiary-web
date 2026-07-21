import Link from "next/link";
import { BrandMark } from "./BrandIdentity";
import { footerGroups } from "./landing-content";
import styles from "./landing.module.scss";

export default function LandingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>
        <div className={styles.footerIntro}>
          <BrandMark size={48} />
          <h2>A clearer memory of the work you ship.</h2>
          <p>
            CommitDiary turns Git activity into reports developers can use and teams can understand.
          </p>
        </div>

        {footerGroups.map((group) => (
          <nav key={group.title} aria-label={`${group.title} links`}>
            <h3>{group.title}</h3>
            {group.links.map(([label, href]) => (
              <Link key={label} href={href}>
                {label}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <div className={styles.footerBase}>
        <p>© {new Date().getFullYear()} CommitDiary. Built for people who make software.</p>
        <p>Git records the change. CommitDiary keeps the story.</p>
      </div>
    </footer>
  );
}
