<script setup lang="ts">
import { onLaunch } from "@dcloudio/uni-app";
import { useUserStore } from "./stores/user";

onLaunch(() => {
  console.log("SoloFeed App Launch");
  // 检查登录状态
  const userStore = useUserStore();
  if (!userStore.isLoggedIn) {
    // 延迟跳转，等首页渲染完成
    setTimeout(() => {
      uni.reLaunch({ url: "/pages/login/index" });
    }, 100);
  }
});
</script>

<style>
page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial,
    sans-serif;
  font-size: 28rpx;
  color: #333;
}

.container {
  padding: 24rpx;
}

/* 通用工具类 */
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
