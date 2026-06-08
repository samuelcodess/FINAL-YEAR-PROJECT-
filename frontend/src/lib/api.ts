import axios from "axios";

const productionApiBaseUrlByHost: Record<string, string> = {
  "performai-hub-frontend.vercel.app": "https://fadfe5bc1f3b51.lhr.life/api"
};

function resolveApiBaseUrl() {
  if (typeof window !== "undefined") {
    const productionApiBaseUrl = productionApiBaseUrlByHost[window.location.hostname];

    if (productionApiBaseUrl) {
      return productionApiBaseUrl;
    }
  }

  return import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:4000/api";
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl()
});

let unauthorizedHandler: (() => void) | null = null;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      unauthorizedHandler?.();
    }

    return Promise.reject(error);
  }
);

export function setApiToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}

export function registerUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}
