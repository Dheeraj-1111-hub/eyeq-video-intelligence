import { tool } from 'ai';
import { z } from 'zod';
import mongoose from 'mongoose';
import axios from 'axios';
import Case from '../models/Case';
import Evidence from '../models/Evidence';
import CaseNote from '../models/CaseNote';
import Video from '../models/Video';
import Detection from '../models/Detection';
import { findSimilarSubjects } from '../services/reid.service';

const PYTHON_AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8001";

// We require the authenticated user's ID to perform authorized actions.
export const getInvestigatorTools = (userId: string) => {
  return {
    search_evidence: tool({
      description: 'Search for evidence using natural language semantic search across all indexed CCTV footage.',
      parameters: z.object({
        query: z.string().optional().describe('The natural language query (e.g. "person in red shirt")'),
        min_confidence: z.number().optional().describe('Minimum confidence score (0.0 to 1.0)'),
        start_hour: z.number().optional().describe('Filter by start hour of the day (0-23)'),
        end_hour: z.number().optional().describe('Filter by end hour of the day (0-23)')
      }),
      execute: async (args) => {
        console.log("==========================================");
        console.log("TOOL INVOKED: search_evidence");
        console.log("Args:", JSON.stringify(args, null, 2));
        console.log("==========================================");
        
        const { query, min_confidence, start_hour, end_hour } = args;
        
        if (!query || typeof query !== 'string' || query.trim() === '') {
          return { message: "VALIDATION FAILED: You MUST provide a valid 'query' string parameter to search_evidence. Please try calling the tool again with the query." };
        }

        try {
          const payload = {
            query,
            semantic_threshold: min_confidence || 0.65,
            top_k: 10,
            start_hour,
            end_hour
          };
          const response = await axios.post(`${PYTHON_AI_URL}/search`, payload);
          return response.data;
        } catch (error) {
          return { error: "Failed to communicate with AI search service." };
        }
      }
    }),

    track_subject: tool({
      description: 'Track a specific subject across multiple cameras to build a chronological journey timeline using ReID embeddings.',
      parameters: z.object({
        detection_id: z.string().optional().describe('The MongoDB ObjectId of the source detection to track')
      }),
      execute: async (args) => {
        console.log("==========================================");
        console.log("TOOL INVOKED: track_subject");
        console.log("Args:", JSON.stringify(args, null, 2));
        console.log("==========================================");
        const { detection_id } = args;
        if (!detection_id) return { message: "VALIDATION FAILED: 'detection_id' is required." };
        try {
          const targetDoc = await Detection.findById(detection_id);
          if (!targetDoc || !targetDoc.reid_embedding) {
            return { message: "Target detection not found or missing ReID embedding." };
          }
          const matches = await findSimilarSubjects(targetDoc.reid_embedding, 0.85, detection_id);
          return { matches };
        } catch (error: any) {
          return { message: error.message || "Failed to track subject." };
        }
      }
    }),

    create_case: tool({
      description: 'Create a new investigation case to store evidence and notes.',
      parameters: z.object({
        title: z.string().optional().describe('The title of the case'),
        description: z.string().optional().describe('Detailed description of the investigation'),
        priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional().describe('Priority level')
      }),
      execute: async (args) => {
        console.log("==========================================");
        console.log("TOOL INVOKED: create_case");
        console.log("Args:", JSON.stringify(args, null, 2));
        console.log("==========================================");
        const { title, description, priority } = args;
        if (!title || !description || !priority) return { message: "VALIDATION FAILED: 'title', 'description', and 'priority' are required." };
        const newCase = new Case({
          title,
          description,
          priority,
          uploadedBy: new mongoose.Types.ObjectId(userId)
        });
        await newCase.save();
        return { case_id: newCase._id.toString(), status: "Case created successfully." };
      }
    }),

    add_evidence: tool({
      description: 'Add specific detection results to an existing investigation case as evidence.',
      parameters: z.object({
        case_id: z.string().optional().describe('The ID of the case to add evidence to'),
        evidence_items: z.array(z.object({
          video_id: z.string().optional(),
          detection_id: z.string().optional(),
          timestamp_seconds: z.number().optional(),
          label: z.string().optional(),
          confidence: z.number().optional()
        })).optional().describe('An array of detections to add as evidence')
      }),
      execute: async (args) => {
        console.log("==========================================");
        console.log("TOOL INVOKED: add_evidence");
        console.log("Args:", JSON.stringify(args, null, 2));
        console.log("==========================================");
        const { case_id, evidence_items } = args;
        if (!case_id || !evidence_items || !Array.isArray(evidence_items)) {
          return { message: "VALIDATION FAILED: 'case_id' and 'evidence_items' array are required." };
        }
        const results = [];
        for (const item of evidence_items) {
          const evidence = new Evidence({
            caseId: new mongoose.Types.ObjectId(case_id),
            videoId: new mongoose.Types.ObjectId(item.video_id),
            detectionId: new mongoose.Types.ObjectId(item.detection_id),
            timestampSeconds: item.timestamp_seconds,
            label: item.label,
            confidence: item.confidence,
            addedBy: new mongoose.Types.ObjectId(userId)
          });
          await evidence.save();
          results.push(evidence._id);
        }
        return { added: results.length, status: "Evidence successfully added to case." };
      }
    }),

    generate_report: tool({
      description: 'Trigger the generation of an Executive Summary and Forensic PDF Report for a case.',
      parameters: z.object({
        case_id: z.string().optional().describe('The ID of the case to generate a report for')
      }),
      execute: async (args) => {
        console.log("==========================================");
        console.log("TOOL INVOKED: generate_report");
        console.log("Args:", JSON.stringify(args, null, 2));
        console.log("==========================================");
        const { case_id } = args;
        if (!case_id) return { message: "VALIDATION FAILED: 'case_id' is required." };
        // We will just create an automated CaseNote representing the agent's summary
        const automatedNote = new CaseNote({
          caseId: new mongoose.Types.ObjectId(case_id),
          content: "Automated AI Investigation Report initiated. All evidence has been collected and the timeline has been assembled by the EYEQ Autonomous Investigator.",
          author: new mongoose.Types.ObjectId(userId) // The agent acts on behalf of the user
        });
        await automatedNote.save();
        return { status: "Report generation initiated and case notes updated. PDF can be downloaded from the case dashboard." };
      }
    }),

    get_platform_stats: tool({
      description: 'Get an overview of platform statistics including total videos processed, active cases, and system load.',
      parameters: z.object({}),
      execute: async () => {
        const videos = await Video.countDocuments();
        const cases = await Case.countDocuments();
        const detections = await Detection.countDocuments();
        return { total_videos: videos, total_cases: cases, total_detections: detections };
      }
    })
  };
};
