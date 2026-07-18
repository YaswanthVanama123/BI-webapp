import React from 'react';
import {
  LayoutDashboard, Gauge, MapPin, TrendingUp, Route as RouteIcon, Clock,
  DollarSign, PieChart, Layers, Users, Wallet, Coins, AlertTriangle, Tags,
  Database, RefreshCw, FileText, ClipboardCheck, Navigation, Milestone, Network,
} from 'lucide-react';

import DashboardPage from '@/features/dashboard/DashboardPage';
import TechnicianUtilizationPage from '@/features/operations/TechnicianUtilizationPage';
import StopsPerTechnicianPage from '@/features/operations/StopsPerTechnicianPage';
import StopVolumeTrendsPage from '@/features/operations/StopVolumeTrendsPage';
import ServiceVsDriveTimePage from '@/features/operations/ServiceVsDriveTimePage';
import ClosedInvoicesPage from '@/features/operations/ClosedInvoicesPage';
import CheckinsPage from '@/features/operations/CheckinsPage';
import DriveTimePage from '@/features/operations/DriveTimePage';
import CompanyDistancesPage from '@/features/operations/CompanyDistancesPage';
import RevenueByCategoryPage from '@/features/revenue/RevenueByCategoryPage';
import RevenueByRoutePage from '@/features/revenue/RevenueByRoutePage';
import RevenueByCustomerPage from '@/features/revenue/RevenueByCustomerPage';
import RevenuePerStopPage from '@/features/revenue/RevenuePerStopPage';
import PayrollCostPage from '@/features/cost/PayrollCostPage';
import LaborPerStopPage from '@/features/cost/LaborPerStopPage';
import RouteProfitabilityPage from '@/features/cost/RouteProfitabilityPage';
import CustomersPage from '@/features/reference/CustomersPage';
import DataQualityPage from '@/features/governance/DataQualityPage';
import UnmappedItemsPage from '@/features/governance/UnmappedItemsPage';
import ImportBatchesPage from '@/features/governance/ImportBatchesPage';
import SyncStatusPage from '@/features/governance/SyncStatusPage';
import ConnectionsPage from '@/features/governance/ConnectionsPage';

export const NAV = [
  {
    section: 'Overview',
    items: [{ to: '/', end: true, label: 'Dashboard', icon: LayoutDashboard, hideFilters: true, element: <DashboardPage /> }],
  },
  {
    section: 'Operations',
    items: [
      { to: '/checkins', label: 'Check-in / Check-out', icon: ClipboardCheck, hideFilters: true, element: <CheckinsPage /> },
      { to: '/utilization', label: 'Technician Utilization', icon: Gauge, hideFilters: true, element: <TechnicianUtilizationPage /> },
      { to: '/stops', label: 'Stops per Technician', icon: MapPin, hideFilters: true, element: <StopsPerTechnicianPage /> },
      { to: '/stop-volume', label: 'Stop Volume Trends', icon: TrendingUp, hideFilters: true, element: <StopVolumeTrendsPage /> },
      { to: '/route-legs', label: 'Service vs Drive Time', icon: Clock, hideFilters: true, element: <ServiceVsDriveTimePage /> },
      { to: '/drive-time', label: 'Drive Time by Route', icon: Navigation, hideFilters: true, element: <DriveTimePage /> },
      { to: '/distances', label: 'Distances / Driving Time', icon: Milestone, hideFilters: true, element: <CompanyDistancesPage /> },
      { to: '/closed-invoices', label: 'Closed Invoices', icon: FileText, hideFilters: true, element: <ClosedInvoicesPage /> },
    ],
  },
  {
    section: 'Revenue',
    items: [
      { to: '/revenue/category', label: 'Revenue by Category', icon: PieChart, hideFilters: true, element: <RevenueByCategoryPage /> },
      { to: '/revenue/route', label: 'Revenue by Route', icon: RouteIcon, hideFilters: true, element: <RevenueByRoutePage /> },
      { to: '/revenue/customer', label: 'Revenue by Customer', icon: Layers, hideFilters: true, element: <RevenueByCustomerPage /> },
      { to: '/revenue/per-stop', label: 'Revenue per Stop', icon: DollarSign, hideFilters: true, element: <RevenuePerStopPage /> },
    ],
  },
  {
    section: 'Cost & Profitability',
    items: [
      { to: '/payroll', label: 'Payroll Cost', icon: Wallet, element: <PayrollCostPage /> },
      { to: '/labor-per-stop', label: 'Labor Cost per Stop', icon: Coins, element: <LaborPerStopPage /> },
      { to: '/profitability', label: 'Route Profitability', icon: TrendingUp, element: <RouteProfitabilityPage /> },
    ],
  },
  {
    section: 'Reference',
    items: [{ to: '/customers', label: 'Customers', icon: Users, hideFilters: true, element: <CustomersPage /> }],
  },
  {
    section: 'Governance',
    items: [
      { to: '/connections', label: 'Data Connections', icon: Network, hideFilters: true, element: <ConnectionsPage /> },
      { to: '/data-quality', label: 'Data Quality', icon: AlertTriangle, hideFilters: true, element: <DataQualityPage /> },
      { to: '/unmapped', label: 'Unmapped Items', icon: Tags, hideFilters: true, element: <UnmappedItemsPage /> },
      { to: '/imports', label: 'Import Batches', icon: Database, hideFilters: true, element: <ImportBatchesPage /> },
      { to: '/sync', label: 'Sync Status', icon: RefreshCw, hideFilters: true, element: <SyncStatusPage /> },
    ],
  },
];

export const NAV_ITEMS = NAV.flatMap((g) => g.items);
export const HIDE_FILTER_PATHS = new Set(NAV_ITEMS.filter((i) => i.hideFilters).map((i) => i.to));
