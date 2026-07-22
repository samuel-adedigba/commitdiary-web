"use client";

import React, { type ReactNode, useEffect, useRef, useState } from "react";
import { useMediaQuery } from "/hooks/useMediaQuery";
import "styles/theme.scss";
import "styles/datatable.css";
import NavbarVertical from "/layouts/navbars/NavbarVertical";
import NavbarTop from "/layouts/navbars/NavbarTop";
import { AuthGuard } from "../../components/AuthGuard";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const navigationRef = useRef<HTMLElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusOnCloseRef = useRef(false);
  const isMobile = useMediaQuery("(max-width: 767.98px)");
  const navigationVisible = isMobile ? mobileMenuOpen : !desktopSidebarCollapsed;

  const closeMobileNavigation = (restoreFocus = false) => {
    restoreFocusOnCloseRef.current = restoreFocus;
    setMobileMenuOpen(false);
  };

  const toggleNavigation = () => {
    if (isMobile) {
      if (mobileMenuOpen) closeMobileNavigation(true);
      else setMobileMenuOpen(true);
      return;
    }
    setDesktopSidebarCollapsed((collapsed) => !collapsed);
  };

  useEffect(() => {
    if (!isMobile) setMobileMenuOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (mobileMenuOpen || !restoreFocusOnCloseRef.current) return;
    restoreFocusOnCloseRef.current = false;
    toggleButtonRef.current?.focus();
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!isMobile || !mobileMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    navigationRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileNavigation(true);
        return;
      }
      if (event.key !== "Tab") return;

      const focusableElements = navigationRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const navigationFocused = document.activeElement === navigationRef.current;
      const focusIsOutsideNavigation = !navigationRef.current?.contains(document.activeElement);
      if (
        event.shiftKey &&
        (document.activeElement === firstElement || focusIsOutsideNavigation || navigationFocused)
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === lastElement || focusIsOutsideNavigation || navigationFocused)
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobile, mobileMenuOpen]);

  const wrapperClasses = [
    desktopSidebarCollapsed ? "desktop-sidebar-collapsed" : "",
    mobileMenuOpen ? "mobile-menu-open" : "",
  ].filter(Boolean).join(" ");

  const handleNavigation = () => {
    if (isMobile) closeMobileNavigation(true);
  };

  return (
    <AuthGuard>
      <div id="db-wrapper" className={wrapperClasses}>
        <nav
          ref={navigationRef}
          id="dashboard-navigation"
          className="navbar-vertical navbar"
          aria-label="Dashboard navigation"
          aria-hidden={isMobile && !mobileMenuOpen}
          tabIndex={-1}
        >
          <NavbarVertical
            onClose={() => closeMobileNavigation(true)}
            onNavigate={handleNavigation}
          />
        </nav>
        {isMobile && mobileMenuOpen ? (
          <button
            type="button"
            className="dashboard-nav-backdrop"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => closeMobileNavigation(true)}
          />
        ) : null}
        <div id="page-content" inert={isMobile && mobileMenuOpen}>
          <a className="dashboard-skip-link" href="#dashboard-main-content">
            Skip to main content
          </a>
          <div className="header">
            <NavbarTop
              buttonRef={toggleButtonRef}
              navigationVisible={navigationVisible}
              onToggle={toggleNavigation}
            />
          </div>
          <main id="dashboard-main-content" className="dashboard-main-content" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
