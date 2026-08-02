const EXPORT_FORMAT_KEY = 'bi.exportFormat';
const EXPORT_FORMAT_EVENT = 'bi-export-format-changed';

export function getExportFormat() {
  try {
    return localStorage.getItem(EXPORT_FORMAT_KEY) === 'csv' ? 'csv' : 'excel';
  } catch (e) {
    return 'excel';
  }
}

export function setExportFormat(format) {
  const fmt = format === 'csv' ? 'csv' : 'excel';
  try { localStorage.setItem(EXPORT_FORMAT_KEY, fmt); } catch (e) {}
  try { window.dispatchEvent(new CustomEvent(EXPORT_FORMAT_EVENT, { detail: fmt })); } catch (e) {}
  return fmt;
}

export function onExportFormatChange(handler) {
  const wrap = () => handler(getExportFormat());
  window.addEventListener(EXPORT_FORMAT_EVENT, wrap);
  window.addEventListener('storage', wrap);
  return () => {
    window.removeEventListener(EXPORT_FORMAT_EVENT, wrap);
    window.removeEventListener('storage', wrap);
  };
}
