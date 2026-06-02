import api from "@/lib/api";

export interface AssistantResponse {
  reply: string;
  match: {
    video_id: string;
    detection_id: string;
    frame: number;
    timestamp: string;
    timestamp_seconds: number;
    label: string;
    confidence: number;
    thumbnail: string | null;
    score: number;
    video_filename: string | null;
  } | null;
}

export const askAssistant = async (message: string): Promise<AssistantResponse> => {
  const { data } = await api.post<AssistantResponse>("/assistant/ask", { message });
  return data;
};
