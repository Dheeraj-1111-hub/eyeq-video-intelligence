import api from "../lib/api";
import type { Video } from "../types/video";

export const videoApi = {
  async fetchVideos(): Promise<Video[]> {
    const { data } = await api.get<Video[]>("/videos");
    return data;
  },

  async fetchVideo(id: string): Promise<Video> {
    const { data } = await api.get<Video>(`/videos/${id}`);
    return data;
  },

  async uploadVideo(file: File, location?: string, onProgress?: (progress: number) => void): Promise<Video> {
    const formData = new FormData();
    formData.append("video_file", file);
    if (location) {
      formData.append("location", location);
    }

    const { data } = await api.post<Video>("/videos/upload", formData, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    return data;
  },
};
