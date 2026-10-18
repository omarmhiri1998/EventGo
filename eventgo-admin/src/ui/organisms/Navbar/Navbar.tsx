import Brand from "@/ui/atoms/Brand/Brand";
import NavItem from "@/ui/molecules/NavItem/NavItem";
import UserActions from "@/ui/molecules/UserActions/UserActions";

const navItems = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Explore",
    href: "/explore",
  },
  {
    label: "My Events",
    href: "/my-events",
  },
];

export default function Navbar() {
  return (
    <header
      className="
        eventgo-navbar
        sticky
        top-0
        z-50
        w-full
        overflow-hidden
        border-b
        border-zinc-200
        bg-white
      "
    >
      <div className="fireworks" aria-hidden="true">
        <span className="firework firework-1" />
        <span className="firework firework-2" />
        <span className="firework firework-3" />
      </div>

      <div
        className="
          relative
          z-10
          mx-auto
          grid
          h-24
          w-full
          grid-cols-[1fr_auto_1fr]
          items-center
          px-[6vw]
        "
      >
        <Brand />

        <nav
          className="flex items-center gap-12"
          aria-label="Main navigation"
        >
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
            />
          ))}
        </nav>

        <div className="justify-self-end">
          <UserActions />
        </div>
      </div>
    </header>
  );
}