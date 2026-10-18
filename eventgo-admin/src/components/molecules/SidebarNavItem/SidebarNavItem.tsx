
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

interface SidebarNavItemProps {
  label: string;
  href: string;
  icon: LucideIcon;
  onNavigate?: () => void;
}

export function SidebarNavItem({
  label,
  href,
  icon: Icon,
  onNavigate,
}: SidebarNavItemProps) {
  const pathname = usePathname();

  const isActive =
    href === "/"
      ? pathname === "/"
      : pathname === href ||
        pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={`
        flex items-center gap-3 rounded-xl px-4 py-3
        text-sm font-medium transition-all
        ${
          isActive
            ? "bg-[#FF6B53]/15 text-[#FF6B53]"
            : "text-slate-300 hover:bg-white/10 hover:text-white"
        }
      `}
    >
      <Icon size={19} strokeWidth={2} />

      <span>{label}</span>
    </Link>
  );
}
