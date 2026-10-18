
"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { toPng } from "html-to-image";
import {
  Download,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface ChartToolsProps {
  title: string;
  children: ReactNode;
}

export function ChartTools({
  title,
  children,
}: ChartToolsProps) {
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!expanded) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setExpanded(false);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded]);

  async function downloadChart() {
    if (!chartRef.current || downloading) return;

    try {
      setDownloading(true);

      await document.fonts.ready;

      const dataUrl = await toPng(chartRef.current, {
        backgroundColor: "#FFFFFF",
        pixelRatio: 2,
        cacheBust: true,
      });

      const link = document.createElement("a");

      link.href = dataUrl;
      link.download = `${title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}.png`;

      link.click();
    } catch (error) {
      console.error("Download failed:", error);
      alert("Could not download chart.");
    } finally {
      setDownloading(false);
    }
  }

  const content = (
    <div
      className={
        expanded
          ? "fixed inset-0 z-[9999] flex flex-col bg-[#FCFAF7] p-4 md:p-6"
          : "relative min-w-0"
      }
    >
      <div className="mb-3 flex shrink-0 items-center justify-end gap-2">
        <button
          type="button"
          onClick={downloadChart}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#08111D] transition hover:bg-slate-50 disabled:opacity-50"
        >
          <Download size={17} />
          {downloading ? "Saving..." : "PNG"}
        </button>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#08111D] transition hover:bg-slate-50"
        >
          {expanded ? (
            <Minimize2 size={17} />
          ) : (
            <Maximize2 size={17} />
          )}

          {expanded ? "Close" : "Expand"}
        </button>
      </div>

      <div
        ref={chartRef}
        data-chart-export
        className={
          expanded
            ? "chart-expanded min-h-0 min-w-0 flex-1 overflow-hidden rounded-3xl bg-white"
            : "min-w-0"
        }
      >
        {children}
      </div>
    </div>
  );

  return expanded && mounted
    ? createPortal(content, document.body)
    : content;
}
