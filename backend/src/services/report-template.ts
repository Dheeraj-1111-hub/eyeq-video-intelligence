import fs from "fs";
import path from "path";
import crypto from "crypto";
import { ICase } from "../models/Case";
import { IEvidence } from "../models/Evidence";
import { ITimelineEvent } from "../models/TimelineEvent";
import { ICaseNote } from "../models/CaseNote";

// Helper to convert local image to Base64 URI for HTML embedding
const getBase64Image = (thumbnailPath: string): string => {
  if (!thumbnailPath) return "";
  try {
    // Determine absolute path. Assuming thumbnailPath is like /uploads/thumbnails/...
    // The server is in backend/src, uploads are in backend/uploads
    const absolutePath = path.join(__dirname, "../../", thumbnailPath);
    if (!fs.existsSync(absolutePath)) return "";
    
    const ext = path.extname(absolutePath).toLowerCase().replace(".", "");
    const mimeType = ext === "png" ? "image/png" : "image/jpeg";
    const base64Str = fs.readFileSync(absolutePath, { encoding: "base64" });
    return `data:${mimeType};base64,${base64Str}`;
  } catch (error) {
    console.error("Failed to convert image to base64:", error);
    return "";
  }
};

export const generateReportHtml = (
  caseData: ICase,
  evidence: IEvidence[],
  timeline: ITimelineEvent[],
  notes: ICaseNote[],
  summary: string
): string => {
  
  // 1. Calculate Statistics
  const totalEvidence = evidence.length;
  const uniqueVideos = new Set(evidence.map(e => e.videoId)).size;
  const detectedPersons = evidence.filter(e => e.label.toLowerCase() === "person").length;
  const detectedVehicles = evidence.filter(e => ["car", "truck", "bus", "motorcycle", "vehicle"].includes(e.label.toLowerCase())).length;
  const totalEvents = timeline.length;

  // 2. Compute Integrity Hash (SHA256)
  const hashPayload = JSON.stringify({
    id: caseData._id,
    updatedAt: caseData.updatedAt,
    evidenceIds: evidence.map(e => e._id),
    timelineLength: totalEvents
  });
  const sha256Hash = crypto.createHash("sha256").update(hashPayload).digest("hex");

  // 3. Generate HTML
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Investigation Report - ${caseData._id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
    
    :root {
      --bg: #ffffff;
      --text: #1a1a1a;
      --text-muted: #666666;
      --border: #e5e5e5;
      --accent: #1e293b;
      --brand: #0f172a;
    }
    
    * { box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      color: var(--text);
      background: var(--bg);
      line-height: 1.6;
      margin: 0;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
    }

    h1, h2, h3 { font-weight: 600; color: var(--brand); margin-top: 0; }
    h2 { font-size: 1.25rem; border-bottom: 2px solid var(--brand); padding-bottom: 8px; margin-top: 40px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.05em; }
    
    /* Forensic Header */
    .header { border-bottom: 4px solid var(--brand); padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 2rem; margin-bottom: 5px; }
    .header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; font-size: 0.85rem; font-family: 'JetBrains Mono', monospace; }
    .header-item span { color: var(--text-muted); display: block; font-size: 0.75rem; text-transform: uppercase; }
    .header-item strong { color: var(--brand); }

    /* Stats Grid */
    .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat-card { background: #f8fafc; border: 1px solid var(--border); padding: 15px; border-radius: 6px; text-align: center; }
    .stat-card .label { font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 5px; }
    .stat-card .val { font-size: 1.5rem; font-weight: 700; color: var(--brand); font-family: 'JetBrains Mono', monospace; }

    /* Summary */
    .summary-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 6px 6px 0; font-size: 0.95rem; }

    /* Vertical Timeline */
    .timeline { position: relative; margin-top: 20px; padding-left: 30px; }
    .timeline::before { content: ''; position: absolute; left: 7px; top: 5px; bottom: 5px; width: 2px; background: var(--border); }
    .timeline-event { position: relative; margin-bottom: 25px; }
    .timeline-event::before { content: ''; position: absolute; left: -28.5px; top: 6px; width: 10px; height: 10px; border-radius: 50%; background: #3b82f6; border: 2px solid #fff; box-shadow: 0 0 0 1px var(--border); }
    .timeline-time { font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; font-weight: 700; color: var(--brand); margin-bottom: 2px; }
    .timeline-title { font-weight: 600; font-size: 1rem; }
    .timeline-desc { font-size: 0.85rem; color: var(--text-muted); margin-top: 2px; }

    /* Evidence Grid */
    .evidence-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .evidence-card { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; page-break-inside: avoid; }
    .evidence-img-container { width: 100%; height: 200px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid var(--border); }
    .evidence-img-container img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .evidence-meta { padding: 15px; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; background: #fafafa; }
    .evidence-meta-row { display: flex; justify-content: space-between; margin-bottom: 5px; border-bottom: 1px dashed #e5e5e5; padding-bottom: 4px; }
    .evidence-meta-row:last-child { border: none; margin-bottom: 0; padding-bottom: 0; }
    .evidence-meta-label { color: var(--text-muted); }
    .evidence-meta-val { font-weight: 700; color: var(--brand); text-transform: uppercase; }
    
    .missing-img { color: #94a3b8; font-size: 0.85rem; font-weight: 500; font-family: 'Inter', sans-serif; }

    /* Notes */
    .note-item { padding: 15px; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 10px; background: #fff; page-break-inside: avoid; }
    .note-meta { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 5px; font-family: 'JetBrains Mono', monospace; }
    .note-content { font-size: 0.9rem; white-space: pre-wrap; }

    /* Integrity Block */
    .integrity-block { margin-top: 60px; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; page-break-inside: avoid; }
    .integrity-title { font-family: 'Inter', sans-serif; font-size: 1rem; font-weight: 700; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.05em; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 8px; }
    .integrity-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .integrity-label { color: #94a3b8; }
    .integrity-val { color: #38bdf8; word-break: break-all; max-width: 70%; text-align: right; }
  </style>
</head>
<body>

  <div class="header">
    <h1>EYEQ Investigation Report</h1>
    <div class="header-grid">
      <div class="header-item"><span>Case ID</span><strong>CASE-${caseData._id}</strong></div>
      <div class="header-item"><span>Generated</span><strong>${new Date().toUTCString()}</strong></div>
      <div class="header-item"><span>Platform</span><strong>EYEQ Forensics v1.0</strong></div>
      <div class="header-item"><span>Status / Priority</span><strong>${caseData.status} / ${caseData.priority}</strong></div>
    </div>
  </div>

  <h2>Investigation Statistics</h2>
  <div class="stats-grid">
    <div class="stat-card"><span class="label">Evidence Items</span><span class="val">${totalEvidence}</span></div>
    <div class="stat-card"><span class="label">Sources</span><span class="val">${uniqueVideos}</span></div>
    <div class="stat-card"><span class="label">Persons</span><span class="val">${detectedPersons}</span></div>
    <div class="stat-card"><span class="label">Vehicles</span><span class="val">${detectedVehicles}</span></div>
    <div class="stat-card"><span class="label">Events</span><span class="val">${totalEvents}</span></div>
  </div>

  <h2>Executive Summary</h2>
  <div class="summary-box">
    ${summary || 'No evidence collected yet to generate a summary.'}
  </div>

  <h2>Event Timeline</h2>
  <div class="timeline">
    ${timeline.length > 0 ? timeline.map(e => `
      <div class="timeline-event">
        <div class="timeline-time">${e.timestamp}</div>
        <div class="timeline-title">${e.title}</div>
        ${e.description ? `<div class="timeline-desc">${e.description}</div>` : ''}
      </div>
    `).join('') : '<p style="color: #666; font-size: 0.9rem;">No timeline events recorded.</p>'}
  </div>

  <h2>Evidence Log</h2>
  <div class="evidence-grid">
    ${evidence.length > 0 ? evidence.map((e, index) => {
      const base64Img = getBase64Image(e.thumbnailPath || "");
      return `
      <div class="evidence-card">
        <div class="evidence-img-container">
          ${base64Img ? `<img src="${base64Img}" alt="Evidence Thumbnail">` : `<span class="missing-img">Thumbnail Unavailable</span>`}
        </div>
        <div class="evidence-meta">
          <div class="evidence-meta-row"><span class="evidence-meta-label">Item</span><span class="evidence-meta-val">#${(index + 1).toString().padStart(3, '0')}</span></div>
          <div class="evidence-meta-row"><span class="evidence-meta-label">Time</span><span class="evidence-meta-val">${e.timestamp}</span></div>
          <div class="evidence-meta-row"><span class="evidence-meta-label">Source</span><span class="evidence-meta-val">${e.videoFilename || e.videoId}</span></div>
          <div class="evidence-meta-row"><span class="evidence-meta-label">Object</span><span class="evidence-meta-val">${e.label}</span></div>
          <div class="evidence-meta-row"><span class="evidence-meta-label">Confidence</span><span class="evidence-meta-val">${Math.round(e.confidence * 100)}%</span></div>
        </div>
      </div>
    `}).join('') : '<p style="color: #666; font-size: 0.9rem; grid-column: 1 / -1;">No evidence collected.</p>'}
  </div>

  <h2>Investigator Notes</h2>
  <div>
    ${notes.length > 0 ? notes.map(n => `
      <div class="note-item">
        <div class="note-meta">
          <span>By: ${(n.userId as any)?.name || 'Investigator'}</span>
          <span>${new Date(n.createdAt).toLocaleString()}</span>
        </div>
        <div class="note-content">${n.content}</div>
      </div>
    `).join('') : '<p style="color: #666; font-size: 0.9rem;">No investigator notes added.</p>'}
  </div>

  <div class="integrity-block">
    <div class="integrity-title">Report Integrity Verification</div>
    <div class="integrity-row">
      <span class="integrity-label">Case Hash (SHA256)</span>
      <span class="integrity-val">${sha256Hash}</span>
    </div>
    <div class="integrity-row">
      <span class="integrity-label">Generation Time</span>
      <span class="integrity-val">${new Date().toISOString()}</span>
    </div>
    <div class="integrity-row">
      <span class="integrity-label">Evidence Signature Count</span>
      <span class="integrity-val">${totalEvidence}</span>
    </div>
  </div>

</body>
</html>
`;
};
