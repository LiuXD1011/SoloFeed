const TOKEN_KEY = "solofeed_token";
const USER_KEY = "solofeed_user";

export function getToken(): string {
  return uni.getStorageSync(TOKEN_KEY) || "";
}

export function setToken(token: string): void {
  uni.setStorageSync(TOKEN_KEY, token);
}

export function removeToken(): void {
  uni.removeStorageSync(TOKEN_KEY);
}

export function getUser() {
  const raw = uni.getStorageSync(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user: any): void {
  uni.setStorageSync(USER_KEY, JSON.stringify(user));
}

export function removeUser(): void {
  uni.removeStorageSync(USER_KEY);
}

export function clearAll(): void {
  uni.clearStorageSync();
}
