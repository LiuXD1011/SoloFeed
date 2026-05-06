import re
from datetime import datetime
from email.utils import parsedate_to_datetime
from time import struct_time

import feedparser
import httpx
from django.conf import settings


def _parse_date(entry) -> datetime:
    """从 feedparser entry 中提取发布时间并转为 datetime。"""
    for attr in ("published_parsed", "updated_parsed"):
        val = getattr(entry, attr, None)
        if val and isinstance(val, struct_time):
            return datetime(*val[:6])

    for attr in ("published", "updated"):
        val = getattr(entry, attr, None)
        if val:
            try:
                return parsedate_to_datetime(val)
            except Exception:
                pass

    return datetime.now()


def _extract_cover_image(entry) -> str:
    """从 feed entry 中提取封面图。"""
    media_content = getattr(entry, "media_content", [])
    if media_content:
        for mc in media_content:
            url = mc.get("url", "")
            if url and ("image" in mc.get("type", "") or url.endswith((".jpg", ".png", ".jpeg", ".gif", ".webp"))):
                return url
        if media_content:
            return media_content[0].get("url", "")

    enclosures = getattr(entry, "enclosures", [])
    for enc in enclosures:
        if "image" in enc.get("type", ""):
            return enc.get("href", "")

    summary = entry.get("summary", "")
    match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', summary)
    if match:
        return match.group(1)

    return ""


def fetch_feed(rsshub_route: str) -> dict:
    """从 RSSHub 拉取并解析 RSS 订阅源。"""
    url = f"{settings.RSSHUB_URL}{rsshub_route}"
    response = httpx.get(url, timeout=15.0)
    response.raise_for_status()

    parsed = feedparser.parse(response.text)

    items = []
    for entry in parsed.entries:
        cover = _extract_cover_image(entry)
        items.append({
            "title": entry.get("title", ""),
            "link": entry.get("link", ""),
            "description": entry.get("summary", ""),
            "author": entry.get("author", parsed.feed.get("title", "")),
            "cover_image": cover,
            "pub_date": _parse_date(entry),
        })

    return {
        "title": parsed.feed.get("title", ""),
        "entries": items,
    }
