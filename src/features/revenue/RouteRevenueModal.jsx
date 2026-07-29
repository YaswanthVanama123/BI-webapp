import React from 'react';
import DrillModal from './DrillModal';

export default function RouteRevenueModal({ routeCode, range, onClose }) {
  return (
    <DrillModal
      title={`Route ${routeCode}`}
      subtitle="Invoiced work on this route for the selected period — click a customer for their invoices"
      filter={{ routeCode }}
      range={range}
      onClose={onClose}
    />
  );
}
