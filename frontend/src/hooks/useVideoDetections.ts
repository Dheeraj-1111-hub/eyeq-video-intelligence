import { useQuery } from "@tanstack/react-query";
import { fetchDetections } from "@/lib/api";
import type { Detection } from "@/types/video";
import { useMemo } from "react";

export interface DetectionStats {
  topDetection: { label: string; count: number } | null;
  avgConfidence: number;
  totalDetections: number;
}

export function useVideoDetections(videoId: string | null, isIndexed: boolean) {
  const query = useQuery<Detection[]>({
    queryKey: ["detections", videoId],
    queryFn: () => fetchDetections(videoId!),
    enabled: !!videoId && isIndexed,
  });

  const detections = query.data || [];

  // O(1) Lookup Map for Canvas Rendering
  const detectionsBySecond = useMemo(() => {
    const map = new Map<number, Detection[]>();
    for (const d of detections) {
      const second = Math.floor(d.timestamp_seconds);
      if (!map.has(second)) {
        map.set(second, []);
      }
      map.get(second)!.push(d);
    }
    return map;
  }, [detections]);

  // Advanced Stats Calculation
  const stats = useMemo<DetectionStats>(() => {
    if (detections.length === 0) {
      return { topDetection: null, avgConfidence: 0, totalDetections: 0 };
    }

    const labelCounts = new Map<string, number>();
    let totalConf = 0;

    for (const d of detections) {
      const count = labelCounts.get(d.label) || 0;
      labelCounts.set(d.label, count + 1);
      totalConf += d.confidence;
    }

    let topLabel = "";
    let maxCount = 0;
    for (const [label, count] of labelCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        topLabel = label;
      }
    }

    return {
      topDetection: topLabel ? { label: topLabel, count: maxCount } : null,
      avgConfidence: totalConf / detections.length,
      totalDetections: detections.length,
    };
  }, [detections]);

  return {
    ...query,
    detections,
    detectionsBySecond,
    stats,
  };
}
