"use client";

import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ChevronRight, Play } from "lucide-react";

import type { ContentPost, Platform } from "@/types/domain";
import { PlatformIcon } from "@/components/charts/platform-icon";
import { MOCK_TODAY } from "@/lib/mock/visits";
import { cn } from "@/lib/utils";

type VideoCardProps = {
  post: ContentPost;
  onClick?: () => void;
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-MY");
}

const TODAY = parseISO(`${MOCK_TODAY}T00:00:00+08:00`);

export function VideoCard({ post, onClick }: VideoCardProps) {
  const published = parseISO(`${post.publishedAt}T00:00:00+08:00`);
  const daysLive = Math.max(0, differenceInCalendarDays(TODAY, published));
  const publishedLabel = format(published, "MMM d, yyyy");
  const duration = formatDuration(post.durationSec);

  // Per-channel chips: sort by views desc.
  const channels = (Object.entries(post.perChannelViews) as [Platform, number][])
    .filter(([, v]) => typeof v === "number" && v > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group grid w-full grid-cols-[180px_1fr] overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-border-hi hover:shadow-md",
        post.isTopPerformer
          ? "border-primary/30 shadow-[0_4px_14px_-4px_rgba(32,110,86,0.16)]"
          : "border-border"
      )}
    >
      {/* Thumbnail */}
      <div
        className="relative grid place-items-center overflow-hidden"
        style={{
          aspectRatio: "16 / 11",
          background: `linear-gradient(135deg, ${post.thumbnailGradient[0]}, ${post.thumbnailGradient[1]})`,
        }}
      >
        {/* Soft sheen */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.10), transparent 60%)",
          }}
        />

        {post.isTopPerformer ? (
          <span className="absolute left-2 top-2 z-[2] rounded-full bg-highlight px-2 py-1 text-[9.5px] font-bold uppercase tracking-[0.06em] text-white shadow-[0_4px_12px_-2px_rgba(240,89,42,0.40)]">
            Top performer
          </span>
        ) : null}

        <div className="z-[2] grid h-12 w-12 place-items-center rounded-full bg-white/90 transition-transform duration-150 group-hover:scale-110">
          <Play
            className="h-[18px] w-[18px] text-primary-deep"
            fill="currentColor"
            strokeWidth={0}
            style={{ marginLeft: 2 }}
          />
        </div>

        <span className="absolute bottom-2 right-2 z-[2] rounded bg-black/70 px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums text-white">
          {duration}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col px-[18px] py-4">
        <div className="text-sm font-bold leading-snug tracking-[-0.005em] text-foreground">
          {post.title}
        </div>
        <div className="mt-1 text-[11px] font-medium text-text-dim">
          Published{" "}
          <span className="font-semibold text-muted-foreground">{publishedLabel}</span>{" "}
          · {daysLive} days live · {post.channelsLive} channel
          {post.channelsLive === 1 ? "" : "s"}
        </div>

        {/* Per-channel chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {channels.map(([platform, views]) => (
            <span
              key={platform}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-soft px-2 py-1 text-[11px] tabular-nums text-foreground"
            >
              <PlatformIcon platform={platform} className="h-3 w-3 text-primary-deep" />
              <b className="font-bold">{formatCompact(views)}</b> views
            </span>
          ))}
        </div>

        {/* Totals row */}
        <div className="mt-auto flex items-center gap-3.5 border-t border-dashed border-border pt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold tracking-tight tabular-nums text-foreground">
              {post.views.toLocaleString("en-MY")}
            </span>
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.04em] text-text-dim">
              views
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold tracking-tight tabular-nums text-foreground">
              {formatCompact(post.likes)}
            </span>
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.04em] text-text-dim">
              likes
            </span>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 text-[11.5px] font-bold text-primary transition-[gap] duration-150 group-hover:gap-2">
            View
            <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </button>
  );
}
