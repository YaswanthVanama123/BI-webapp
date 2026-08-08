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

const PAYROLL_ANCHOR_KEY = 'bi.payrollAnchor';
const PAYROLL_ANCHOR_EVENT = 'bi-payroll-anchor-changed';

export function getPayrollAnchor() {
  try { return localStorage.getItem(PAYROLL_ANCHOR_KEY) || ''; } catch (e) { return ''; }
}

export function setPayrollAnchor(date) {
  const v = date || '';
  try { localStorage.setItem(PAYROLL_ANCHOR_KEY, v); } catch (e) {}
  try { window.dispatchEvent(new CustomEvent(PAYROLL_ANCHOR_EVENT, { detail: v })); } catch (e) {}
  return v;
}

export function onPayrollAnchorChange(handler) {
  const wrap = () => handler(getPayrollAnchor());
  window.addEventListener(PAYROLL_ANCHOR_EVENT, wrap);
  window.addEventListener('storage', wrap);
  return () => {
    window.removeEventListener(PAYROLL_ANCHOR_EVENT, wrap);
    window.removeEventListener('storage', wrap);
  };
}
