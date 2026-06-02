import { Request, Response } from "express";
import Case from "../models/Case";
import Evidence from "../models/Evidence";
import TimelineEvent from "../models/TimelineEvent";
import CaseNote from "../models/CaseNote";
import Video from "../models/Video";
import Notification from "../models/Notification";
import UserSettings from "../models/UserSettings";
import { generateCaseSummary } from "../services/summary.service";
import { generatePdfReport } from "../services/report.service";

export const createCase = async (req: Request, res: Response) => {
  try {
    const { title, description, priority } = req.body;
    const userId = req.user?.userId;

    const newCase = await Case.create({
      title,
      description,
      priority,
      uploadedBy: userId,
    });

    return res.status(201).json(newCase);
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to create case", details: error.message });
  }
};

export const getCases = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    // Return cases for the current user
    const cases = await Case.find({ uploadedBy: userId }).sort({ createdAt: -1 });
    
    // Get clips count for each case
    const casesWithCounts = await Promise.all(
      cases.map(async (c) => {
        const count = await Evidence.countDocuments({ caseId: c._id });
        return { ...c.toObject(), clipsCount: count };
      })
    );

    return res.status(200).json(casesWithCounts);
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch cases" });
  }
};

export const getCaseDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const caseData = await Case.findById(id);
    if (!caseData) return res.status(404).json({ error: "Case not found" });

    const evidenceDocs = await Evidence.find({ caseId: id }).sort({ timestampSeconds: 1 }).lean();
    const timeline = await TimelineEvent.find({ caseId: id }).sort({ timestampSeconds: 1 });
    const notes = await CaseNote.find({ caseId: id }).sort({ createdAt: -1 }).populate("userId", "name email");

    // Attach video locations to evidence
    const evidence = await Promise.all(evidenceDocs.map(async (ev) => {
      const video = await Video.findById(ev.videoId).select("location").lean();
      return {
        ...ev,
        videoLocation: video?.location || "Unknown"
      };
    }));

    // Generate summary on the fly
    const summary = generateCaseSummary(timeline);

    return res.status(200).json({
      case: caseData,
      evidence,
      timeline,
      notes,
      summary
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch case details" });
  }
};

export const addEvidence = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // caseId
    const { videoId, videoFilename, detectionId, timestamp, timestampSeconds, label, confidence, thumbnailPath, framePath, originEvidenceId } = req.body;

    const evidence = await Evidence.create({
      caseId: id,
      videoId,
      videoFilename,
      detectionId,
      timestamp,
      timestampSeconds,
      label,
      confidence,
      thumbnailPath,
      framePath,
      ...(originEvidenceId ? { originEvidenceId } : {})
    });

    // Automatically create a timeline event for this evidence
    await TimelineEvent.create({
      caseId: id,
      evidenceId: evidence._id,
      timestamp,
      timestampSeconds,
      eventType: "Detection",
      title: `Detection: ${label}`,
      description: `Confidence: ${Math.round(confidence * 100)}%`
    });

    // Check user settings and notify owner
    const caseObj = await Case.findById(id);
    if (caseObj) {
      const settings = await UserSettings.findOne({ userId: caseObj.uploadedBy });
      if (!settings || settings.notifications?.caseUpdates !== false) {
        await Notification.create({
          userId: caseObj.uploadedBy,
          title: "Case Evidence Added",
          message: `New evidence was added to case "${caseObj.title}".`,
          type: "info"
        });
      }
    }

    return res.status(201).json(evidence);
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to add evidence" });
  }
};

export const addNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user?.userId;

    const note = await CaseNote.create({
      caseId: id,
      userId,
      content
    });

    return res.status(201).json(note);
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to add note" });
  }
};

export const generateReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const caseData = await Case.findById(id);
    if (!caseData) return res.status(404).json({ error: "Case not found" });

    const evidence = await Evidence.find({ caseId: id }).sort({ timestampSeconds: 1 });
    const timeline = await TimelineEvent.find({ caseId: id }).sort({ timestampSeconds: 1 });
    const notes = await CaseNote.find({ caseId: id }).sort({ createdAt: 1 });

    const pdfBuffer = await generatePdfReport(caseData, evidence, timeline, notes);

    // Notify user
    const settings = await UserSettings.findOne({ userId: caseData.uploadedBy });
    if (!settings || settings.notifications?.reportGenerated !== false) {
      await Notification.create({
        userId: caseData.uploadedBy,
        title: "Report Generated",
        message: `Forensic report for "${caseData.title}" has been successfully compiled and downloaded.`,
        type: "success"
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=case-${id}-report.pdf`);
    return res.send(pdfBuffer);
  } catch (error: any) {
    console.error("PDF Gen error:", error);
    return res.status(500).json({ error: "Failed to generate report" });
  }
};

export const updateCaseStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;
    
    const updated = await Case.findByIdAndUpdate(id, { $set: { status, priority } }, { new: true });
    return res.status(200).json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to update case" });
  }
}

export const getReportPreview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const caseData = await Case.findById(id);
    if (!caseData) return res.status(404).json({ error: "Case not found" });

    const evidence = await Evidence.find({ caseId: id }).sort({ timestampSeconds: 1 });
    const timeline = await TimelineEvent.find({ caseId: id }).sort({ timestampSeconds: 1 });
    const notes = await CaseNote.find({ caseId: id }).sort({ createdAt: 1 }).populate("userId", "name email");

    const summary = generateCaseSummary(timeline);
    
    // Import dynamically or ensure it's imported at the top
    const { generateReportHtml } = require("../services/report-template");
    const html = generateReportHtml(caseData, evidence, timeline, notes, summary);

    return res.status(200).json({ html });
  } catch (error: any) {
    console.error("Preview Gen error:", error);
    return res.status(500).json({ error: "Failed to generate preview" });
  }
};
