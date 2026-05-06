import { get, post, del } from "../utils/request";
import type { Subscription, Platform } from "../types";

export function getSubscriptions(): Promise<{ list: Subscription[] }> {
  return get("/subscriptions");
}

export function addSubscription(data: {
  platform: Platform;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  creatorDesc?: string;
  rsshubRoute: string;
  group?: string;
}): Promise<Subscription> {
  return post("/subscriptions", data);
}

export function deleteSubscription(id: string): Promise<{ success: boolean }> {
  return del(`/subscriptions/${id}`);
}
