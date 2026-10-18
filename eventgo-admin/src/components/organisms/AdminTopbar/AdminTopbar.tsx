
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import {
  Menu,
  ExternalLink,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { AdminSidebarContent } from "@/components/organisms/AdminSidebar/AdminSidebar";
import { adminNavigation } from "@/components/organisms/AdminSidebar/navigation";

export function AdminTopbar() {
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const currentPage =
    adminNavigation.find((item) =>
      item.href === "/"
        ? pathname === "/"
        : pathname === item.href ||
          pathname.startsWith(`${item.href}/`)
    )?.label ?? "Dashboard";

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError("");

    try {
      const response = await fetch("/auth/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Logout failed: HTTP ${response.status}`);
      }

      // Navigate in the same browser tab.
      window.location.replace("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      setLogoutError("Logout failed. Please try again.");
      setLoggingOut(false);
    }
  }

  return (
    <header className="admin-topbar sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="flex min-h-[var(--admin-topbar-height)] items-center justify-between gap-4 px-5 py-3 lg:px-8">
        {/* LEFT */}
        <div className="flex min-w-0 items-center gap-3">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-[#08111D] lg:hidden"
                  aria-label="Open sidebar"
                >
                  <Menu size={22} />
                </Button>
              }
            />

            <SheetContent
              side="left"
              showCloseButton={false}
              className="w-[var(--admin-sidebar-width)] border-none bg-[#172130] p-0"
            >
              <SheetTitle className="sr-only">
                Admin Navigation
              </SheetTitle>

              <AdminSidebarContent
                onNavigate={() => setMenuOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <div>
            <h1 className="text-lg font-bold text-[#08111D]">
              {currentPage}
            </h1>

            <p className="hidden text-xs text-slate-500 sm:block">
              EventGo Administration
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex shrink-0 items-center gap-2 lg:gap-3">
          {/* VIEW WEBSITE */}
          <a
            href="http://localhost:3000/"
            aria-label="View EventGo Website"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#08111D] transition hover:bg-slate-50 sm:px-4"
          >
            <ExternalLink size={18} />

            <span className="hidden sm:inline">
              View Website
            </span>
          </a>

          {/* LOG OUT */}
          <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
            disabled={loggingOut}
            className="h-10 gap-2 rounded-xl border-slate-200 px-3 text-[#08111D] sm:px-4"
          >
            <LogOut size={18} />

            <span className="hidden sm:inline">
              {loggingOut ? "Logging out..." : "Log out"}
            </span>
          </Button>

          {/* ADMIN PROFILE */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-[#FFE9E4] font-bold text-[#FF6B53]">
                A
              </AvatarFallback>
            </Avatar>

            <div className="hidden xl:block">
              <p className="text-sm font-bold text-[#08111D]">
                Admin
              </p>

              <p className="text-xs text-slate-500">
                Administrator
              </p>
            </div>
          </div>
        </div>
      </div>

      {logoutError && (
        <div
          role="alert"
          className="border-t border-red-200 bg-red-50 px-5 py-2 text-sm text-red-700 lg:px-8"
        >
          {logoutError}
        </div>
      )}
    </header>
  );
}
