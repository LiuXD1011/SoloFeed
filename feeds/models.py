from django.conf import settings
from django.db import models


class Platform(models.TextChoices):
    BILIBILI = "bilibili", "B站"
    XIAOHONGSHU = "xiaohongshu", "小红书"
    DOUYIN = "douyin", "抖音"


class Subscription(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="subscriptions"
    )
    platform = models.CharField("平台", max_length=20, choices=Platform.choices)
    creator_id = models.CharField("创作者ID", max_length=100)
    creator_name = models.CharField("创作者名称", max_length=200)
    creator_avatar = models.URLField("创作者头像", max_length=500, blank=True, default="")
    creator_desc = models.TextField("创作者简介", blank=True, default="")
    rsshub_route = models.CharField("RSSHub 路由", max_length=500)
    group = models.CharField("分组", max_length=100, default="default")
    created_at = models.DateTimeField("创建时间", auto_now_add=True)

    class Meta:
        unique_together = [("user", "platform", "creator_id")]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.creator_name} ({self.get_platform_display()})"


class Entry(models.Model):
    subscription = models.ForeignKey(
        Subscription, on_delete=models.CASCADE, related_name="entries"
    )
    platform = models.CharField("平台", max_length=20, choices=Platform.choices)
    title = models.CharField("标题", max_length=500)
    description = models.TextField("描述", blank=True, default="")
    link = models.URLField("链接", max_length=1000, blank=True, default="")
    cover_image = models.URLField("封面图", max_length=1000, blank=True, default="")
    author = models.CharField("作者", max_length=200, blank=True, default="")
    pub_date = models.DateTimeField("发布时间", db_index=True)
    fetched_at = models.DateTimeField("抓取时间", auto_now_add=True)

    class Meta:
        unique_together = [("subscription", "link")]
        ordering = ["-pub_date"]

    def __str__(self):
        return self.title[:50]


class UserEntry(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="user_entries"
    )
    entry = models.ForeignKey(
        Entry, on_delete=models.CASCADE, related_name="user_entries"
    )
    is_read = models.BooleanField("已读", default=False)
    is_starred = models.BooleanField("收藏", default=False)
    read_at = models.DateTimeField("阅读时间", null=True, blank=True)

    class Meta:
        unique_together = [("user", "entry")]

    def __str__(self):
        return f"{self.user} - {self.entry}"
