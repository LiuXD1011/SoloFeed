import { ofetch } from "ofetch";
import { parseXML } from "../services/rsshub.js";
import { config } from "../config.js";

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  author: string;
  enclosure?: { url?: string };
  "media:content"?: { $: { url?: string } };
  "media:thumbnail"?: { $: { url?: string } };
}

interface RSSChannel {
  title: string;
  description?: string;
  link?: string;
  item?: RSSItem[];
}

/**
 * 从 RSSHub 获取 Feed 并解析为结构化数据
 */
export async function fetchFeed(rsshubRoute: string) {
  const url = `${config.rsshubUrl}${rsshubRoute}`;

  const xml = await ofetch<string>(url, {
    headers: { Accept: "application/xml" },
    timeout: 15000,
  });

  return parseFeedXML(xml);
}

/**
 * 解析 RSS XML 为结构化数据
 */
export function parseFeedXML(xml: string) {
  const result = parseXML(xml);
  const channel: RSSChannel = result?.rss?.channel ?? result?.feed ?? {};

  const items = (channel.item ?? []).map((item: RSSItem) => {
    // 尝试多个字段获取封面图
    const coverImage =
      item["media:thumbnail"]?.$?.url ||
      item["media:content"]?.$?.url ||
      item.enclosure?.url ||
      extractFirstImage(item.description) ||
      "";

    return {
      title: item.title || "",
      link: item.link || "",
      description: item.description || "",
      author: item.author || channel.title || "",
      coverImage,
      pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
    };
  });

  return {
    title: channel.title || "",
    description: channel.description || "",
    link: channel.link || "",
    items,
  };
}

function extractFirstImage(html: string): string {
  const match = html?.match(/<img[^>]+src=["']([^"']+)["']/);
  return match?.[1] || "";
}
