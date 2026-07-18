export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1',
  reportingTz: import.meta.env.VITE_REPORTING_TZ || 'America/New_York',
};

export default config;
