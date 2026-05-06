<template>
  <view class="profile-page">
    <!-- 用户信息 -->
    <view class="user-card">
      <view class="avatar-circle">
        <text class="avatar-text">{{ avatarText }}</text>
      </view>
      <view class="user-info">
        <text class="user-name">{{ userStore.user?.nickname || '未登录' }}</text>
        <text class="user-phone">{{ maskedPhone }}</text>
      </view>
    </view>

    <!-- 统计 -->
    <view class="stats-bar">
      <view class="stat-item">
        <text class="stat-value">{{ subscriptionStore.list.length }}</text>
        <text class="stat-label">关注</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">0</text>
        <text class="stat-label">收藏</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">0</text>
        <text class="stat-label">已读</text>
      </view>
    </view>

    <!-- 设置列表 -->
    <view class="settings-list">
      <view class="settings-item" @tap="handleAbout">
        <text>关于 SoloFeed</text>
        <text class="arrow">›</text>
      </view>
      <view class="settings-item" @tap="handleClearCache">
        <text>清除缓存</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <!-- 退出登录 -->
    <button v-if="userStore.isLoggedIn" class="logout-btn" @tap="handleLogout">退出登录</button>
    <button v-else class="login-btn" @tap="goLogin">去登录</button>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useUserStore } from "../../stores/user";
import { useSubscriptionStore } from "../../stores/subscription";

const userStore = useUserStore();
const subscriptionStore = useSubscriptionStore();

const avatarText = computed(() => {
  const name = userStore.user?.nickname || "?";
  return name.charAt(0).toUpperCase();
});

const maskedPhone = computed(() => {
  const phone = userStore.user?.phone || "";
  if (phone.length === 11) {
    return phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
  }
  return phone;
});

onShow(() => {
  if (userStore.isLoggedIn) {
    subscriptionStore.fetchList();
  }
});

function handleAbout() {
  uni.showModal({
    title: "SoloFeed",
    content: "极简跨端追更应用 v0.1.0\n拒绝广告，拒绝算法推荐\n专注你关心的内容",
    showCancel: false,
  });
}

function handleClearCache() {
  uni.showModal({
    title: "清除缓存",
    content: "确定要清除缓存吗？不会影响登录状态和订阅数据。",
    success(res) {
      if (res.confirm) {
        uni.showToast({ title: "缓存已清除", icon: "success" });
      }
    },
  });
}

function handleLogout() {
  uni.showModal({
    title: "退出登录",
    content: "确定要退出登录吗？",
    success(res) {
      if (res.confirm) {
        userStore.logout();
        uni.reLaunch({ url: "/pages/login/index" });
      }
    },
  });
}

function goLogin() {
  uni.reLaunch({ url: "/pages/login/index" });
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.user-card {
  display: flex;
  align-items: center;
  padding: 40rpx 32rpx;
  background-color: #fff;
  gap: 24rpx;
}

.avatar-circle {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background-color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  color: #fff;
  font-size: 48rpx;
  font-weight: 600;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  display: block;
}

.user-phone {
  font-size: 26rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

.stats-bar {
  display: flex;
  padding: 32rpx;
  background-color: #fff;
  margin-top: 16rpx;
}

.stats-bar .stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.settings-list {
  margin-top: 16rpx;
  background-color: #fff;
}

.settings-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  font-size: 30rpx;
  color: #333;
}

.arrow {
  color: #ccc;
  font-size: 32rpx;
}

.logout-btn,
.login-btn {
  margin: 48rpx 32rpx;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  font-size: 32rpx;
  border-radius: 16rpx;
  border: none;
}

.logout-btn {
  background-color: #fff;
  color: #e74c3c;
}

.login-btn {
  background-color: #333;
  color: #fff;
}
</style>
