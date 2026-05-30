import api from "../lib/api";

export const settingsApi = {
  async fetchSettings() {
    const { data } = await api.get("/settings");
    return data;
  },
  
  async updateSettings(updates: any) {
    const { data } = await api.put("/settings", updates);
    return data;
  },
  
  async updateProfile(updates: any) {
    const { data } = await api.put("/settings/profile", updates);
    return data;
  },
  
  async deleteStorage(type: string) {
    const { data } = await api.delete(`/settings/storage/${type}`);
    return data;
  }
};
