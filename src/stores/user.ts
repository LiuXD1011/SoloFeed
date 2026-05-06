import { defineStore } from "pinia";
import { ref } from "vue";
import type { User } from "../types";
import { getToken, setToken, removeToken, getUser, setUser, removeUser } from "../utils/storage";
import { login as loginApi, sendCode as sendCodeApi } from "../api/auth";

export const useUserStore = defineStore("user", () => {
  const token = ref(getToken());
  const user = ref<User | null>(getUser());
  const isLoggedIn = ref(!!token.value);

  async function sendCode(phone: string) {
    return sendCodeApi(phone);
  }

  async function login(phone: string, code: string) {
    const res = await loginApi(phone, code);
    token.value = res.token;
    user.value = res.user;
    isLoggedIn.value = true;
    setToken(res.token);
    setUser(res.user);
  }

  function logout() {
    token.value = "";
    user.value = null;
    isLoggedIn.value = false;
    removeToken();
    removeUser();
  }

  return { token, user, isLoggedIn, sendCode, login, logout };
});
