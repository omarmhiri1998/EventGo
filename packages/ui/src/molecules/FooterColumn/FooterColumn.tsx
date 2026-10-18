
import Link from "next/link";

import { cn } from "../../lib/utils";

export interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumnProps {
  title: string;
  links: FooterLink[];
  className?: string;
}

export function FooterColumn({
  title,
  links,
  className,
}: FooterColumnProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <h3 className="mb-5 text-base font-bold text-white">
        {title}
      </h3>

      <ul className="space-y-3">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link
              href={link.href}
              className={cn(
                "text-sm text-slate-400",
                "transition-colors duration-200",
                "hover:text-[#FF6B53]",
                "focus-visible:rounded-sm",
                "focus-visible:outline-2",
                "focus-visible:outline-[#FF6B53]"
              )}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
