import type { Platform } from "../types";

const platformLabels: Record<Platform, string> = {
  bilibili: "B站",
  xiaohongshu: "小红书",
  douyin: "抖音",
};

const platformColors: Record<Platform, string> = {
  bilibili: "#00A1D6",
  xiaohongshu: "#FE2C55",
  douyin: "#000000",
};

export function getPlatformLabel(platform: Platform): string {
  return platformLabels[platform] || platform;
}

export function getPlatformColor(platform: Platform): string {
  return platformColors[platform] || "#999999";
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatFansCount(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`;
  }
  return String(count);
}
