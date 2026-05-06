import { get } from "../utils/request";
import type { Creator } from "../types";

export function searchCreators(keyword: string): Promise<{ list: Creator[] }> {
  return get("/creators/search", { keyword });
}

export function getCreatorInfo(platform: string, id: string): Promise<Creator> {
  return get(`/creators/${platform}/${id}`);
}
