"use client";

import {
  Boxes,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
} from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/lib/actions/auth";
import { getInitials } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Boxes },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname, href) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`र{href}/`);
}

export function AppShell({ children, user }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const userLabel = user.user_metadata?.full_name || user.email || "Account";

  useEffect(() => {
    function closeProfileMenu(event) {
      if (event.type === "keydown" && event.key === "Escape") {
        setProfileOpen(false);
        return;
      }

      if (
        event.type === "pointerdown" &&
        !profileRef.current?.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeProfileMenu);
    document.addEventListener("keydown", closeProfileMenu);
    return () => {
      document.removeEventListener("pointerdown", closeProfileMenu);
      document.removeEventListener("keydown", closeProfileMenu);
    };
  }, []);

  return (
    <div className="app-shell">
      <button
        aria-label="Close navigation"
        className="mobile-overlay"
        data-open={menuOpen}
        onClick={() => setMenuOpen(false)}
        type="button"
      />
      <aside className="sidebar" data-open={menuOpen}>
        <a aria-label="StockFlow home" className="brand" href="/dashboard">
          <Image
            alt=""
            className="brand-image"
            height={30}
            priority
            src="/stockflow-mark.svg"
            width={30}
          />
          <span>StockFlow</span>
        </a>

        <nav aria-label="Main navigation" className="side-nav">
          {navigation.map(({ href, label, icon: Icon }) => (
            <a
              aria-current={isActive(pathname, href) ? "page" : undefined}
              className="nav-link"
              href={href}
              key={href}
              onClick={() => setMenuOpen(false)}
            >
              <Icon aria-hidden="true" size={16} strokeWidth={1.8} />
              <span>{label}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <div className="sidebar-user">
          <span className="user-avatar">{getInitials(userLabel) || "U"}</span>
          <span className="sidebar-user-copy">
            <strong>{userLabel}</strong>
            <span>Owner</span>
          </span>
          <form action={logoutAction}>
            <button aria-label="Sign out" className="icon-button" title="Sign out">
              <LogOut aria-hidden="true" size={15} />
            </button>
          </form>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <button
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            className="mobile-menu-button"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <Menu aria-hidden="true" size={19} />
          </button>
          <a aria-label="StockFlow dashboard" className="mobile-brand" href="/dashboard">
            <Image
              alt=""
              className="brand-image brand-image-small"
              height={26}
              priority
              src="/stockflow-mark.svg"
              width={26}
            />
            StockFlow
          </a>
          <span className="topbar-title">
            {navigation.find((item) => isActive(pathname, item.href))?.label ??
              "StockFlow"}
          </span>
          <div className="topbar-right">
            <div className="profile-menu" ref={profileRef}>
              <button
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                aria-label="Open account menu"
                className="profile-trigger"
                onClick={() => setProfileOpen((open) => !open)}
                type="button"
              >
                <span className="user-avatar">{getInitials(userLabel) || "U"}</span>
              </button>
              {profileOpen ? (
                <div aria-label="Account menu" className="profile-dropdown" role="menu">
                  <div className="profile-details">
                    <strong>{userLabel}</strong>
                    {user.email ? <span>{user.email}</span> : null}
                  </div>
                  <Link
                    className="profile-menu-item"
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    role="menuitem"
                  >
                    <Settings aria-hidden="true" size={15} />
                    Settings
                  </Link>
                  <form action={logoutAction}>
                    <button className="profile-menu-item" role="menuitem" type="submit">
                      <LogOut aria-hidden="true" size={15} />
                      Sign out
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        {children}
      </section>
    </div>
  );
}
