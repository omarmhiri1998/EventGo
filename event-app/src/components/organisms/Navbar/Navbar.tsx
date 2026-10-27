
"use client";

import { useState } from "react";
import Link from "next/link";

import {
  Menu,
  X,
  Heart,
  Bell,
  LogOut,
  LayoutDashboard,
} from "lucide-react";

import { Brand } from "@/components/atoms/Brand/Brand";
import { IconButton } from "@/components/atoms/IconButton/IconButton";
import { NavbarFireworks } from "@/components/atoms/NavbarFireworks/NavbarFireworks";
import { NavItem } from "@/components/molecules/NavItem/NavItem";

type NavbarProps = {
  role: "user" | "admin";
};

const navigation = [
  { label: "Home", href: "/" },
  { label: "Explore", href: "/explore" },
  { label: "My Events", href: "/my-events" },
];

const ADMIN_URL = "/admin";

export function Navbar({ role }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const isAdmin = role === "admin";

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError("");

    try {
      const response = await fetch(
        "/auth/api/auth/logout",
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      setMenuOpen(false);
      window.location.replace("/auth/login");
    } catch {
      setLogoutError(
        "Could not log out. Please try again."
      );
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#EAE7E3] bg-white/95 backdrop-blur-xl">
      <NavbarFireworks />

      <div className="relative z-10 mx-auto flex h-[76px] max-w-[1280px] items-center justify-between px-5 lg:px-10">
        <Brand />

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 rounded-full bg-[#F4F2EF] p-1 md:flex"
        >
          {navigation.map((item) => (
            <NavItem
              key={item.href}
              label={item.label}
              href={item.href}
            />
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/favorites"
            aria-label="Favorites"
            className="rounded-full p-2 text-[#344054] transition hover:bg-orange-50 hover:text-orange-500"
          >
            <Heart size={20} />
          </Link>

          <Link
            href="/notifications"
            aria-label="Notifications"
            className="rounded-full p-2 text-[#344054] transition hover:bg-orange-50 hover:text-orange-500"
          >
            <Bell size={20} />
          </Link>

          {isAdmin && (
            <a
              href={ADMIN_URL}
              className="flex items-center gap-2 rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
            >
              <LayoutDashboard size={17} />
              Admin
            </a>
          )}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 rounded-full bg-[#101828] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut size={17} />
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>

        <div className="md:hidden">
          <IconButton
            icon={
              menuOpen ? (
                <X size={23} />
              ) : (
                <Menu size={23} />
              )
            }
            label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="eventgo-mobile-navigation"
            onClick={() =>
              setMenuOpen((value) => !value)
            }
          />
        </div>
      </div>

      {menuOpen && (
        <nav
          id="eventgo-mobile-navigation"
          aria-label="Mobile navigation"
          className="relative z-10 flex flex-col gap-2 border-t border-[#EAE7E3] bg-white px-5 py-4 md:hidden"
        >
          {navigation.map((item) => (
            <NavItem
              key={item.href}
              label={item.label}
              href={item.href}
              onNavigate={() => setMenuOpen(false)}
            />
          ))}

          <div className="my-2 border-t border-[#EAE7E3]" />

          <Link
            href="/favorites"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-lg p-3 text-sm font-semibold"
          >
            <Heart size={18} />
            Favorites
          </Link>

          <Link
            href="/notifications"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-lg p-3 text-sm font-semibold"
          >
            <Bell size={18} />
            Notifications
          </Link>

          {isAdmin && (
            <a
              href={ADMIN_URL}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg p-3 text-sm font-semibold text-orange-600"
            >
              <LayoutDashboard size={18} />
              Admin Dashboard
            </a>
          )}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center justify-center gap-2 rounded-full bg-[#101828] p-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
          >
            <LogOut size={18} />
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </nav>
      )}

      {logoutError && (
        <div
          role="alert"
          className="relative z-10 bg-red-50 px-5 py-2 text-center text-sm text-red-700"
        >
          {logoutError}
        </div>
      )}
    </header>
  );
}
