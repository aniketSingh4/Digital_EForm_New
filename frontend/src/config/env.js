/**
 * Centralized microservice URLs from Vite environment variables.
 *
 * Local: set VITE_* in frontend/.env to each service (localhost ports).
 * Production (https://digitalform.florosense.com on the VPS): leave VITE_*
 * unset so Axios calls same-origin /api. eform-nginx routes /api to the
 * Spring services. Never bake http://72.60.74.221 into an HTTPS build.
 */

const stripTrailingSlash = (url = '') => String(url || '').replace(/\/+$/, '');

/** Drop http:// origins when the page itself is HTTPS (avoids mixed content). */
const publicOrigin = (url = '') => {
  const origin = stripTrailingSlash(url);
  if (
    typeof window !== 'undefined' &&
    window.location?.protocol === 'https:' &&
    origin.startsWith('http:')
  ) {
    return '';
  }
  return origin;
};

const AUTH_SERVICE_URL = publicOrigin(import.meta.env.VITE_AUTH_SERVICE_URL);
const PM_SERVICE_URL = publicOrigin(import.meta.env.VITE_PM_SERVICE_URL);
const PREVISIT_SERVICE_URL = publicOrigin(import.meta.env.VITE_PREVISIT_SERVICE_URL);
const CALIBRATION_SERVICE_URL = publicOrigin(import.meta.env.VITE_CALIBRATION_SERVICE_URL);
const INSTALLATION_SERVICE_URL = publicOrigin(import.meta.env.VITE_INSTALLATION_SERVICE_URL);

export const ENABLE_SIGNUP =
  import.meta.env.VITE_ENABLE_SIGNUP === 'true' ||
  (Boolean(import.meta.env.DEV) && import.meta.env.VITE_ENABLE_SIGNUP !== 'false');

export const env = {
  ENABLE_SIGNUP,

  // Service origins (for images / absolute asset URLs). Empty = same origin.
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
