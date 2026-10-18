
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItemProps {
  label: string;
  href: string;
  onNavigate?: () => void;
  className?: string;
}

export function NavItem({
  label,
  href,
  onNavigate,
  className,
}: NavItemProps) {
  const pathname = usePathname();

  const active =
    pathname === href ||
    (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex min-h-10 items-center justify-center",
        "rounded-full px-5 py-2",
        "text-sm font-semibold transition-all duration-200",
        active
          ? "bg-white text-[#101828] shadow-sm"
          : "text-slate-500 hover:bg-white/70 hover:text-[#101828]",
        className
      )}
    >
      {label}
    </Link>
  );
}
