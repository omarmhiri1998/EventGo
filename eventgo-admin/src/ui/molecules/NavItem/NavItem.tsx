"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItemProps = {
  href: string;
  label: string;
};

export default function NavItem({
  href,
  label,
}: NavItemProps) {
  const pathname = usePathname();

  const isActive =
    href === "/"
      ? pathname === "/"
      : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`
        relative
        flex h-24 items-center
        px-1
        text-[17px]
        font-medium
        no-underline
        transition-colors
        ${
          isActive
            ? "text-zinc-950"
            : "text-zinc-500 hover:text-zinc-950"
        }
      `}
    >
      {label}

      {isActive && (
        <span
          className="
            absolute
            bottom-0
            left-0
            right-0
            h-[3px]
            rounded-t-full
            bg-orange-500
          "
        />
      )}
    </Link>
  );
}