import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { videoApi } from "../services/videoApi";
import type { Video } from "../types/video";

export const useVideos = () => {
  return useQuery<Video[]>({
    queryKey: ["videos"],
    queryFn: () => videoApi.fetchVideos(),
    refetchInterval: 5000,
  });
};

export const useVideo = (id: string | null) => {
  return useQuery<Video>({
    queryKey: ["videos", id],
    queryFn: () => (id ? videoApi.fetchVideo(id) : Promise.reject("No ID")),
    enabled: !!id,
  });
};

export const useUploadVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, location, onProgress }: { file: File; location?: string; onProgress?: (p: number) => void }) =>
      videoApi.uploadVideo(file, location, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
};
