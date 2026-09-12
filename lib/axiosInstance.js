import axios from "axios";

// Use the same origin in the browser. This is important in production because
// the admin UI and /api routes are served by the same Next.js application.
// It also avoids a www.noadua.com -> noadua.com cross-origin preflight.
const apiBaseURL =
  typeof window !== "undefined"
    ? "/api"
    : (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api");

const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
});

// -------------------- REQUEST INTERCEPTOR --------------------
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const isAdmin = window.location.pathname === "/admin" || window.location.pathname === "/admin-login";
      const token = localStorage.getItem(isAdmin ? "adminToken" : "token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// -------------------- RESPONSE INTERCEPTOR --------------------
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    // Unauthorized / Expired Token
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const isAdmin = window.location.pathname === "/admin" || window.location.pathname === "/admin-login";
        localStorage.removeItem(isAdmin ? "adminToken" : "token");
        window.location.href = isAdmin ? "/admin-login" : "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
