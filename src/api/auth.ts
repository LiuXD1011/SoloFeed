import { post } from "../utils/request";
import type { User } from "../types";

export function sendCode(phone: string) {
  return post("/auth/send-code", { phone });
}

export function login(phone: string, code: string): Promise<{ token: string; user: User }> {
  return post("/auth/login", { phone, code });
}

export function refreshToken(): Promise<{ token: string; user: User }> {
  return post("/auth/refresh");
}
