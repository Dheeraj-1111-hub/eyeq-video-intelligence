import puppeteer from "puppeteer";
import { ICase } from "../models/Case";
import { IEvidence } from "../models/Evidence";
import { ITimelineEvent } from "../models/TimelineEvent";
import { ICaseNote } from "../models/CaseNote";
import { generateCaseSummary } from "./summary.service";
import { generateReportHtml } from "./report-template";

export const generatePdfReport = async (
  caseData: ICase,
  evidence: IEvidence[],
  timeline: ITimelineEvent[],
  notes: ICaseNote[]
): Promise<Buffer> => {
  const summary = generateCaseSummary(timeline);
  const htmlContent = generateReportHtml(caseData, evidence, timeline, notes, summary);

  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });
  
  const pdfBuffer = await page.pdf({ format: "A4", printBackground: true, margin: { top: '20px', bottom: '20px' } });
  await browser.close();

  return Buffer.from(pdfBuffer);
};
