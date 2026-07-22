"use client";

import Link from "next/link";
import { useState } from "react";
import { Dropdown, Image, ListGroup } from "react-bootstrap";
import { useAuth } from "../lib/auth-context";

const UTILITY_LINKS = [
  { href: "/marketplace", label: "VS Code Marketplace", icon: "package" },
  { href: "/documentation", label: "Documentation", icon: "book-open" },
];

const QuickMenu = () => {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  const handleSignOut = async () => {
    if (isSigningOut) return;

    try {
      setIsSigningOut(true);
      setSignOutError("");
      await signOut();
    } catch {
      setSignOutError("We could not sign you out. Try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <ListGroup
      as="ul"
      bsPrefix="navbar-nav"
      className="navbar-right-wrap ms-auto d-flex nav-top-wrap align-items-center"
    >
      {UTILITY_LINKS.map((item) => (
        <li key={item.href} className="me-2 d-none d-sm-block">
          <Link
            href={item.href}
            className="btn btn-light btn-icon rounded-circle indicator indicator-primary text-muted"
            aria-label={item.label}
            title={item.label}
          >
            <i className={`fe fe-${item.icon}`} aria-hidden="true" />
          </Link>
        </li>
      ))}

      <Dropdown as="li" className="stopevent">
        <Dropdown.Toggle
          as="button"
          type="button"
          bsPrefix="nav-icon-button"
          id="dropdownNotification"
          className="dashboard-icon-toggle btn btn-light btn-icon rounded-circle indicator indicator-primary text-muted"
          aria-label="Open notifications"
        >
          <i className="fe fe-bell" aria-hidden="true" />
        </Dropdown.Toggle>
        <Dropdown.Menu
          className="dashboard-dropdown notifications-dropdown dropdown-menu-lg dropdown-menu-end py-0"
          aria-labelledby="dropdownNotification"
          align="end"
        >
          <div className="border-bottom px-3 py-3">
            <h2 className="h5 mb-0">Notifications</h2>
          </div>
          <div className="bg-light px-3 py-4 text-center">
            <p className="mb-0 text-muted">You have no notifications.</p>
          </div>
        </Dropdown.Menu>
      </Dropdown>

      <Dropdown as="li" className="ms-2">
        <Dropdown.Toggle
          as="button"
          type="button"
          bsPrefix="nav-icon-button"
          className="dashboard-icon-toggle rounded-circle"
          id="dropdownUser"
          aria-label={`Open account menu for ${displayName}`}
        >
          <span className="avatar avatar-md avatar-indicators avatar-online">
            <Image
              alt=""
              src={user?.user_metadata?.avatar_url || "/images/avatar/avatar-1.jpg"}
              className="rounded-circle"
            />
          </span>
        </Dropdown.Toggle>
        <Dropdown.Menu
          className="dropdown-menu dropdown-menu-end dashboard-account-menu"
          align="end"
          aria-labelledby="dropdownUser"
        >
          <div className="px-4 pb-2 pt-2">
            <p className="mb-1 fw-semibold text-break">{displayName}</p>
            <p className="mb-0 text-muted small text-break">{user?.email}</p>
          </div>
          <Dropdown.Divider />
          <Dropdown.Item as={Link} href="/pages/settings">
            <i className="fe fe-settings me-2" aria-hidden="true" />
            Account settings
          </Dropdown.Item>
          <Dropdown.Item type="button" as="button" disabled={isSigningOut} onClick={handleSignOut}>
            <i className="fe fe-power me-2" aria-hidden="true" />
            {isSigningOut ? "Signing out…" : "Sign out"}
          </Dropdown.Item>
          {signOutError ? (
            <div className="px-3 pb-2 text-danger small" role="alert">
              {signOutError}
            </div>
          ) : null}
        </Dropdown.Menu>
      </Dropdown>
    </ListGroup>
  );
};

export default QuickMenu;
