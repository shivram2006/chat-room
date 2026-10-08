// Automatically detects production URL or uses VITE_API_URL if deployed separately
export const API_BASE = import.meta.env.VITE_API_URL || '';

export const apiUrl = (endpoint) => {
  if (endpoint.startsWith('http')) return endpoint;
  return `${API_BASE}${endpoint}`;
};
