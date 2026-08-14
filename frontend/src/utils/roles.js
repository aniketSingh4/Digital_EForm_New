import { decodeJwtPayload } from "./authSession";

export const getUserRole = () => {
  const stored = localStorage.getItem("userRole");
  if (stored) return stored.toUpperCase();

  const token = localStorage.getItem("token");
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  return payload?.role ? String(payload.role).toUpperCase() : null;
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
