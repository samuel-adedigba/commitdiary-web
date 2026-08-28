"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLockup } from "./BrandIdentity";
import { navigation } from "./landing-content";
import styles from "./landing.module.scss";

function closeMobileMenu(event) {
  event.currentTarget.closest("details")?.removeAttribute("open");
}

function NavigationLinks({ activeSection, mobile = false }) {
  return (
    <nav
      className={mobile ? styles.mobileNav : styles.desktopNav}
      aria-label={mobile ? "Mobile navigation" : "Main navigation"}
    >
      {navigation.map((item) => {
        const sectionId = item.href.startsWith("/#") ? item.href.slice(2) : null;
        const isActive = sectionId === activeSection;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive ? styles.navLinkActive : undefined}
            aria-current={isActive ? "location" : undefined}
            onClick={mobile ? closeMobileMenu : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function LandingHeader() {
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    const syncActiveSection = () => setActiveSection(window.location.hash.slice(1) || null);
    syncActiveSection();
    window.addEventListener("hashchange", syncActiveSection);
    return () => window.removeEventListener("hashchange", syncActiveSection);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand} aria-label="CommitDiary home">
          <BrandLockup />
        </Link>

        <NavigationLinks activeSection={activeSection} />

        <div className={styles.headerActions}>
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
            <NavigationLinks activeSection={activeSection} mobile />
            <Link className={styles.mobileInstall} href="/install" onClick={closeMobileMenu}>
              Install VS Code extension
            </Link>
            <div className={styles.mobileUtilityLinks}>
              <Link href="/login" onClick={closeMobileMenu}>Sign in</Link>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
