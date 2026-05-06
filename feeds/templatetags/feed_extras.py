from datetime import datetime, timedelta

from django import template
from django.utils import timezone

register = template.Library()

PLATFORM_LABELS = {
    "bilibili": "B站",
    "xiaohongshu": "小红书",
    "douyin": "抖音",
}

PLATFORM_COLORS = {
    "bilibili": "#00A1D6",
    "xiaohongshu": "#FE2C55",
    "douyin": "#000000",
}


@register.filter
def platform_label(platform):
    return PLATFORM_LABELS.get(platform, platform)


@register.filter
def platform_color(platform):
    return PLATFORM_COLORS.get(platform, "#999999")


@register.filter
def relative_time(value):
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value)
        except (ValueError, TypeError):
            return value

    now = timezone.now()
    if hasattr(value, "tzinfo") and value.tzinfo is None:
        value = timezone.make_aware(value)

    diff = now - value
    seconds = int(diff.total_seconds())

    if seconds < 60:
        return "刚刚"
    elif seconds < 3600:
        return f"{seconds // 60}分钟前"
    elif seconds < 86400:
        return f"{seconds // 3600}小时前"
    elif seconds < 2592000:
        return f"{seconds // 86400}天前"
    return value.strftime("%Y-%m-%d")


@register.filter
def fans_count(count):
    if count >= 10000:
        return f"{count / 10000:.1f}万"
    return str(count)


@register.filter
def masked_phone(phone):
    if len(phone) == 11:
        return phone[:3] + "****" + phone[7:]
    return phone
