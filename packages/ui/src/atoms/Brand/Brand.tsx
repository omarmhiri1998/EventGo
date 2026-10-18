
import Link from "next/link";
import { Ticket } from "lucide-react";

interface BrandProps {
  variant?: "light" | "dark";
  className?: string;
}

export function Brand({
  variant = "dark",
  className = "",
}: BrandProps) {
  return (
    <Link
      href="/"
      aria-label="EventGo homepage"
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        textDecoration: "none",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: "flex",
          width: "40px",
          height: "40px",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          backgroundColor: "#FF6B53",
          color: "#FFFFFF",
        }}
      >
        <Ticket size={21} strokeWidth={2.2} />
      </span>

      <span
        style={{
          fontSize: "24px",
          fontWeight: 800,
          letterSpacing: "-0.7px",
          color: variant === "light" ? "#FFFFFF" : "#101828",
          whiteSpace: "nowrap",
        }}
      >
        Event
        <span style={{ color: "#FF6B53" }}>Go</span>
      </span>
    </Link>
  );
}
