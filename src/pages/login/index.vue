<template>
  <view class="login-page">
    <view class="login-header">
      <text class="app-name">SoloFeed</text>
      <text class="app-slogan">极简跨端追更，拒绝信息轰炸</text>
    </view>

    <view class="login-form">
      <view class="input-group">
        <input
          v-model="phone"
          type="number"
          maxlength="11"
          placeholder="请输入手机号"
          class="input"
        />
      </view>

      <view class="input-group code-group">
        <input
          v-model="code"
          type="number"
          maxlength="6"
          placeholder="验证码"
          class="input code-input"
        />
        <button
          class="code-btn"
          :disabled="countdown > 0 || !isPhoneValid"
          @tap="handleSendCode"
        >
          {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
        </button>
      </view>

      <button class="login-btn" :disabled="!canLogin" @tap="handleLogin">登录</button>

      <view class="login-tip">
        <text>登录即代表同意</text>
        <text class="link">用户协议</text>
        <text>和</text>
        <text class="link">隐私政策</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useUserStore } from "../../stores/user";

const userStore = useUserStore();

const phone = ref("");
const code = ref("");
const countdown = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

const isPhoneValid = computed(() => /^1[3-9]\d{9}$/.test(phone.value));
const canLogin = computed(() => isPhoneValid.value && code.value.length === 6);

async function handleSendCode() {
  if (!isPhoneValid.value || countdown.value > 0) return;

  try {
    await userStore.sendCode(phone.value);
    uni.showToast({ title: "验证码已发送", icon: "success" });

    countdown.value = 60;
    timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(timer!);
        timer = null;
      }
    }, 1000);
  } catch (err: any) {
    uni.showToast({ title: err.message || "发送失败", icon: "none" });
  }
}

async function handleLogin() {
  if (!canLogin.value) return;

  try {
    await userStore.login(phone.value, code.value);
    uni.reLaunch({ url: "/pages/index/index" });
  } catch (err: any) {
    uni.showToast({ title: err.message || "登录失败", icon: "none" });
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 60rpx;
  background-color: #fff;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 120rpx;
}

.app-name {
  font-size: 72rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 16rpx;
}

.app-slogan {
  font-size: 28rpx;
  color: #999;
}

.login-form {
  width: 100%;
}

.input-group {
  margin-bottom: 32rpx;
}

.input {
  width: 100%;
  height: 96rpx;
  padding: 0 32rpx;
  border: 2rpx solid #e5e5e5;
  border-radius: 16rpx;
  font-size: 32rpx;
  background-color: #f9f9f9;
}

.code-group {
  display: flex;
  gap: 16rpx;
}

.code-input {
  flex: 1;
}

.code-btn {
  width: 220rpx;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  background-color: #333;
  color: #fff;
  font-size: 28rpx;
  border-radius: 16rpx;
  border: none;
}

.code-btn[disabled] {
  background-color: #ccc;
  color: #fff;
}

.login-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  background-color: #333;
  color: #fff;
  font-size: 34rpx;
  font-weight: 600;
  border-radius: 16rpx;
  border: none;
  margin-top: 48rpx;
}

.login-btn[disabled] {
  background-color: #ccc;
}

.login-tip {
  text-align: center;
  margin-top: 40rpx;
  font-size: 24rpx;
  color: #999;
}

.link {
  color: #333;
}
</style>
