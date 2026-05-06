export type Platform = "bilibili" | "xiaohongshu" | "douyin";

export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar: string;
}

export interface Subscription {
  id: string;
  platform: Platform;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  creatorDesc: string;
  rsshubRoute: string;
  group: string;
  createdAt: string;
}

export interface Entry {
  id: string;
  subscriptionId: string;
  platform: Platform;
  title: string;
  description: string;
  link: string;
  coverImage: string;
  author: string;
  pubDate: string;
  fetchedAt: string;
  isRead: boolean;
  isStarred: boolean;
  subscription: {
    id: string;
    platform: Platform;
    creatorName: string;
    creatorAvatar: string;
  };
}

export interface Creator {
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  creatorDesc: string;
  platform: Platform;
  rsshubRoute: string;
  stats?: {
    fans: number;
    videos: number;
  };
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  hasMore: boolean;
  nextCursor: string | null;
}
