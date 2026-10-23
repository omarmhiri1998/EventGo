
import Link from "next/link";

import { Brand } from "@/components/atoms/Brand/Brand";
import { FooterColumn } from "@/components/molecules/FooterColumn/FooterColumn";
import { SocialLinks } from "@/components/molecules/SocialLinks/SocialLinks";

const discoverLinks = [
  { label: "Explore", href: "/explore" },
  { label: "Categories", href: "/explore#categories" },
  { label: "Popular Events", href: "/#popular-events" },
  { label: "This Weekend", href: "/explore?date=weekend" },
];

const companyLinks = [
  { label: "About", href: "/help" },
  { label: "For Organizers", href: "/organizers" },
  { label: "Contact", href: "/help" },
];

const accountLinks = [
  { label: "My Events", href: "/my-events" },
  { label: "Help Center", href: "/help" },
];

export function Footer() {
  return (
    <footer className="bg-[#08111D] text-white">
      {/* Main Footer */}
      <div className="mx-auto max-w-[1280px] px-5 pb-16 pt-20 lg:px-10">
        {/* Footer Columns */}
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand and Description */}
          <div>
            <Brand variant="light" />

            <p className="mt-6 max-w-[260px] text-sm leading-7 text-slate-400">
              Discover extraordinary events, find new
              experiences, and create unforgettable memories
              with EventGo.
            </p>

            <SocialLinks
              links={[]}
              className="mt-6"
            />
          </div>

          {/* Discover */}
          <FooterColumn
            title="Discover"
            links={discoverLinks}
          />

          {/* Company */}
          <FooterColumn
            title="Company"
            links={companyLinks}
          />

          {/* Account */}
          <FooterColumn
            title="Account"
            links={accountLinks}
          />
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-5 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p>
            © {new Date().getFullYear()} EventGo.
            All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="transition hover:text-white"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="transition hover:text-white"
            >
              Terms
            </Link>

            <Link
              href="/imprint"
              className="transition hover:text-white"
            >
              Imprint
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
