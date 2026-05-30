import { ITimelineEvent } from "../models/TimelineEvent";

export const generateCaseSummary = (events: ITimelineEvent[]): string => {
  if (!events || events.length === 0) {
    return "No evidence collected yet to generate a summary.";
  }

  // Sort chronologically
  const sorted = [...events].sort((a, b) => a.timestampSeconds - b.timestampSeconds);

  let summaryLines: string[] = [];

  sorted.forEach((event, idx) => {
    // Very basic NLP deterministic templates for the portfolio
    if (idx === 0) {
      summaryLines.push(`Investigation initiated with a ${event.title.toLowerCase()} event at ${event.timestamp}.`);
    } else {
      // Add some variance to the sentences
      const templates = [
        `Subsequently, at ${event.timestamp}, a ${event.title.toLowerCase()} was recorded.`,
        `At ${event.timestamp}, an additional detection occurred for: ${event.title.toLowerCase()}.`,
        `The timeline shows ${event.title.toLowerCase()} occurring at ${event.timestamp}.`,
      ];
      summaryLines.push(templates[idx % templates.length]);
    }
  });

  const lastEvent = sorted[sorted.length - 1];
  if (sorted.length > 1) {
    summaryLines.push(`The most recent activity involves a ${lastEvent.title.toLowerCase()} observed at ${lastEvent.timestamp}.`);
  }

  return summaryLines.join(" ");
};
