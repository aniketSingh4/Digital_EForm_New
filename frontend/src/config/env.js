/**
 * Centralized microservice URLs from Vite environment variables.
 * Update frontend/.env to change hosts without editing source files.
 */

const stripTrailingSlash = (url = '') => url.replace(/\/+$/, '');

const AUTH_SERVICE_URL = stripTrailingSlash(import.meta.env.VITE_AUTH_SERVICE_URL);
const PM_SERVICE_URL = stripTrailingSlash(import.meta.env.VITE_PM_SERVICE_URL);
const PREVISIT_SERVICE_URL = stripTrailingSlash(import.meta.env.VITE_PREVISIT_SERVICE_URL);
const CALIBRATION_SERVICE_URL = stripTrailingSlash(import.meta.env.VITE_CALIBRATION_SERVICE_URL);
const INSTALLATION_SERVICE_URL = stripTrailingSlash(import.meta.env.VITE_INSTALLATION_SERVICE_URL);

export const env = {
  // Service origins (for images / absolute asset URLs)
  AUTH_SERVICE_URL,
  PM_SERVICE_URL,
  PREVISIT_SERVICE_URL,
  CALIBRATION_SERVICE_URL,
  INSTALLATION_SERVICE_URL,

  // Axios / API base paths (.../api)
  AUTH_API_URL: `${AUTH_SERVICE_URL}/api`,
  PM_API_URL: `${PM_SERVICE_URL}/api`,
  PREVISIT_API_URL: `${PREVISIT_SERVICE_URL}/api`,
  CALIBRATION_API_URL: `${CALIBRATION_SERVICE_URL}/api`,
  INSTALLATION_API_URL: `${INSTALLATION_SERVICE_URL}/api`,

  // Resource endpoints (.../api/<resource>)
  PM_REPORTS_URL: `${PM_SERVICE_URL}/api/pm_reports`,
  PREVISIT_REPORTS_URL: `${PREVISIT_SERVICE_URL}/api/previsit-reports`,
  CALIBRATION_REPORTS_URL: `${CALIBRATION_SERVICE_URL}/api/calibration-reports`,
  INSTALLATION_REPORTS_URL: `${INSTALLATION_SERVICE_URL}/api/installation-reports`,
};

export default env;
