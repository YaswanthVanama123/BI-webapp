import React from 'react';
import { formatCurrency, formatDateShort } from '@/utils/format';

export default function LineStatusNotice({ invoice }) {
  if (!invoice) return null;
  if (invoice.linesMatchSubtotal === false) {
    return (
      <div className="rounded-md border border-warning-300 bg-warning-50 px-3 py-2 text-sm text-warning-800">
        These line items add up to {formatCurrency(invoice.linesTotal)}, but the invoice subtotal is {formatCurrency(invoice.subtotal)}.
        The stored lines are out of date, so revenue totals use the subtotal. The nightly invoice line refresh re-reads them from RouteStar.
      </div>
    );
  }
  if (invoice.linesSource === 'routestar') {
    return (
      <div className="text-xs text-success-700">
        Line items re-read from RouteStar{invoice.linesRefreshedAt ? ` on ${formatDateShort(invoice.linesRefreshedAt)}` : ''}.
      </div>
    );
  }
  return null;
}
