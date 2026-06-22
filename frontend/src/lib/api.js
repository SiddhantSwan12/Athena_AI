import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;
if (!BASE) {
  // eslint-disable-next-line no-console
  console.error("REACT_APP_BACKEND_URL is not set");
}

const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("athena_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      const path = window.location.pathname;
      if (!path.startsWith("/login") && !path.startsWith("/signup") && path !== "/") {
        localStorage.removeItem("athena_token");
        localStorage.removeItem("athena_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  signup: (data) => api.post("/api/auth/signup", data).then((r) => r.data),
  login: (data) => api.post("/api/auth/login", data).then((r) => r.data),
  me: () => api.get("/api/auth/me").then((r) => r.data),
};

export const chatApi = {
  send: (payload) => api.post("/api/chat", payload).then((r) => r.data),
};

export const ingestApi = {
  uploadFile: (file, vertical, title) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("vertical", vertical);
    fd.append("title", title);
    return api
      .post("/api/ingest/file", fd, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data);
  },
  uploadText: (payload) => api.post("/api/ingest/text", payload).then((r) => r.data),
  listDocuments: () => api.get("/api/ingest/documents").then((r) => r.data),
  deleteDocument: (id) => api.delete(`/api/ingest/documents/${id}`).then((r) => r.data),
};

export const convosApi = {
  list: () => api.get("/api/conversations").then((r) => r.data),
  get: (id) => api.get(`/api/conversations/${id}`).then((r) => r.data),
  remove: (id) => api.delete(`/api/conversations/${id}`).then((r) => r.data),
};

export default api;
