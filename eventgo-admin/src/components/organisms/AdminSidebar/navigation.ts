
import {
  LayoutDashboard,
  ChartNoAxesCombined,
  CalendarDays,
  Users,
  ShoppingBag,
  Ticket,
  MapPin,
} from "lucide-react";

export const adminNavigation = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Analytics",
    href: "/statistics",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Manage Events",
    href: "/manage-events",
    icon: CalendarDays,
  },
  {
    label: "Participants",
    href: "/participants",
    icon: Users,
  },
  {
    label: "Orders",
    href: "/orders",
    icon: ShoppingBag,
  },
  {
    label: "Ticket Types",
    href: "/ticket-types",
    icon: Ticket,
  },
  {
    label: "Cities",
    href: "/cities",
    icon: MapPin,
  },
];
