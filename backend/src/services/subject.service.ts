import Subject, { ISubject } from "../models/Subject";
import { TrackMatch } from "./reid.service";

export const createSubjectProfile = async (
  matches: TrackMatch[],
  primaryEmbedding: number[]
): Promise<ISubject> => {
  if (!matches || matches.length === 0) {
    throw new Error("Cannot create subject without matches.");
  }

  // Find earliest and latest times
  let firstSeenStr = matches[0].timestamp;
  let lastSeenStr = matches[matches.length - 1].timestamp;

  // Use the highest confidence match as the primary thumbnail (or the first one)
  const bestMatch = matches.reduce((prev, current) => {
    return (prev.confidence > current.confidence) ? prev : current;
  });

  const newSubject = await Subject.create({
    primaryEmbedding,
    firstSeen: firstSeenStr,
    lastSeen: lastSeenStr,
    thumbnail: bestMatch.thumbnail,
    confidenceScore: bestMatch.confidence
  });

  return newSubject;
};
