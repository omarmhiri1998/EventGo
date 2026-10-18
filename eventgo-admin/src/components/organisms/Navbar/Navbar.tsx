
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Heart,
  Bell,
  ArrowUpRight,
} from "lucide-react";

// Shared UI Components
import { Brand } from "@eventgo/ui/Brand";
import { IconButton } from "@eventgo/ui/IconButton";

// Admin Components
import { NavbarFireworks } from "@/components/atoms/NavbarFireworks/NavbarFireworks";
import { NavItem } from "@/components/molecules/NavItem/NavItem";
import { UserActions } from "@/components/molecules/UserActions/UserActions";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Explore", href: "/explore" },
  { label: "My Events", href: "/my-events" },
  { label: "Statistics", href: "/statistics" },
  { label: "Manage Events", href: "/manage-events" },
  { label: "Participants", href: "/participants" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#EAE7E3] bg-white/95 backdrop-blur-xl">
      <NavbarFireworks />

      <div className="relative z-10 mx-auto flex min-h-[76px] max-w-[1280px] items-center justify-between gap-4 px-5 lg:px-10">
        {/* Logo */}
        <Brand />

        {/* Desktop Navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 rounded-full bg-[#F4F2EF] p-1 xl:flex"
        >
          {navigation.map((item) => (
            <NavItem
              key={item.href}
              label={item.label}
              href={item.href}
            />
          ))}
        </nav>

        {/* Desktop User Actions */}
        <div className="hidden items-center gap-3 xl:flex">
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[#EAE7E3] bg-white px-4 py-2 text-sm font-semibold text-[#101828] transition-colors hover:bg-[#F4F2EF]"
          >
            Go to Event App
            <ArrowUpRight size={16} />
          </a>

          <UserActions />
        </div>

        {/* Mobile Menu Button */}
        <div className="xl:hidden">
          <IconButton
            icon={
              menuOpen ? <X size={23} /> : <Menu size={23} />
            }
            label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="eventgo-mobile-navigation"
            onClick={() => setMenuOpen((value) => !value)}
          />
        </div>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <nav
          id="eventgo-mobile-navigation"
          aria-label="Mobile navigation"
          className="relative z-10 flex flex-col gap-2 border-t border-[#EAE7E3] bg-white px-5 py-4 xl:hidden"
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

          {/* Go to Event App */}
          <a
            href="/"
            className="flex items-center justify-between rounded-lg bg-[#101828] p-3 text-sm font-semibold text-white"
          >
            Go to Event App
            <ArrowUpRight size={18} />
          </a>

          {/* Favorites */}
          <Link
            href="/favorites"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-lg p-3 text-sm font-semibold"
          >
            <Heart size={18} />
            Favorites
          </Link>

          {/* Notifications */}
          <Link
            href="/notifications"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-lg p-3 text-sm font-semibold"
          >
            <Bell size={18} />
            Notifications
          </Link>
        </nav>
      )}
    </header>
  );
}
