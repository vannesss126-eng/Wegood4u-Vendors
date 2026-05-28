"use client";

import type { ReactNode } from "react";

import type { ChannelBreakdown as ChannelBreakdownRow, Platform } from "@/types/domain";
import { PlatformLogoTile } from "./platform-icon";
import { cn } from "@/lib/utils";

type ChannelBreakdownProps = {
  data: ChannelBreakdownRow[];
  insight?: ReactNode;
};

const PLATFORM_NAME: Record<Platform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
};

// Fill style per platform — matches the mockup palette.
const FILL_CLASS: Record<Platform, string> = {
  youtube: "bg-primary",
  tiktok: "bg-primary-deep",
  instagram: "bg-gradient-to-r from-primary to-primary-soft",
};

function formatLikes(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString("en-MY");
}

export function ChannelBreakdown({ data, insight }: ChannelBreakdownProps) {
  return (
    <div>
      <div className="flex flex-col gap-4">
        {data.map((row) => (
          <div key={row.platform}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2.5">
                <PlatformLogoTile platform={row.platform} />
                <span className="text-[13.5px] font-semibold text-foreground">
                  {PLATFORM_NAME[row.platform]}
                </span>
              </span>
              <span className="flex items-baseline gap-2 tabular-nums">
                <span className="text-xs font-medium text-text-dim">
                  {row.views.toLocaleString("en-MY")} views ·{" "}
                  {formatLikes(row.likes)} likes
                </span>
                <span className="text-sm font-bold text-foreground">
                  {row.percent}%
                </span>
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-bg-soft">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-500 ease-out",
                  FILL_CLASS[row.platform]
                )}
                style={{ width: `${row.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {insight ? (
        <div className="mt-3.5 border-t border-dashed border-border pt-3.5 text-[11.5px] font-medium leading-relaxed text-muted-foreground">
          {insight}
        </div>
      ) : null}
    </div>
  );
}
