import { Request, Response } from "express";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { searchEvidence, trackSubject, createCase, addEvidence, getPlatformStats } from "../services/agent/tools";
import { AuthRequest } from "../middleware/auth.middleware";

export const chatWithInvestigator = async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    const userId = (req as AuthRequest).user?.userId;

    if (!messages) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not configured on the server." });
    }

    const result = streamText({
      model: openai("gpt-4o"),
      messages,
      system: `You are the EYEQ Autonomous Investigator, a highly capable forensic AI agent. 
      Your job is to assist security personnel in analyzing CCTV footage, finding suspects, tracking subjects across multiple cameras, and building investigation cases automatically.
      
      You have access to a suite of powerful tools:
      - searchEvidence: to find objects or people based on natural language queries or semantic descriptions.
      - trackSubject: to perform cross-camera Person Re-Identification (ReID) and build a chronological subject journey.
      - createCase: to create an official investigation file in the system.
      - addEvidence: to attach specific video detections to a case.
      - getPlatformStats: to see how much data is in the system.
      
      Rules:
      1. ONLY answer questions related to investigations, video analysis, cases, or the EYEQ platform. Do not engage in casual chat, joke-telling, or answering general knowledge questions.
      2. If asked to find something, use the searchEvidence tool.
      3. If asked to build a case, use the createCase and addEvidence tools automatically.
      4. If a user asks to investigate suspicious activity, automatically perform a search for typical suspicious behaviors (like 'loitering', 'running', 'abandoned backpack'), compile the evidence, and ask if they'd like a case created.
      5. The current user's ID is ${userId}. If you create a case, use this ID as the userId parameter.
      6. Always be professional, concise, and act like a high-end enterprise security investigator.`,
      tools: {
        searchEvidence,
        trackSubject,
        createCase,
        addEvidence,
        getPlatformStats
      },
      maxSteps: 5, // Allow multi-step reasoning (e.g. search -> create case -> add evidence)
    });

    result.pipeDataStreamToResponse(res);
  } catch (error: any) {
    console.error("[InvestigatorController] Error streaming chat:", error.message);
    res.status(500).json({ error: "Failed to process investigator chat" });
  }
};
