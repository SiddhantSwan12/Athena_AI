import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;

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

export const speechApi = {
  realtimeToken: () =>
    api.post("/api/speech/realtime-token").then((r) => r.data),
};

export const chatApi = {
  send: (payload) => api.post("/api/chat", payload).then((r) => r.data),
  stream: async (payload, handlers = {}, attachment = null) => {
    const token = localStorage.getItem("athena_token");
    const isYoutube = attachment?.kind === "youtube";
    const formData = attachment && !isYoutube ? new FormData() : null;
    if (formData) {
      formData.append("query", payload.query || "");
      if (payload.vertical) formData.append("vertical", payload.vertical);
      if (payload.conversation_id) {
        formData.append("conversation_id", payload.conversation_id);
      }
      formData.append(attachment.kind, attachment.file);
    }

    const endpoint = attachment
      ? isYoutube
        ? "stream-youtube"
        : attachment.kind === "audio"
        ? "stream-audio"
        : "stream-image"
      : "stream";
    const res = await fetch(
      `${BASE}/api/chat/${endpoint}`,
      {
      method: "POST",
      headers: {
        ...(!attachment || isYoutube
          ? { "Content-Type": "application/json" }
          : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body:
        formData ||
        JSON.stringify(
          isYoutube
            ? { ...payload, youtube_url: attachment.url }
            : payload
        ),
      }
    );

    if (res.status === 401) {
      localStorage.removeItem("athena_token");
      localStorage.removeItem("athena_user");
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    if (!res.ok || !res.body) {
      let detail = "Request failed";
      try {
        const data = await res.json();
        detail = data?.detail || detail;
      } catch {
        detail = res.statusText || detail;
      }
      throw new Error(detail);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalData = null;

    const dispatch = (block) => {
      const lines = block.split("\n");
      const eventLine = lines.find((line) => line.startsWith("event:"));
      const dataLines = lines.filter((line) => line.startsWith("data:"));
      if (!eventLine || !dataLines.length) return;

      const event = eventLine.slice("event:".length).trim();
      const rawData = dataLines.map((line) => line.slice("data:".length).trim()).join("\n");
      const data = JSON.parse(rawData);

      if (event === "progress") handlers.onProgress?.(data);
      if (event === "meta") handlers.onMeta?.(data);
      if (event === "token") handlers.onToken?.(data);
      if (event === "done") {
        finalData = data;
        handlers.onDone?.(data);
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";
      parts.forEach(dispatch);
      if (done) break;
    }

    if (buffer.trim()) dispatch(buffer);
    if (!finalData) {
      throw new Error("The response stream ended before Athena finished");
    }
    return finalData;
  },
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
  listInvestigations: () =>
    api.get("/api/conversations/investigations").then((r) => r.data),
  getInvestigation: (id) =>
    api.get(`/api/conversations/investigations/${id}`).then((r) => r.data),
};

export default api;
