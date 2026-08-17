/**
 * Canonical PM Status / Site Condition codes.
 * Radios already store these values. Mapping is exact-key only.
 * Never use a bare "OPERATIONAL" substring: it is inside every site-condition code.
 * Never map ordinal "1" or startsWith("FOLLOW") — that collapses other choices to follow-up.
 */

const SITE_CONDITION_BY_KEY = {
  SYSTEM_OPERATIONAL: "SYSTEM_OPERATIONAL",
  SYSTEM_NOT_OPERATIONAL: "SYSTEM_NOT_OPERATIONAL",
  NOT_OPERATIONAL: "SYSTEM_NOT_OPERATIONAL",
  NON_OPERATIONAL: "SYSTEM_NOT_OPERATIONAL",
  SYSTEM_NON_OPERATIONAL: "SYSTEM_NOT_OPERATIONAL",
  SYSTEM_OPERATIONAL_WITH_OBSERVATION: "SYSTEM_OPERATIONAL_WITH_OBSERVATION",
  SYSTEM_OPERATIONAL_WITH_ISSUES: "SYSTEM_OPERATIONAL_WITH_OBSERVATION",
  OPERATIONAL_WITH_OBSERVATION: "SYSTEM_OPERATIONAL_WITH_OBSERVATION",
  OK: "SYSTEM_OPERATIONAL",
  OBS: "SYSTEM_OPERATIONAL_WITH_OBSERVATION",
  DOWN: "SYSTEM_NOT_OPERATIONAL",
  SC_OK: "SYSTEM_OPERATIONAL",
  SC_OBS: "SYSTEM_OPERATIONAL_WITH_OBSERVATION",
  SC_DOWN: "SYSTEM_NOT_OPERATIONAL"
};

const SITE_CONDITION_LABELS = {
  SYSTEM_OPERATIONAL: "System Operational",
  SYSTEM_NOT_OPERATIONAL: "System Not Operational",
  SYSTEM_OPERATIONAL_WITH_OBSERVATION: "Operational with Observation"
};

const PM_STATUS_BY_KEY = {
  SATISFACTORY: "SATISFACTORY",
  REQUIRES_ATTENTION: "REQUIRES_ATTENTION",
  FOLLOW_UP_VISIT_REQUIRED: "FOLLOW_UP_VISIT_REQUIRED",
  FOLLOWUP_VISIT_REQUIRED: "FOLLOW_UP_VISIT_REQUIRED"
};

const PM_STATUS_LABELS = {
  SATISFACTORY: "Satisfactory",
  REQUIRES_ATTENTION: "Requires Attention",
  FOLLOW_UP_VISIT_REQUIRED: "Follow-up Visit Required"
};

const scalarValue = (value, keys) => {
  if (value == null || value === "") return "";
  if (typeof value === "object") {
    for (const key of keys) {
      if (value[key] != null && value[key] !== "") {
        return scalarValue(value[key], keys);
      }
    }
    return "";
  }
  return value;
};

const PM_STATUS_KEYS = ["preventiveMaintenanceStatus", "pmStatus", "value", "name", "code"];
const SITE_CONDITION_KEYS = ["siteConditionAfterPm", "siteConditionAfterPM", "siteCondition", "siteConditionCode", "value", "name", "code"];

const toKey = (value, keys) => String(scalarValue(value, keys) || "")
  .trim()
  .toUpperCase()
  .replace(/[\s-]+/g, "_");

const recoverSiteCondition = (key) => {
  if (!key) return "";
  if (key.includes("NOT_OPERATIONAL") || key.includes("NON_OPERATIONAL") || key === "DOWN" || key === "SC_DOWN") {
    return "SYSTEM_NOT_OPERATIONAL";
  }
  if (key.includes("WITH_OBSERVATION") || key.includes("WITH_ISSUES") || key === "OBS" || key === "SC_OBS") {
    return "SYSTEM_OPERATIONAL_WITH_OBSERVATION";
  }
  if (key === "SYSTEM_OPERATIONAL" || key === "OK" || key === "SC_OK") {
    return "SYSTEM_OPERATIONAL";
  }
  return SITE_CONDITION_BY_KEY[key] || "";
};

const recoverPmStatus = (key) => {
  if (!key) return "";
  return PM_STATUS_BY_KEY[key] || "";
};

export const SITE_CONDITION_OPTIONS = [
  { value: "SYSTEM_OPERATIONAL", label: SITE_CONDITION_LABELS.SYSTEM_OPERATIONAL },
  { value: "SYSTEM_OPERATIONAL_WITH_OBSERVATION", label: SITE_CONDITION_LABELS.SYSTEM_OPERATIONAL_WITH_OBSERVATION },
  { value: "SYSTEM_NOT_OPERATIONAL", label: SITE_CONDITION_LABELS.SYSTEM_NOT_OPERATIONAL }
];

export const PM_STATUS_OPTIONS = [
  { value: "SATISFACTORY", label: PM_STATUS_LABELS.SATISFACTORY },
  { value: "REQUIRES_ATTENTION", label: PM_STATUS_LABELS.REQUIRES_ATTENTION },
  { value: "FOLLOW_UP_VISIT_REQUIRED", label: PM_STATUS_LABELS.FOLLOW_UP_VISIT_REQUIRED }
];

export const isCanonicalPmStatus = (value) =>
  PM_STATUS_OPTIONS.some((option) => option.value === value);

export const isCanonicalSiteCondition = (value) =>
  SITE_CONDITION_OPTIONS.some((option) => option.value === value);

export const normalizeSiteCondition = (value) => {
  if (value == null || value === "") return "";
  return recoverSiteCondition(toKey(value, SITE_CONDITION_KEYS));
};

export const toSiteConditionCode = (value) => {
  const code = normalizeSiteCondition(value);
  if (code === "SYSTEM_OPERATIONAL") return "SC_OK";
  if (code === "SYSTEM_OPERATIONAL_WITH_OBSERVATION") return "SC_OBS";
  if (code === "SYSTEM_NOT_OPERATIONAL") return "SC_DOWN";
  return "";
};

export const siteConditionLabel = (value) => {
  const code = normalizeSiteCondition(value);
  return SITE_CONDITION_LABELS[code] || "";
};

export const normalizePmStatus = (value) => {
  if (value == null || value === "") return "";
  return recoverPmStatus(toKey(value, PM_STATUS_KEYS));
};

export const pmStatusLabel = (value) => {
  const code = normalizePmStatus(value);
  return PM_STATUS_LABELS[code] || "";
};

export const pickSiteCondition = (...values) => {
  for (const value of values) {
    const code = normalizeSiteCondition(value);
    if (code) return code;
  }
  return "";
};

export const pickPmStatus = (...values) => {
  for (const value of values) {
    const code = normalizePmStatus(value);
    if (code) return code;
  }
  return "";
};

export const extractPmSummary = (report = {}) => {
  const summary = report.summary || {};
  return {
    pmStatus: pickPmStatus(
      summary.preventiveMaintenanceStatus,
      summary.pmStatus,
      report.preventiveMaintenanceStatus,
      report.pmStatus,
      report.preventive_maintenance_status
    ),
    siteCondition: pickSiteCondition(
      summary.siteConditionKey,
      report.siteConditionKey,
      summary.siteConditionAfterPm,
      summary.siteConditionAfterPM,
      summary.siteCondition,
      report.siteConditionAfterPm,
      report.siteConditionAfterPM,
      report.siteCondition,
      report.site_condition_after_pm,
      summary.siteConditionCode,
      report.siteConditionCode
    )
  };
};
