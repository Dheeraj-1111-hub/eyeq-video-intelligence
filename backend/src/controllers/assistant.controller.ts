import { Request, Response } from "express";
import axios from "axios";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8001";

export const askAssistant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body;
    
    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    // 1. Send the natural language query to the AI Service semantic search
    const searchResponse = await axios.post(`${AI_SERVICE_URL}/search`, {
      query: message,
      mode: "semantic",
      top_k: 1, // Only get the best match for the assistant
      semantic_threshold: 0.85 // Extremely high confidence to prevent hallucinations (like red car for white)
    });

    const results = searchResponse.data;

    if (!results || results.length === 0) {
      res.json({
        reply: "I couldn't find anything matching your description in the current evidence database. Try rephrasing your search or uploading more footage.",
        match: null
      });
      return;
    }

    // 2. Format the response conversationally
    const bestMatch = results[0];
    const timestampFormatted = bestMatch.timestamp; // e.g. "01:23"
    const videoName = bestMatch.video_filename || "the footage";
    const confidence = Math.round(bestMatch.score * 100);

    const replyText = `I found a potential match for "${message}" in **${videoName}** at exactly **${timestampFormatted}**. (Confidence: ${confidence}%)`;

    res.json({
      reply: replyText,
      match: bestMatch
    });
  } catch (error: any) {
    console.error("Assistant Error:", error.message);
    res.status(500).json({ error: "Failed to process query through EYEQ Copilot." });
  }
};
