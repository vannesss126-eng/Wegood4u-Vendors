"use client";

import { useMemo, useState } from "react";
import { Eye, Heart, Video as VideoIcon, Zap } from "lucide-react";
import { toast } from "sonner";

import { MOCK_CONTENT } from "@/lib/mock";
import type { Platform } from "@/types/domain";

import { PageHeader, PeriodPill } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { ChannelBreakdown } from "@/components/charts/channel-breakdown";
import { ContentTrendChart } from "@/components/charts/content-trend-chart";
import { VideoCard } from "@/components/dashboard/video-card";
import { cn } from "@/lib/utils";

type SortMode = "views" | "likes" | "recent";

const SORT_LABEL: Record<SortMode, string> = {
  views: "Most viewed",
  likes: "Most liked",
  recent: "Most recent",
};

const PLATFORM_NAME: Record<Platform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
};

export default function ContentPage() {
  const [sort, setSort] = useState<SortMode>("views");
  const c = MOCK_CONTENT;

  const sortedPosts = useMemo(() => {
    const copy = [...c.posts];
    if (sort === "likes") {
      copy.sort((a, b) => b.likes - a.likes);
    } else if (sort === "recent") {
      copy.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    } else {
      copy.sort((a, b) => b.views - a.views);
    }
    return copy;
  }, [c.posts, sort]);

  const topChannel = c.channelMix[0];
  const topChannelName = PLATFORM_NAME[topChannel.platform];

  const engagementPct =
    c.totalViews > 0
      ? Math.round((c.totalLikes / c.totalViews) * 1000) / 10
      : 0;

  // Best engagement platform (likes / views) — used in the channel insight.
  const bestEngagement = [...c.channelMix].sort((a, b) => {
    const aRate = a.views > 0 ? a.likes / a.views : 0;
    const bRate = b.views > 0 ? b.likes / b.views : 0;
    return bRate - aRate;
  })[0];
  const bestEngagementPct =
    bestEngagement && bestEngagement.views > 0
      ? Math.round((bestEngagement.likes / bestEngagement.views) * 1000) / 10
      : 0;

  return (
    <div>
      <PageHeader
        title="Content"
        subtitle="How videos Wegood4u produced for your store are performing across all channels."
        action={<PeriodPill>May 2026</PeriodPill>}
      />

      {/* 4 KPIs */}
      <div className="mb-[18px] grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total views"
          value={c.totalViews.toLocaleString("en-MY")}
          icon={Eye}
          iconTone="primary"
          deltas={[
            { value: `+${c.monthOverMonthDelta}% M-o-M`, direction: "up" },
          ]}
        />
        <KpiCard
          label="Total likes"
          value={c.totalLikes.toLocaleString("en-MY")}
          icon={Heart}
          iconTone="primary"
          deltas={[{ value: `${engagementPct}% engagement`, direction: "up" }]}
        />
        <KpiCard
          label="Active videos"
          value={c.activeVideos.toLocaleString("en-MY")}
          icon={VideoIcon}
          iconTone="primary"
          meta={`Across ${c.channelMix.length} channels · ${c.totalPosts} total posts`}
        />
        <KpiCard
          label="Top channel"
          value={topChannelName}
          icon={Zap}
          iconTone="primary"
          meta={`${(topChannel.views / 1000).toFixed(0)}K views · ${topChannel.percent}% of total reach`}
        />
      </div>

      {/* Channel reach + Trend */}
      <div className="mb-[22px] grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
        <ChartCard
          title="Channel reach"
          subtitle="Total views per platform · May 2026"
        >
          <ChannelBreakdown
            data={c.channelMix}
            insight={
              <>
                <b className="font-bold text-foreground">
                  {topChannelName} leads at {topChannel.percent}%
                </b>{" "}
                — long-form content earns sustained discovery.{" "}
                {bestEngagement
                  ? `${PLATFORM_NAME[bestEngagement.platform]} engagement (likes-to-views) is highest at ${bestEngagementPct}%.`
                  : null}
              </>
            }
          />
        </ChartCard>

        <ChartCard
          title="Cumulative views — last 30 days"
          subtitle="Daily total across all 3 channels · steady growth"
        >
          <ContentTrendChart data={c.cumulativeTrend} />
        </ChartCard>
      </div>

      {/* Video performance */}
      <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-base font-bold tracking-tight text-foreground">
            Video performance
          </div>
          <div className="mt-1 text-[12.5px] font-medium text-muted-foreground">
            {c.posts.length} videos Wegood4u produced for your store — sorted by{" "}
            {SORT_LABEL[sort].toLowerCase()}
          </div>
        </div>
        <SortToggle value={sort} onChange={setSort} />
      </div>

      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-2">
        {sortedPosts.map((post) => (
          <VideoCard
            key={post.id}
            post={post}
            onClick={() =>
              toast.info(
                `Opening "${post.title}" — Pass 2 wires the source link.`
              )
            }
          />
        ))}
      </div>
    </div>
  );
}

function SortToggle({
  value,
  onChange,
}: {
  value: SortMode;
  onChange: (next: SortMode) => void;
}) {
  const options: SortMode[] = ["views", "likes", "recent"];
  return (
    <div className="inline-flex gap-1 rounded-lg border border-border bg-bg-soft p-[3px]">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
            value === opt
              ? "bg-card text-primary-deep shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {SORT_LABEL[opt]}
        </button>
      ))}
    </div>
  );
}
