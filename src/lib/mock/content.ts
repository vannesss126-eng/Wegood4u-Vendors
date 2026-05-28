// Wegood4u-produced content tagged to Thai Geng Mookata.
// 4 videos across YouTube / TikTok / Instagram. YouTube leads at 45%.
// Channel mix percentages computed from per-channel view totals.

import type { ContentSnapshot } from "@/types/domain";

const POSTS: ContentSnapshot["posts"] = [
  {
    id: "post-yt-001",
    platform: "youtube",
    title: "Best Mookata at Kepong — Thai Geng full tour",
    url: "https://youtube.com/watch?v=mock-thaigeng-tour",
    thumbnailGradient: ["#3FB97E", "#206E56"],
    durationSec: 222, // 3:42
    publishedAt: "2026-04-12",
    channelsLive: 3,
    views: 88600,
    likes: 5400,
    perChannelViews: { youtube: 41200, tiktok: 31800, instagram: 15600 },
    isTopPerformer: true,
  },
  {
    id: "post-yt-002",
    platform: "youtube",
    title: "Inside Thai Geng — the owner's mookata story",
    url: "https://youtube.com/watch?v=mock-thaigeng-owner",
    thumbnailGradient: ["#2a8167", "#16513F"],
    durationSec: 138, // 2:18
    publishedAt: "2026-03-18",
    channelsLive: 2,
    views: 20100,
    likes: 1400,
    perChannelViews: { youtube: 13800, tiktok: 6300 },
  },
  {
    id: "post-tt-001",
    platform: "tiktok",
    title: "Tonkotsu broth dupe? Thai Geng's clear-broth secret",
    url: "https://tiktok.com/@wegood4u/video/mock-broth",
    thumbnailGradient: ["#5a9c8a", "#2a6651"],
    durationSec: 68, // 1:08
    publishedAt: "2026-02-22",
    channelsLive: 2,
    views: 7600,
    likes: 480,
    perChannelViews: { tiktok: 4200, instagram: 3400 },
  },
  {
    id: "post-tt-002",
    platform: "tiktok",
    title: "60-second mookata bite — spicy Thai pork belly",
    url: "https://tiktok.com/@wegood4u/video/mock-bite",
    thumbnailGradient: ["#62a892", "#387563"],
    durationSec: 32, // 0:32
    publishedAt: "2026-01-30", // pre-enrollment but still tagged later
    channelsLive: 1,
    views: 2380,
    likes: 175,
    perChannelViews: { tiktok: 2380 },
  },
];

const YOUTUBE_VIEWS = POSTS.reduce((a, p) => a + (p.perChannelViews.youtube ?? 0), 0);
const TIKTOK_VIEWS = POSTS.reduce((a, p) => a + (p.perChannelViews.tiktok ?? 0), 0);
const INSTAGRAM_VIEWS = POSTS.reduce((a, p) => a + (p.perChannelViews.instagram ?? 0), 0);
const YOUTUBE_LIKES = 3340;
const TIKTOK_LIKES = 2800;
const INSTAGRAM_LIKES = 1315;
const TOTAL_VIEWS = YOUTUBE_VIEWS + TIKTOK_VIEWS + INSTAGRAM_VIEWS;

export const MOCK_CONTENT: ContentSnapshot = {
  totalViews: TOTAL_VIEWS,
  totalLikes: YOUTUBE_LIKES + TIKTOK_LIKES + INSTAGRAM_LIKES,
  activeVideos: POSTS.length,
  totalPosts: POSTS.reduce((a, p) => a + p.channelsLive, 0),
  topChannel: "youtube",
  monthOverMonthDelta: 23,

  channelMix: [
    { platform: "youtube",   views: YOUTUBE_VIEWS,   likes: YOUTUBE_LIKES,   percent: Math.round((YOUTUBE_VIEWS   / TOTAL_VIEWS) * 100) },
    { platform: "tiktok",    views: TIKTOK_VIEWS,    likes: TIKTOK_LIKES,    percent: Math.round((TIKTOK_VIEWS    / TOTAL_VIEWS) * 100) },
    { platform: "instagram", views: INSTAGRAM_VIEWS, likes: INSTAGRAM_LIKES, percent: Math.round((INSTAGRAM_VIEWS / TOTAL_VIEWS) * 100) },
  ],

  posts: POSTS,

  // Cumulative view total per day across all channels (Apr 28 → May 27).
  // Grows from ~88k to 118,680 (= sum of all per-channel post views).
  cumulativeTrend: [
    { date: "2026-04-28", total:  88200 },
    { date: "2026-04-29", total:  89100 },
    { date: "2026-04-30", total:  90200 },
    { date: "2026-05-01", total:  91400 },
    { date: "2026-05-02", total:  92800 },
    { date: "2026-05-03", total:  93700 },
    { date: "2026-05-04", total:  94400 },
    { date: "2026-05-05", total:  95200 },
    { date: "2026-05-06", total:  96100 },
    { date: "2026-05-07", total:  97100 },
    { date: "2026-05-08", total:  98500 },
    { date: "2026-05-09", total: 100200 },
    { date: "2026-05-10", total: 101300 },
    { date: "2026-05-11", total: 102000 },
    { date: "2026-05-12", total: 102800 },
    { date: "2026-05-13", total: 103700 },
    { date: "2026-05-14", total: 104700 },
    { date: "2026-05-15", total: 106400 },
    { date: "2026-05-16", total: 108200 },
    { date: "2026-05-17", total: 109500 },
    { date: "2026-05-18", total: 110300 },
    { date: "2026-05-19", total: 111100 },
    { date: "2026-05-20", total: 112100 },
    { date: "2026-05-21", total: 113300 },
    { date: "2026-05-22", total: 115200 },
    { date: "2026-05-23", total: 116800 },
    { date: "2026-05-24", total: 117700 },
    { date: "2026-05-25", total: 118200 },
    { date: "2026-05-26", total: 118500 },
    { date: "2026-05-27", total: TOTAL_VIEWS },
  ],
};
