import axios from "axios";

const baseURL = typeof window !== "undefined"
  ? "/api"
  : (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api");

const api = axios.create({ baseURL, withCredentials: true });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const isAdmin = window.location.pathname === "/admin" || window.location.pathname === "/admin-login";
    const token = localStorage.getItem(isAdmin ? "adminToken" : "token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use((response) => response, async (error) => {
  if (error.response?.status === 401 && typeof window !== "undefined") {
    const isAdmin = window.location.pathname === "/admin" || window.location.pathname === "/admin-login";
    localStorage.removeItem(isAdmin ? "adminToken" : "token");
    window.location.href = isAdmin ? "/admin-login" : "/login";
  }
  return Promise.reject(error);
});

export default api;
