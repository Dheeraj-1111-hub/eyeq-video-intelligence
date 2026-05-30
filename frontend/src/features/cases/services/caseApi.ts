import api from "@/lib/api";
import { Case, CaseDetailsResponse, Evidence, CaseNote } from "../types";

export const getCases = async (): Promise<Case[]> => {
  const { data } = await api.get("/cases");
  return data;
};

export const getCaseDetails = async (id: string): Promise<CaseDetailsResponse> => {
  const { data } = await api.get(`/cases/${id}`);
  return data;
};

export const createCase = async (payload: { title: string; description: string; priority: string }): Promise<Case> => {
  const { data } = await api.post("/cases", payload);
  return data;
};

export const addEvidence = async (caseId: string, payload: Partial<Evidence>): Promise<Evidence> => {
  const { data } = await api.post(`/cases/${caseId}/evidence`, payload);
  return data;
};

export const addNote = async (caseId: string, content: string): Promise<CaseNote> => {
  const { data } = await api.post(`/cases/${caseId}/notes`, { content });
  return data;
};

export const updateCaseStatus = async (caseId: string, status: string, priority: string): Promise<Case> => {
  const { data } = await api.put(`/cases/${caseId}`, { status, priority });
  return data;
}

export const getReportPreview = async (caseId: string): Promise<string> => {
  const { data } = await api.get(`/cases/${caseId}/report/preview`);
  return data.html;
};

export const downloadReport = async (caseId: string, caseTitle: string) => {
  const res = await api.get(`/cases/${caseId}/report`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Report-${caseTitle.replace(/\s+/g, '_')}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
};
