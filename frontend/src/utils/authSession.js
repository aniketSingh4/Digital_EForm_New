const AUTH_CHANGED_EVENT = "eform-auth-changed";

const isPublicAuthUrl = (url = "") =>
  url.includes("/auth/login") || url.includes("/auth/register");

export const decodeJwtPayload = (token) => {
  if (!token) {
    return null;
  }
  const parts = String(token).split(".");
  if (parts.length !== 3) {
    return null;
  }
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

export const clearAuthStorage = () => {
  const email = localStorage.getItem("userEmail");
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("dashboard_data");
  localStorage.removeItem("dashboard_timestamp");
  localStorage.removeItem("notifications");
  if (email) {
    localStorage.removeItem(`notifications_${email}`);
  }
};

export const redirectToLogin = () => {
  if (!window.location.pathname.includes("/login")) {
    window.location.href = "/login";
  }
};

/**
 * Only a true 401 means the session is invalid.
 * 403 is forbidden/misconfigured (notifications, CORS, missing nginx route)
 * and must not log the user out.
 */
export const handleUnauthorizedResponse = (error) => {
  const status = error?.response?.status;
  if (status !== 401) {
    return;
  }
  const failedUrl = error.config?.url || "";
  if (isPublicAuthUrl(failedUrl) || failedUrl.includes("/notifications")) {
    return;
  }
  if (!localStorage.getItem("token")) {
    return;
  }
  clearAuthStorage();
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  redirectToLogin();
};

export default {
  decodeJwtPayload,
  clearAuthStorage,
  handleUnauthorizedResponse,
};
