/**
 * localStorage TTL cache utilities
 */

const PREFIX = "app_cache:";

export const getCached = (key) => {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.expiresAt !== "number") {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
};

export const setCached = (key, data, ttlMs = 15 * 60 * 1000) => {
  try {
    const payload = {
      data,
      expiresAt: Date.now() + ttlMs,
    };
    localStorage.setItem(PREFIX + key, JSON.stringify(payload));
  } catch (e) {
    console.warn("Failed to set cache:", key, e);
  }
};

export const invalidate = (prefixOrKey) => {
  try {
    const target = PREFIX + prefixOrKey;
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k === target || k.startsWith(target))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn("Failed to invalidate cache:", prefixOrKey, e);
  }
};

export const invalidateAllReportCaches = () => {
  invalidate("pm_reports");
  invalidate("previsit_reports");
  invalidate("calibration_reports");
  invalidate("installation_reports");
  localStorage.removeItem("dashboard_data");
  localStorage.removeItem("dashboard_timestamp");
};

export const LIST_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export default {
  getCached,
  setCached,
  invalidate,
  invalidateAllReportCaches,
  LIST_CACHE_TTL,
};
