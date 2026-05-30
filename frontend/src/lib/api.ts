import axios from "axios";

const rawBaseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const baseURL = rawBaseURL.endsWith('/api') ? rawBaseURL : `${rawBaseURL.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("eyeq_jwt");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchVideos = async () => {
  const { data } = await api.get("/videos");
  return data;
};

export const fetchVideo = async (id: string) => {
  const { data } = await api.get(`/videos/${id}`);
  return data;
};

export const fetchPipelineStatus = async (id: string) => {
  const { data } = await api.get(`/videos/${id}/pipeline`);
  return data;
};

export const fetchDetections = async (id: string) => {
  const { data } = await api.get(`/videos/${id}/detections`);
  return data;
};

export const fetchSummary = async (id: string) => {
  const { data } = await api.get(`/videos/${id}/summary`);
  return data;
};

export const uploadVideo = async (file: File) => {
  const formData = new FormData();
  formData.append("video_file", file);
  
  const { data } = await api.post("/videos/upload", formData);
  return data;
};

export const exportEvidence = async (id: string) => {
  const response = await api.get(`/videos/${id}/export`, { responseType: 'blob' });
  return response.data;
};

export const generateReport = async (id: string) => {
  const response = await api.get(`/videos/${id}/report`, { responseType: 'blob' });
  return response.data;
};

// ==========================================
// Admin APIs
// ==========================================

export const fetchAdminMetrics = async () => {
  const { data } = await api.get("/admin/metrics");
  return data;
};

export const fetchAdminStorage = async () => {
  const { data } = await api.get("/admin/storage");
  return data;
};

// ==========================================
// Notification APIs
// ==========================================

export const fetchNotifications = async () => {
  const { data } = await api.get("/notifications");
  return data;
};

export const markNotificationAsRead = async (id: string) => {
  const { data } = await api.put(`/notifications/${id}/read`);
  return data;
};

export default api;
