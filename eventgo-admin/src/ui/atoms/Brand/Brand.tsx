import Image from "next/image";
import Link from "next/link";

export default function Brand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-3 no-underline"
    >
      <Image
        src="/images/branding/eventgo-logo.jpeg"
        alt="EventGo logo"
        width={48}
        height={48}
        priority
      />

      <span className="text-2xl font-bold tracking-tight text-zinc-900">
        Event
        <span className="text-[#ef5b4c]">
          Go
        </span>
      </span>
    </Link>
  );
}