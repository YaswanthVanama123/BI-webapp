import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Route as RouteIcon, Clock, DollarSign, Users, TrendingUp, ArrowRight, ShieldCheck } from 'lucide-react';

const FEATURES = [
  { icon: DollarSign, title: 'Revenue intelligence', desc: 'By category, route, customer and per-stop — invoiced actuals reconciled against expected.' },
  { icon: RouteIcon, title: 'Route & drive time', desc: 'Service vs drive time, distances and stops per technician from RouteStar.' },
  { icon: Clock, title: 'Check-in / check-out', desc: 'On-site time, idle gaps and daily spans per route and technician.' },
  { icon: Users, title: 'Customer health', desc: 'New customers, invoices created, routes and pricing — all keyed on stable RouteStar IDs.' },
  { icon: TrendingUp, title: 'Cost & profitability', desc: 'Payroll cost, labor per stop and route profitability in one place.' },
  { icon: ShieldCheck, title: 'Data quality & sync', desc: 'Connection status, unmapped items, import batches and sync history.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-50 text-dark-800">
      <header className="flex items-center justify-between px-6 lg:px-10 py-4 border-b border-dark-200 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-primary-600 text-white grid place-items-center font-bold">EM</div>
          <div>
            <div className="text-sm font-semibold leading-tight">EnviroMaster BI</div>
            <div className="text-[11px] text-dark-400 leading-tight">Operational &amp; Financial</div>
          </div>
        </div>
        <Link to="/login" className="btn-primary px-4 py-2">Sign in <ArrowRight size={16} /></Link>
      </header>

      <section className="px-6 lg:px-10 py-16 lg:py-24 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 text-primary-700 px-3 py-1 text-xs font-medium">
          <BarChart3 size={14} /> EnviroMaster NRV
        </div>
        <h1 className="mt-5 text-4xl lg:text-5xl font-bold tracking-tight">The business, on real numbers.</h1>
        <p className="mt-5 text-lg text-dark-500 max-w-2xl mx-auto">
          One dashboard for revenue, routes, drive time, payroll cost and customer health — pulled straight from RouteStar.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/login" className="btn-primary px-5 py-2.5 text-base">Sign in to dashboard <ArrowRight size={18} /></Link>
        </div>
      </section>

      <section className="px-6 lg:px-10 pb-20 max-w-6xl mx-auto">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-5">
              <div className="h-10 w-10 rounded-lg bg-primary-50 text-primary-600 grid place-items-center mb-3"><f.icon size={20} /></div>
              <div className="font-semibold text-dark-800">{f.title}</div>
              <div className="text-sm text-dark-500 mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-dark-200 bg-white px-6 lg:px-10 py-6 text-center text-xs text-dark-400">
        © EnviroMaster NRV · Operational &amp; Financial BI
      </footer>
    </div>
  );
}
