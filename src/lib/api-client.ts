/**
 * Forge Production API Client with JWT Auth, Token Refresh, and Automatic Offline Fallback
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

async function fetchWithAuth(url: string, options: RequestInit = {}, retries = 2): Promise<Response> {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
    credentials: "include", // This sends the HttpOnly cookies
  });

  // Handle 429 Too Many Requests gracefully with exponential backoff delay
  if (response.status === 429 && retries > 0) {
    const delay = (3 - retries) * 600; // 600ms, 1200ms
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithAuth(url, options, retries - 1);
  }

  // Attempt auto refresh if 401 Unauthorized
  if (response.status === 401 && !url.includes("/auth/")) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry original request since the refresh token endpoint set the new accessToken cookie
      response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
        credentials: "include",
      });
    }
  }

  return response;
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null; // reset after completion
    }
  })();

  return refreshPromise;
}

export const forgeApi = {
  // Auth
  async register(data: { email: string; password: string; name: string }) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    return res.json();
  },

  async login(credentials: { email: string; password: string }) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      credentials: "include",
    });
    return await res.json();
  },

  async forgotPassword(email: string) {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      credentials: "include",
    });
    return res.json();
  },

  async logout() {
    await fetchWithAuth("/auth/logout", { method: "POST" });
  },

  async getMe() {
    const res = await fetchWithAuth("/auth/me");
    return res.json();
  },

  // Profile & Settings
  async getProfile() {
    const res = await fetchWithAuth("/profile");
    return res.json();
  },

  async updateProfile(profileData: Record<string, unknown>) {
    const res = await fetchWithAuth("/profile", {
      method: "PATCH",
      body: JSON.stringify(profileData),
    });
    return res.json();
  },

  async getSettings() {
    const res = await fetchWithAuth("/settings");
    return res.json();
  },

  async updateSettings(settingsData: Record<string, unknown>) {
    const res = await fetchWithAuth("/settings", {
      method: "PUT",
      body: JSON.stringify(settingsData),
    });
    return res.json();
  },

  // Exercises & Foods catalog (paginated)
  async getExercises(query: string = "", page = 1, limit = 50) {
    const params = new URLSearchParams({ search: query, page: String(page), limit: String(limit) });
    const res = await fetchWithAuth(`/exercises?${params}`);
    return res.json();
  },

  async getFoods(query: string = "", page = 1, limit = 50) {
    const params = new URLSearchParams({ search: query, page: String(page), limit: String(limit) });
    const res = await fetchWithAuth(`/foods?${params}`);
    return res.json();
  },

  // Workouts
  async getWorkoutTemplates() {
    const res = await fetchWithAuth("/workout-templates");
    return res.json();
  },

  async getPlans() {
    const res = await fetchWithAuth("/workout-plans");
    return res.json();
  },

  async createPlan(plan: Record<string, unknown>) {
    const res = await fetchWithAuth("/workout-plans", {
      method: "POST",
      body: JSON.stringify(plan),
    });
    return res.json();
  },

  async updatePlan(id: string, patch: Record<string, unknown>) {
    const res = await fetchWithAuth(`/workout-plans/${id}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    return res.json();
  },

  async deletePlan(id: string) {
    const res = await fetchWithAuth(`/workout-plans/${id}`, {
      method: "DELETE",
    });
    return res.json();
  },

  async duplicatePlan(id: string) {
    const res = await fetchWithAuth(`/workout-plans/${id}/duplicate`, {
      method: "POST",
    });
    return res.json();
  },

  async getHistory(page = 1, limit = 20) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res = await fetchWithAuth(`/workout-history?${params}`);
    return res.json();
  },

  // Sessions
  async getActiveSession() {
    const res = await fetchWithAuth("/sessions/active");
    return res.json();
  },

  async startSession(sessionData: Record<string, unknown>) {
    const res = await fetchWithAuth("/sessions", {
      method: "POST",
      body: JSON.stringify(sessionData),
    });
    return res.json();
  },

  async updateActiveSession(sessionData: Record<string, unknown>) {
    const res = await fetchWithAuth("/sessions/active", {
      method: "PATCH",
      body: JSON.stringify(sessionData),
    });
    return res.json();
  },

  async cancelActiveSession() {
    const res = await fetchWithAuth("/sessions/active/cancel", {
      method: "POST",
    });
    return res.json();
  },

  async finishSession() {
    const res = await fetchWithAuth("/sessions/active/complete", {
      method: "POST",
    });
    return res.json();
  },

  async deleteSession(id: string) {
    const res = await fetchWithAuth(`/workout-history/${id}`, {
      method: "DELETE",
    });
    return res.json();
  },

  // Nutrition Logs
  async getNutritionLogs(date?: string, page = 1, limit = 50) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (date) params.set("date", date);
    const res = await fetchWithAuth(`/nutrition/logs?${params}`);
    return res.json();
  },

  async getRescueOptions(params: { craving: string; remainingCalories?: number; remainingProtein?: number; remainingCarbs?: number; remainingFat?: number }) {
    const query = new URLSearchParams();
    query.set("craving", params.craving);
    if (params.remainingCalories !== undefined) query.set("remainingCalories", String(params.remainingCalories));
    if (params.remainingProtein !== undefined) query.set("remainingProtein", String(params.remainingProtein));
    if (params.remainingCarbs !== undefined) query.set("remainingCarbs", String(params.remainingCarbs));
    if (params.remainingFat !== undefined) query.set("remainingFat", String(params.remainingFat));
    const res = await fetchWithAuth(`/nutrition/rescue?${query.toString()}`);
    return res.json();
  },

  async addFoodEntries(entries: unknown[]) {
    const res = await fetchWithAuth("/nutrition/logs", {
      method: "POST",
      body: JSON.stringify({ entries }),
    });
    return res.json();
  },

  async updateFoodEntry(id: string, patch: Record<string, unknown>) {
    const res = await fetchWithAuth(`/nutrition/logs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    return res.json();
  },

  async removeFoodEntry(id: string) {
    const res = await fetchWithAuth(`/nutrition/logs/${id}`, {
      method: "DELETE",
    });
    return res.json();
  },

  // Weight (paginated)
  async getWeight(page = 1, limit = 100) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res = await fetchWithAuth(`/weight?${params}`);
    return res.json();
  },

  async addWeight(date: string, weightKg: number) {
    const res = await fetchWithAuth("/weight", {
      method: "POST",
      body: JSON.stringify({ date, weightKg }),
    });
    return res.json();
  },

  async updateWeight(id: string, date: string, weightKg: number) {
    const res = await fetchWithAuth(`/weight/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ date, weightKg }),
    });
    return res.json();
  },

  async deleteWeight(id: string) {
    const res = await fetchWithAuth(`/weight/${id}`, {
      method: "DELETE",
    });
    return res.json();
  },

  // Measurements (paginated)
  async getMeasurements(page = 1, limit = 100) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res = await fetchWithAuth(`/measurements?${params}`);
    return res.json();
  },

  async addMeasurement(date: string, values: Record<string, number>) {
    const res = await fetchWithAuth("/measurements", {
      method: "POST",
      body: JSON.stringify({ date, values }),
    });
    return res.json();
  },

  async updateMeasurement(id: string, date: string, values: Record<string, number>) {
    const res = await fetchWithAuth(`/measurements/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ date, values }),
    });
    return res.json();
  },

  async deleteMeasurement(id: string) {
    const res = await fetchWithAuth(`/measurements/${id}`, {
      method: "DELETE",
    });
    return res.json();
  },

  // Water
  async getWater(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const query = params.toString();
    const res = await fetchWithAuth(`/water${query ? `?${query}` : ""}`);
    return res.json();
  },

  async addWater(date: string, amountMl: number) {
    const res = await fetchWithAuth("/water", {
      method: "POST",
      body: JSON.stringify({ date, amountMl }),
    });
    return res.json();
  },

  // Progress Photos
  async getProgressPhotos(pose?: string) {
    const params = pose ? `?pose=${pose}` : "";
    const res = await fetchWithAuth(`/progress-photos${params}`);
    return res.json();
  },

  async uploadPhoto(formData: FormData) {
    const res = await fetchWithAuth("/progress-photos", {
      method: "POST",
      body: formData,
    });
    return res.json();
  },

  async deletePhoto(id: string) {
    const res = await fetchWithAuth(`/progress-photos/${id}`, {
      method: "DELETE",
    });
    return res.json();
  },

  // Dashboard
  async getDashboard() {
    const res = await fetchWithAuth("/dashboard");
    return res.json();
  },

  async getDashboardAnalytics(period = "30d") {
    const res = await fetchWithAuth(`/dashboard/analytics?period=${period}`);
    return res.json();
  },

  async getStreak() {
    const res = await fetchWithAuth("/dashboard/streak");
    return res.json();
  },

  async getAchievements() {
    const res = await fetchWithAuth("/dashboard/achievements");
    return res.json();
  },

  // Notifications
  async getNotifications() {
    const res = await fetchWithAuth("/notifications");
    return res.json();
  },

  async getDailyQuote() {
    const res = await fetchWithAuth("/notifications/quote");
    return res.json();
  },

  async markNotificationRead(id: string) {
    const res = await fetchWithAuth(`/notifications/${id}/read`, {
      method: "PATCH",
    });
    return res.json();
  },

  async markAllNotificationsRead() {
    const res = await fetchWithAuth("/notifications/read-all", {
      method: "PATCH",
    });
    return res.json();
  },

  // Progress Data Import/Export
  async importData(payload: Record<string, unknown>) {
    const res = await fetchWithAuth("/data/import", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async exportData() {
    const res = await fetchWithAuth("/data/export");
    return res.json();
  },

  // Health
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },

  // SSE Notifications stream URL (for EventSource in components)
  getNotificationsStreamUrl() {
    return `${API_BASE_URL}/notifications/stream`;
  },
};
