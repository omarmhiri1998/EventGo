
"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface EventImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

export function EventImage({
  src,
  alt,
  className,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 33vw",
}: EventImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const hasImage = Boolean(src) && failedSrc !== src;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br",
        "from-[#172D3C] via-[#36505B] to-[#D8755B]",
        className
      )}
    >
      {hasImage && src ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-white/80">
          <ImageIcon size={38} strokeWidth={1.5} />
          <span className="text-center text-xs font-semibold tracking-widest">
            IMAGE COMING SOON
          </span>
        </div>
      )}
    </div>
  );
}
