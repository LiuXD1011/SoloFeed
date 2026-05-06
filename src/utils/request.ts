import { getToken, removeToken } from "./storage";

const BASE_URL = "http://localhost:3000/api";

interface RequestOptions {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: any;
  header?: Record<string, string>;
}

export function request<T = any>(options: RequestOptions): Promise<T> {
  const token = getToken();

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || "GET",
      data: options.data,
      header: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.header,
      },
      success(res) {
        if (res.statusCode === 401) {
          removeToken();
          uni.reLaunch({ url: "/pages/login/index" });
          reject(new Error("未登录"));
          return;
        }
        if (res.statusCode >= 400) {
          const msg = (res.data as any)?.error || "请求失败";
          reject(new Error(msg));
          return;
        }
        resolve(res.data as T);
      },
      fail(err) {
        reject(new Error(err.errMsg || "网络错误"));
      },
    });
  });
}

export function get<T = any>(url: string, params?: Record<string, string>) {
  const query = params
    ? "?" +
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join("&")
    : "";
  return request<T>({ url: url + query });
}

export function post<T = any>(url: string, data?: any) {
  return request<T>({ url, method: "POST", data });
}

export function del<T = any>(url: string) {
  return request<T>({ url, method: "DELETE" });
}
