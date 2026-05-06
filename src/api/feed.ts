import { get, post } from "../utils/request";
import type { Entry, PaginatedResponse } from "../types";

export function getEntries(params: {
  limit?: number;
  cursor?: string;
  platform?: string;
}): Promise<PaginatedResponse<Entry>> {
  return get("/entries", params as Record<string, string>);
}

export function refreshFeed(subscriptionId: string): Promise<{ fetched: number; new: number }> {
  return post(`/entries/refresh/${subscriptionId}`);
}
