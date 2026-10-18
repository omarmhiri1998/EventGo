
import {
  Music2,
  Trophy,
  Cpu,
  UtensilsCrossed,
  Palette,
  BriefcaseBusiness,
  MoonStar,
  PartyPopper,
  Clapperboard,
  Drama,
  Landmark,
  HeartPulse,
  type LucideIcon,
} from "lucide-react";

import type { EventCategory } from "../../types/event";

interface CategoryIconProps {
  category: EventCategory;
  size?: number;
  className?: string;
}

const categoryIcons: Record<EventCategory, LucideIcon> = {
  music: Music2,
  sports: Trophy,
  technology: Cpu,
  food: UtensilsCrossed,
  art: Palette,
  business: BriefcaseBusiness,
  nightlife: MoonStar,
  festivals: PartyPopper,
  cinema: Clapperboard,
  comedy: Drama,
  culture: Landmark,
  wellness: HeartPulse,
};

export function CategoryIcon({
  category,
  size = 28,
  className,
}: CategoryIconProps) {
  const Icon = categoryIcons[category] ?? PartyPopper;

  return (
    <Icon
      size={size}
      strokeWidth={1.8}
      className={className}
      aria-hidden="true"
    />
  );
}
