
import Link from "next/link";
import { Heart, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserActionsProps {
  className?: string;
}

const iconClass =
  "flex size-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-orange-50 hover:text-[#FF6B53] focus-visible:outline-2 focus-visible:outline-[#FF6B53]";

export function UserActions({
  className,
}: UserActionsProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Link
        href="/favorites"
        aria-label="Favorites"
        className={iconClass}
      >
        <Heart size={20} />
      </Link>

      <Link
        href="/notifications"
        aria-label="Notifications"
        className={iconClass}
      >
        <Bell size={20} />
      </Link>

      <Link
        href="/login"
        className="rounded-full px-4 py-2 text-sm font-semibold text-[#101828] transition hover:bg-slate-100"
      >
        Log in
      </Link>

      <Link
        href="/signup"
        className="rounded-full bg-[#101828] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#293344]"
      >
        Sign up
      </Link>
    </div>
  );
}
