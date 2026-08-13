/**
 * Role helpers for RBAC.
 * USER: create + view; ADMIN: create, view, update, delete
 */

export const getUserRole = () => {
  const stored = localStorage.getItem("userRole");
  if (stored) return stored.toUpperCase();

  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.role ? String(payload.role).toUpperCase() : null;
  } catch {
    return null;
  }
};

export const isAdmin = () => getUserRole() === "ADMIN";

export const canModifyReports = () => isAdmin();

export const getAuthHeaders = (extra = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...extra,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

export default {
  getUserRole,
  isAdmin,
  canModifyReports,
  getAuthHeaders,
};
