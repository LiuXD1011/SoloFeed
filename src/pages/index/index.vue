<template>
  <view class="home-page">
    <!-- 顶部平台切换 -->
    <view class="tab-bar">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: currentTab === tab.value }"
        @tap="switchTab(tab.value)"
      >
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <!-- 信息流 -->
    <scroll-view
      scroll-y
      class="entry-list"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
    >
      <!-- 空状态 -->
      <view v-if="!feedStore.loading && feedStore.entries.length === 0" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">还没有关注的内容</text>
        <text class="empty-hint">去「发现」页面搜索并关注博主吧</text>
        <button class="empty-btn" @tap="switchToDiscover">去发现</button>
      </view>

      <!-- 条目列表 -->
      <view
        v-for="entry in feedStore.entries"
        :key="entry.id"
        class="entry-card"
        @tap="openEntry(entry)"
      >
        <!-- 封面图 -->
        <image
          v-if="entry.coverImage"
          :src="entry.coverImage"
          class="entry-cover"
          mode="aspectFill"
        />

        <view class="entry-info">
          <text class="entry-title text-ellipsis">{{ entry.title }}</text>
          <view class="entry-meta flex-between">
            <view class="entry-author">
              <view class="platform-badge" :style="{ backgroundColor: getPlatformColor(entry.platform) }">
                <text class="platform-text">{{ getPlatformLabel(entry.platform) }}</text>
              </view>
              <text class="author-name">{{ entry.subscription.creatorName }}</text>
            </view>
            <text class="entry-time">{{ formatRelativeTime(entry.pubDate) }}</text>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view v-if="feedStore.loading" class="loading-more">
        <text>加载中...</text>
      </view>
      <view v-else-if="!feedStore.hasMore && feedStore.entries.length > 0" class="loading-more">
        <text>没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useFeedStore } from "../../stores/feed";
import { useUserStore } from "../../stores/user";
import { getPlatformLabel, getPlatformColor, formatRelativeTime } from "../../utils/platform";
import type { Entry } from "../../types";

const feedStore = useFeedStore();
const userStore = useUserStore();
const refreshing = ref(false);

const tabs = [
  { label: "全部", value: "" },
  { label: "B站", value: "bilibili" },
];

const currentTab = ref("");

onShow(() => {
  if (userStore.isLoggedIn) {
    feedStore.refresh();
  }
});

function switchTab(value: string) {
  currentTab.value = value;
  feedStore.setPlatform(value);
}

async function onRefresh() {
  refreshing.value = true;
  try {
    await feedStore.refresh();
  } finally {
    refreshing.value = false;
  }
}

function onLoadMore() {
  feedStore.fetchEntries();
}

function openEntry(entry: Entry) {
  // #ifdef H5
  window.open(entry.link, "_blank");
  // #endif
  // #ifndef H5
  uni.setClipboardData({
    data: entry.link,
    success() {
      uni.showToast({ title: "链接已复制", icon: "success" });
    },
  });
  // #endif
}

function switchToDiscover() {
  uni.switchTab({ url: "/pages/discover/index" });
}
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.tab-bar {
  display: flex;
  padding: 0 24rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

.tab-item {
  padding: 24rpx 32rpx;
  font-size: 30rpx;
  color: #999;
  position: relative;
}

.tab-item.active {
  color: #333;
  font-weight: 600;
}

.tab-item.active::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 6rpx;
  background-color: #333;
  border-radius: 3rpx;
}

.entry-list {
  flex: 1;
  padding: 16rpx 24rpx;
}

.entry-card {
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  overflow: hidden;
}

.entry-cover {
  width: 100%;
  height: 360rpx;
}

.entry-info {
  padding: 20rpx 24rpx;
}

.entry-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
}

.entry-meta {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #999;
}

.entry-author {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.platform-badge {
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.platform-text {
  color: #fff;
  font-size: 20rpx;
}

.author-name {
  color: #666;
}

.entry-time {
  color: #bbb;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: #ccc;
  margin-bottom: 40rpx;
}

.empty-btn {
  background-color: #333;
  color: #fff;
  font-size: 28rpx;
  padding: 16rpx 48rpx;
  border-radius: 40rpx;
  border: none;
}

.loading-more {
  text-align: center;
  padding: 24rpx;
  color: #ccc;
  font-size: 24rpx;
}
</style>
