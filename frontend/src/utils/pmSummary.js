/**
 * Canonical PM Status / Site Condition codes.
 * Radios already store these values. Mapping is exact-key only.
 * Never use substring checks: "OPERATIONAL" is inside every site-condition code.
 */

const SITE_CONDITION_BY_KEY = {
  SYSTEM_OPERATIONAL: "SYSTEM_OPERATIONAL",
  OPERATIONAL: "SYSTEM_OPERATIONAL",
  0: "SYSTEM_OPERATIONAL",
  SYSTEM_NOT_OPERATIONAL: "SYSTEM_NOT_OPERATIONAL",
  NOT_OPERATIONAL: "SYSTEM_NOT_OPERATIONAL",
  NON_OPERATIONAL: "SYSTEM_NOT_OPERATIONAL",
  SYSTEM_NON_OPERATIONAL: "SYSTEM_NOT_OPERATIONAL",
  1: "SYSTEM_NOT_OPERATIONAL",
  SYSTEM_OPERATIONAL_WITH_OBSERVATION: "SYSTEM_OPERATIONAL_WITH_OBSERVATION",
  SYSTEM_OPERATIONAL_WITH_ISSUES: "SYSTEM_OPERATIONAL_WITH_OBSERVATION",
  OPERATIONAL_WITH_OBSERVATION: "SYSTEM_OPERATIONAL_WITH_OBSERVATION",
  2: "SYSTEM_OPERATIONAL_WITH_OBSERVATION"
};

const SITE_CONDITION_LABELS = {
  SYSTEM_OPERATIONAL: "System Operational",
  SYSTEM_NOT_OPERATIONAL: "System Not Operational",
  SYSTEM_OPERATIONAL_WITH_OBSERVATION: "Operational with Observation"
};

const PM_STATUS_BY_KEY = {
  SATISFACTORY: "SATISFACTORY",
  0: "SATISFACTORY",
  REQUIRES_ATTENTION: "REQUIRES_ATTENTION",
  2: "REQUIRES_ATTENTION",
  FOLLOW_UP_VISIT_REQUIRED: "FOLLOW_UP_VISIT_REQUIRED",
  FOLLOWUP_VISIT_REQUIRED: "FOLLOW_UP_VISIT_REQUIRED",
  1: "FOLLOW_UP_VISIT_REQUIRED"
};

const PM_STATUS_LABELS = {
  SATISFACTORY: "Satisfactory",
  REQUIRES_ATTENTION: "Requires Attention",
  FOLLOW_UP_VISIT_REQUIRED: "Follow-up Visit Required"
};

const scalarValue = (value) => {
  if (value == null || value === "") return "";
  if (typeof value === "object") {
    return scalarValue(
      value.value
      || value.name
      || value.siteConditionAfterPm
      || value.preventiveMaintenanceStatus
      || value.siteCondition
      || value.pmStatus
    );
  }
  return value;
};

const toKey = (value) => String(scalarValue(value) || "")
  .trim()
  .toUpperCase()
  .replace(/[\s-]+/g, "_");

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

export const normalizeSiteCondition = (value) => {
  if (value == null || value === "") return "";
  return SITE_CONDITION_BY_KEY[toKey(value)] || "";
};

export const siteConditionLabel = (value) => {
  const code = normalizeSiteCondition(value);
  return SITE_CONDITION_LABELS[code] || "";
};

export const normalizePmStatus = (value) => {
  if (value == null || value === "") return "";
  return PM_STATUS_BY_KEY[toKey(value)] || "";
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
