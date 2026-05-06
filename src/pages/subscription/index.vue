<template>
  <view class="subscription-page">
    <view v-if="subscriptionStore.list.length === 0 && !subscriptionStore.loading" class="empty-state">
      <text class="empty-icon">📋</text>
      <text class="empty-text">还没有订阅</text>
      <text class="empty-hint">去「发现」页面搜索并关注博主</text>
      <button class="empty-btn" @tap="goDiscover">去发现</button>
    </view>

    <scroll-view v-else scroll-y class="sub-list">
      <view class="section-title">
        <text>B站关注 ({{ bilibiliSubs.length }})</text>
      </view>

      <view
        v-for="sub in bilibiliSubs"
        :key="sub.id"
        class="sub-card"
        @longpress="confirmDelete(sub)"
      >
        <image :src="sub.creatorAvatar" class="sub-avatar" mode="aspectFill" />
        <view class="sub-info">
          <text class="sub-name">{{ sub.creatorName }}</text>
          <text class="sub-desc text-ellipsis">{{ sub.creatorDesc || '暂无简介' }}</text>
        </view>
        <view class="platform-tag">
          <text>B站</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useSubscriptionStore } from "../../stores/subscription";
import type { Subscription } from "../../types";

const subscriptionStore = useSubscriptionStore();

const bilibiliSubs = computed(() => subscriptionStore.getByPlatform("bilibili"));

onShow(() => {
  subscriptionStore.fetchList();
});

function confirmDelete(sub: Subscription) {
  uni.showModal({
    title: "取消关注",
    content: `确定取消关注「${sub.creatorName}」吗？`,
    async success(res) {
      if (res.confirm) {
        try {
          await subscriptionStore.remove(sub.id);
          uni.showToast({ title: "已取消关注", icon: "success" });
        } catch (err: any) {
          uni.showToast({ title: err.message || "操作失败", icon: "none" });
        }
      }
    },
  });
}

function goDiscover() {
  uni.switchTab({ url: "/pages/discover/index" });
}
</script>

<style scoped>
.subscription-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.sub-list {
  height: 100vh;
  padding: 16rpx 24rpx;
}

.section-title {
  padding: 16rpx 0;
  font-size: 28rpx;
  color: #999;
  font-weight: 500;
}

.sub-card {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 12rpx;
  gap: 20rpx;
}

.sub-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  flex-shrink: 0;
}

.sub-info {
  flex: 1;
  min-width: 0;
}

.sub-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  display: block;
}

.sub-desc {
  font-size: 24rpx;
  color: #999;
  margin-top: 6rpx;
  display: block;
}

.platform-tag {
  padding: 6rpx 16rpx;
  background-color: #00A1D6;
  border-radius: 8rpx;
  flex-shrink: 0;
}

.platform-tag text {
  color: #fff;
  font-size: 22rpx;
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
</style>
