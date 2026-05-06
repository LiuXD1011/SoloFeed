import httpx
from django.conf import settings


def search_creators(keyword: str) -> list[dict]:
    """通过 B站 API 搜索 UP 主。"""
    response = httpx.get(
        "https://api.bilibili.com/x/web-interface/search/type",
        params={
            "search_type": "bili_user",
            "keyword": keyword,
            "page": 1,
            "page_size": 20,
        },
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Cookie": settings.BILIBILI_COOKIE,
        },
        timeout=10.0,
    )
    data = response.json()

    results = []
    for item in data.get("data", {}).get("result", []):
        avatar = item.get("upic", "")
        if avatar.startswith("//"):
            avatar = "https:" + avatar
        results.append({
            "creator_id": str(item["mid"]),
            "creator_name": item.get("uname", ""),
            "creator_avatar": avatar,
            "creator_desc": item.get("usign", ""),
            "platform": "bilibili",
            "stats": {
                "fans": item.get("fans", 0),
                "videos": item.get("videos", 0),
            },
            "rsshub_route": f'/bilibili/user/dynamic/{item["mid"]}',
        })
    return results


def get_creator_info(creator_id: str) -> dict:
    """获取 B站用户信息。"""
    response = httpx.get(
        f"https://api.bilibili.com/x/space/acc/info?mid={creator_id}",
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Cookie": settings.BILIBILI_COOKIE,
        },
        timeout=10.0,
    )
    data = response.json()
    info = data.get("data", {})

    avatar = info.get("face", "")
    return {
        "creator_id": str(info.get("mid", creator_id)),
        "creator_name": info.get("name", ""),
        "creator_avatar": avatar,
        "creator_desc": info.get("sign", ""),
        "platform": "bilibili",
        "rsshub_route": f"/bilibili/user/dynamic/{creator_id}",
    }
