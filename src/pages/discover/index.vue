<template>
  <view class="discover-page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <input
        v-model="keyword"
        placeholder="搜索B站UP主名称或UID"
        class="search-input"
        confirm-type="search"
        @confirm="handleSearch"
      />
      <button class="search-btn" @tap="handleSearch">搜索</button>
    </view>

    <!-- 搜索结果 -->
    <scroll-view scroll-y class="result-list">
      <!-- 加载中 -->
      <view v-if="searching" class="loading-state">
        <text>搜索中...</text>
      </view>

      <!-- 结果列表 -->
      <view v-else-if="creators.length > 0">
        <view
          v-for="creator in creators"
          :key="creator.creatorId"
          class="creator-card"
        >
          <image :src="creator.creatorAvatar" class="creator-avatar" mode="aspectFill" />
          <view class="creator-info">
            <text class="creator-name">{{ creator.creatorName }}</text>
            <text class="creator-desc text-ellipsis">{{ creator.creatorDesc || '暂无简介' }}</text>
            <view v-if="creator.stats" class="creator-stats">
              <text class="stat-item">{{ formatFansCount(creator.stats.fans) }} 粉丝</text>
              <text class="stat-item">{{ creator.stats.videos }} 视频</text>
            </view>
          </view>
          <button
            class="subscribe-btn"
            :class="{ subscribed: isSubscribed(creator.creatorId) }"
            @tap="handleSubscribe(creator)"
          >
            {{ isSubscribed(creator.creatorId) ? '已关注' : '关注' }}
          </button>
        </view>
      </view>

      <!-- 初始提示 -->
      <view v-else-if="!searched" class="empty-state">
        <text class="empty-icon">🔍</text>
        <text class="empty-text">搜索你喜欢的博主</text>
        <text class="empty-hint">输入B站UP主名称或UID开始</text>
      </view>

      <!-- 无结果 -->
      <view v-else class="empty-state">
        <text class="empty-icon">😔</text>
        <text class="empty-text">未找到相关博主</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { searchCreators } from "../../api/creator";
import { useSubscriptionStore } from "../../stores/subscription";
import { formatFansCount } from "../../utils/platform";
import type { Creator } from "../../types";

const subscriptionStore = useSubscriptionStore();

const keyword = ref("");
const creators = ref<Creator[]>([]);
const searching = ref(false);
const searched = ref(false);

onShow(() => {
  subscriptionStore.fetchList();
});

async function handleSearch() {
  if (!keyword.value.trim()) return;

  searching.value = true;
  searched.value = false;
  try {
    const res = await searchCreators(keyword.value.trim());
    creators.value = res.list;
  } catch (err: any) {
    uni.showToast({ title: err.message || "搜索失败", icon: "none" });
  } finally {
    searching.value = false;
    searched.value = true;
  }
}

function isSubscribed(creatorId: string): boolean {
  return subscriptionStore.list.some(
    (s) => s.platform === "bilibili" && s.creatorId === creatorId
  );
}

async function handleSubscribe(creator: Creator) {
  if (isSubscribed(creator.creatorId)) {
    uni.showToast({ title: "已关注该博主", icon: "none" });
    return;
  }

  try {
    await subscriptionStore.add({
      platform: creator.platform,
      creatorId: creator.creatorId,
      creatorName: creator.creatorName,
      creatorAvatar: creator.creatorAvatar,
      creatorDesc: creator.creatorDesc,
      rsshubRoute: creator.rsshubRoute,
    });
    uni.showToast({ title: "关注成功", icon: "success" });
  } catch (err: any) {
    uni.showToast({ title: err.message || "关注失败", icon: "none" });
  }
}
</script>

<style scoped>
.discover-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.search-bar {
  display: flex;
  padding: 16rpx 24rpx;
  background-color: #fff;
  gap: 16rpx;
}

.search-input {
  flex: 1;
  height: 72rpx;
  padding: 0 24rpx;
  background-color: #f5f5f5;
  border-radius: 36rpx;
  font-size: 28rpx;
}

.search-btn {
  height: 72rpx;
  line-height: 72rpx;
  padding: 0 32rpx;
  background-color: #333;
  color: #fff;
  font-size: 28rpx;
  border-radius: 36rpx;
  border: none;
}

.result-list {
  flex: 1;
  padding: 16rpx 24rpx;
}

.creator-card {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  gap: 20rpx;
}

.creator-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 48rpx;
  flex-shrink: 0;
}

.creator-info {
  flex: 1;
  min-width: 0;
}

.creator-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  display: block;
}

.creator-desc {
  font-size: 24rpx;
  color: #999;
  margin-top: 6rpx;
  display: block;
}

.creator-stats {
  display: flex;
  gap: 24rpx;
  margin-top: 8rpx;
}

.stat-item {
  font-size: 22rpx;
  color: #bbb;
}

.subscribe-btn {
  padding: 12rpx 32rpx;
  background-color: #333;
  color: #fff;
  font-size: 26rpx;
  border-radius: 32rpx;
  border: none;
  flex-shrink: 0;
}

.subscribe-btn.subscribed {
  background-color: #f0f0f0;
  color: #999;
}

.loading-state,
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
}
</style>
