from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from .models import Entry, Subscription, UserEntry
from .services.bilibili import search_creators
from .services.rsshub import fetch_feed


@login_required
def home(request):
    platform = request.GET.get("platform", "")
    cursor = request.GET.get("cursor")

    entries_qs = Entry.objects.filter(
        subscription__user=request.user
    ).select_related("subscription").prefetch_related(
        Prefetch("user_entries", queryset=UserEntry.objects.filter(user=request.user))
    ).order_by("-pub_date")

    if platform:
        entries_qs = entries_qs.filter(platform=platform)
    if cursor:
        entries_qs = entries_qs.filter(pub_date__lt=cursor)

    page_size = 20
    entries = list(entries_qs[: page_size + 1])
    has_more = len(entries) > page_size
    entries = entries[:page_size]

    for entry in entries:
        ue = entry.user_entries.first()
        entry.is_read = ue.is_read if ue else False
        entry.is_starred = ue.is_starred if ue else False

    next_cursor = ""
    if has_more and entries:
        next_cursor = entries[-1].pub_date.isoformat()

    subscriptions = Subscription.objects.filter(user=request.user)
    sub_count = subscriptions.count()

    return render(request, "feeds/home.html", {
        "entries": entries,
        "has_more": has_more,
        "next_cursor": next_cursor,
        "current_platform": platform,
        "subscriptions": subscriptions,
        "sub_count": sub_count,
    })


@login_required
def load_more_entries(request):
    platform = request.GET.get("platform", "")
    cursor = request.GET.get("cursor")

    entries_qs = Entry.objects.filter(
        subscription__user=request.user
    ).select_related("subscription").prefetch_related(
        Prefetch("user_entries", queryset=UserEntry.objects.filter(user=request.user))
    ).order_by("-pub_date")

    if platform:
        entries_qs = entries_qs.filter(platform=platform)
    if cursor:
        entries_qs = entries_qs.filter(pub_date__lt=cursor)

    page_size = 20
    entries = list(entries_qs[: page_size + 1])
    has_more = len(entries) > page_size
    entries = entries[:page_size]

    for entry in entries:
        ue = entry.user_entries.first()
        entry.is_read = ue.is_read if ue else False
        entry.is_starred = ue.is_starred if ue else False

    next_cursor = ""
    if has_more and entries:
        next_cursor = entries[-1].pub_date.isoformat()

    return render(request, "feeds/partials/entry_cards.html", {
        "entries": entries,
        "has_more": has_more,
        "next_cursor": next_cursor,
    })


@login_required
@require_POST
def refresh_feed(request, sub_id):
    sub = get_object_or_404(Subscription, pk=sub_id, user=request.user)
    try:
        feed_data = fetch_feed(sub.rsshub_route)
        new_count = 0
        for item in feed_data["entries"]:
            _, created = Entry.objects.get_or_create(
                subscription=sub,
                link=item["link"],
                defaults={
                    "platform": sub.platform,
                    "title": item["title"],
                    "description": item["description"],
                    "cover_image": item["cover_image"],
                    "author": item["author"],
                    "pub_date": item["pub_date"],
                },
            )
            if created:
                new_count += 1
        messages.success(request, f"获取 {len(feed_data['entries'])} 条，新增 {new_count} 条")
    except Exception as e:
        messages.error(request, f"刷新失败: {e}")
    return redirect("/")


@login_required
def discover(request):
    keyword = request.GET.get("keyword", "")
    creators = []
    if keyword:
        try:
            creators = search_creators(keyword)
        except Exception:
            messages.error(request, "搜索失败，请稍后重试")

    user_sub_ids = set(
        Subscription.objects.filter(
            user=request.user, platform="bilibili"
        ).values_list("creator_id", flat=True)
    )

    return render(request, "feeds/discover.html", {
        "keyword": keyword,
        "creators": creators,
        "user_sub_ids": user_sub_ids,
    })


@login_required
@require_POST
def subscription_add(request):
    platform = request.POST.get("platform", "")
    creator_id = request.POST.get("creator_id", "")
    creator_name = request.POST.get("creator_name", "")
    creator_avatar = request.POST.get("creator_avatar", "")
    creator_desc = request.POST.get("creator_desc", "")
    rsshub_route = request.POST.get("rsshub_route", "")
    group = request.POST.get("group", "default")

    sub, created = Subscription.objects.get_or_create(
        user=request.user,
        platform=platform,
        creator_id=creator_id,
        defaults={
            "creator_name": creator_name,
            "creator_avatar": creator_avatar,
            "creator_desc": creator_desc,
            "rsshub_route": rsshub_route,
            "group": group,
        },
    )

    if not created:
        messages.info(request, "已订阅该博主")
    else:
        messages.success(request, f"已订阅 {creator_name}")
        try:
            feed_data = fetch_feed(rsshub_route)
            for item in feed_data["entries"]:
                Entry.objects.get_or_create(
                    subscription=sub,
                    link=item["link"],
                    defaults={
                        "platform": sub.platform,
                        "title": item["title"],
                        "description": item["description"],
                        "cover_image": item["cover_image"],
                        "author": item["author"],
                        "pub_date": item["pub_date"],
                    },
                )
        except Exception:
            pass

    return redirect("/discover/")


@login_required
def subscriptions(request):
    subs = Subscription.objects.filter(user=request.user).order_by("-created_at")
    return render(request, "feeds/subscriptions.html", {
        "subscriptions": subs,
    })


@login_required
@require_POST
def subscription_delete(request, pk):
    sub = get_object_or_404(Subscription, pk=pk, user=request.user)
    name = sub.creator_name
    sub.delete()
    messages.success(request, f"已取消关注 {name}")
    return redirect("/subscriptions/")


@login_required
def profile(request):
    sub_count = Subscription.objects.filter(user=request.user).count()
    starred_count = UserEntry.objects.filter(user=request.user, is_starred=True).count()
    read_count = UserEntry.objects.filter(user=request.user, is_read=True).count()
    return render(request, "feeds/profile.html", {
        "sub_count": sub_count,
        "starred_count": starred_count,
        "read_count": read_count,
    })
