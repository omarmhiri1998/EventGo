
import {
  Camera,
  Users,
  BriefcaseBusiness,
  Play,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type SocialPlatform =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "youtube";

interface SocialLink {
  platform: SocialPlatform;
  href: string;
}

interface SocialLinksProps {
  links: SocialLink[];
  className?: string;
}

const icons: Record<SocialPlatform, LucideIcon> = {
  instagram: Camera,
  facebook: Users,
  linkedin: BriefcaseBusiness,
  youtube: Play,
};

export function SocialLinks({
  links,
  className,
}: SocialLinksProps) {
  if (links.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {links.map(({ platform, href }) => {
        const Icon = icons[platform];

        return (
          <a
            key={platform}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`EventGo on ${platform}`}
            className="flex size-10 items-center justify-center rounded-full border border-white/15 text-slate-400 transition hover:border-[#FF6B53] hover:text-[#FF6B53]"
          >
            <Icon size={19} aria-hidden="true" />
          </a>
        );
      })}
    </div>
  );
}
