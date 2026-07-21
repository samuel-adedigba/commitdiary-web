import Link from "next/link";
import { BrandLockup } from "./BrandIdentity";
import { navigation } from "./landing-content";
import styles from "./landing.module.scss";

function NavigationLinks({ mobile = false }) {
  return (
    <nav
      className={mobile ? styles.mobileNav : styles.desktopNav}
      aria-label={mobile ? "Mobile navigation" : "Main navigation"}
    >
      {navigation.map((item) => (
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default function LandingHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand} aria-label="CommitDiary home">
          <BrandLockup />
        </Link>

        <NavigationLinks />

        <div className={styles.headerActions}>
          <Link className={styles.textLink} href="/github">
            GitHub
          </Link>
          <Link className={styles.compactCta} href="/install">
            Install extension
          </Link>
          <Link className={styles.textLink} href="/login">
            Sign in
          </Link>
        </div>

        <details className={styles.mobileMenu}>
          <summary aria-label="Open navigation menu">
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </summary>
          <div className={styles.mobileMenuPanel}>
            <NavigationLinks mobile />
            <Link className={styles.mobileInstall} href="/install">
              Install VS Code extension
            </Link>
            <div className={styles.mobileUtilityLinks}>
              <Link href="/github">View GitHub</Link>
              <Link href="/login">Sign in</Link>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
