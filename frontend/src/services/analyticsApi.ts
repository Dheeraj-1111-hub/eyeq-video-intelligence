import api from "../lib/api";

export const analyticsApi = {
  async fetchOverview() {
    const { data } = await api.get("/analytics/overview");
    return data;
  },
  
  async fetchProcessingMetrics() {
    const { data } = await api.get("/analytics/processing");
    return data;
  },
  
  async fetchSearchAnalytics() {
    const { data } = await api.get("/analytics/search");
    return data;
  },
  
  async fetchInvestigationAnalytics() {
    const { data } = await api.get("/analytics/investigation");
    return data;
  }
};
