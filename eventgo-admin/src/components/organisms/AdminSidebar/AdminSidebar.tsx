
"use client";

import { AdminBrand } from "@/components/atoms/AdminBrand/AdminBrand";
import { SidebarNavItem } from "@/components/molecules/SidebarNavItem/SidebarNavItem";
import { adminNavigation } from "./navigation";

interface SidebarContentProps {
  onNavigate?: () => void;
}

export function AdminSidebarContent({
  onNavigate,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col bg-[#172130]">
      <div className="flex min-h-20 shrink-0 items-center border-b border-white/10 px-6 py-4">
        <AdminBrand />
      </div>

      <nav
        aria-label="Admin navigation"
        className="flex-1 space-y-1 overflow-y-auto px-3 py-6"
      >
        {adminNavigation.map((item) => (
          <SidebarNavItem
            key={item.href}
            label={item.label}
            href={item.href}
            icon={item.icon}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="border-t border-white/10 px-6 py-5">
        <p className="text-xs font-medium text-slate-400">
          EventGo Administration
        </p>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  return (
    <aside className="admin-sidebar sticky top-0 hidden h-screen shrink-0 lg:block">
      <AdminSidebarContent />
    </aside>
  );
}
