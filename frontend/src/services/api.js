/**
 * CloudVault API Service
 * Handles communication with FastAPI backend endpoints.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.detail?.message || data?.detail || response.statusText || "Request failed";
      const error = new Error(typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg));
      error.status = response.status;
      error.details = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Health & Info
  getHealth: () => request("/health"),
  getRootInfo: () => request("/"),

  // Records Statistics
  getStats: () => request("/records/stats"),

  // Records CRUD & Search
  getRecords: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== "ALL") query.append("status", params.status);
    if (params.category && params.category !== "ALL") query.append("category", params.category);
    if (params.search) query.append("search", params.search);
    if (params.sort_by) query.append("sort_by", params.sort_by);
    if (params.sort_order) query.append("sort_order", params.sort_order);
    if (params.skip !== undefined) query.append("skip", params.skip);
    if (params.limit !== undefined) query.append("limit", params.limit);

    const queryString = query.toString();
    return request(`/records${queryString ? `?${queryString}` : ""}`);
  },

  getRecord: (id) => request(`/records/${id}`),

  searchRecords: (q, limit = 50) => request(`/records/search?q=${encodeURIComponent(q)}&limit=${limit}`),

  createRecord: (payload) =>
    request("/records", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  deleteRecord: (id) =>
    request(`/records/${id}`, {
      method: "DELETE",
    }),

  // Manual Review Workflow
  approveRecord: (id, notes = "") =>
    request(`/records/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ action: "APPROVE", notes }),
    }),

  rejectRecord: (id, notes = "") =>
    request(`/records/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ action: "REJECT", notes }),
    }),
};
