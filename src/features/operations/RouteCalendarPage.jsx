import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { CalendarCheck, CalendarX, ChevronLeft, ChevronRight, Clock, DollarSign, Gauge, Loader2, MapPin, Star } from 'lucide-react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, SearchSelect, ExportButton } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DrillModal from '@/features/revenue/DrillModal';
import { formatCurrency, formatDateShort, formatMinutes, formatNumber, formatPercent } from '@/utils/format';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const pad = (n) => String(n).padStart(2, '0');
const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parts = (s) => s.split('-').map(Number);
const toDate = (dk) => { const [y, m, d] = parts(dk); return new Date(y, m - 1, d); };
const shiftMonth = (ym, delta) => { const [y, m] = parts(ym); return isoDay(new Date(y, m - 1 + delta, 1)).slice(0, 7); };
const monthBounds = (ym) => { const [y, m] = parts(ym); return { from: `${ym}-01`, to: isoDay(new Date(y, m, 0)) }; };
const monthTitle = (ym) => toDate(`${ym}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const dayTitle = (dk) => toDate(dk).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const isWeekend = (dk) => [0, 6].includes(toDate(dk).getDay());
const utilTone = (p) => (p == null ? 'neutral' : p >= 60 ? 'success' : p >= 40 ? 'warning' : 'danger');
const shortMinutes = (v) => {
  const n = Math.max(0, Math.round(Number(v) || 0));
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
};

const TONE = {
  success: { bar: 'bg-success-500', text: 'text-success-700', tile: 'border-success-200 bg-success-50', icon: 'bg-success-50 text-success-600' },
  warning: { bar: 'bg-warning-500', text: 'text-warning-700', tile: 'border-warning-200 bg-warning-50', icon: 'bg-warning-50 text-warning-600' },
  danger: { bar: 'bg-danger-500', text: 'text-danger-700', tile: 'border-danger-200 bg-danger-50', icon: 'bg-danger-50 text-danger-600' },
  info: { bar: 'bg-primary-500', text: 'text-primary-700', tile: 'border-primary-200 bg-primary-50', icon: 'bg-primary-50 text-primary-600' },
  neutral: { bar: 'bg-dark-300', text: 'text-dark-600', tile: 'border-dark-200 bg-white', icon: 'bg-dark-100 text-dark-600' },
};
const UTIL_LEGEND = [
  { tone: 'success', label: '≥ 60%' },
  { tone: 'warning', label: '40–60%' },
  { tone: 'danger', label: '< 40%' },
];

function monthWeeks(ym, withWeekend) {
  const [y, m] = parts(ym);
  const cells = Array.from({ length: (new Date(y, m - 1, 1).getDay() + 6) % 7 }, () => null);
  const count = new Date(y, m, 0).getDate();
  for (let d = 1; d <= count; d += 1) cells.push(`${ym}-${pad(d)}`);
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + (withWeekend ? 7 : 5)));
  return weeks.filter((w) => w.some(Boolean));
}

function monthOptions(minMonth, maxMonth) {
  const floor = minMonth || shiftMonth(maxMonth, -23);
  const out = [];
  for (let ym = maxMonth; ym >= floor && out.length < 240; ym = shiftMonth(ym, -1)) out.push({ value: ym, label: monthTitle(ym) });
  return out;
}

function weekSummary(week, byDate) {
  const rows = week.map((d) => (d ? byDate.get(d) : null)).filter(Boolean);
  if (!rows.length) return null;
  const t = rows.reduce((a, r) => ({ stops: a.stops + r.stops, revenue: a.revenue + r.revenue, service: a.service + r.serviceMinutes, span: a.span + r.spanMinutes }), { stops: 0, revenue: 0, service: 0, span: 0 });
  return { days: rows.length, stops: t.stops, revenue: t.revenue, utilizationPct: t.span ? (t.service / t.span) * 100 : null };
}

const exportColumns = [
  { key: 'date', header: 'Date' },
  { key: 'stops', header: 'Stops' },
  { key: 'avgServiceMinutes', header: 'Avg time per stop (min)' },
  { key: 'revenue', header: 'Revenue (before tax)' },
  { key: 'tax', header: 'Tax' },
  { key: 'billed', header: 'Billed incl. tax' },
  { key: 'utilizationPct', header: 'Utilization %' },
  { key: 'serviceMinutes', header: 'On-site (min)' },
  { key: 'spanMinutes', header: 'Day span (min)' },
  { key: 'routes', header: 'Routes' },
];

function UtilBar({ pct, tone, className }) {
  return (
    <div className={clsx('h-1.5 w-full overflow-hidden rounded-full bg-dark-200/70', className)}>
      <div className={clsx('h-full rounded-full', TONE[tone].bar)} style={{ width: `${Math.max(0, Math.min(100, Number(pct) || 0))}%` }} />
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, tone = 'info', progress }) {
  return (
    <div className="card min-w-0 p-4">
      <div className="flex items-center gap-2">
        <span className={clsx('grid h-8 w-8 shrink-0 place-items-center rounded-lg', TONE[tone].icon)}><Icon size={16} /></span>
        <span className="truncate text-xs font-medium uppercase tracking-wide text-dark-400">{label}</span>
      </div>
      <div className="mt-2 truncate text-2xl font-semibold text-dark-900 tabular-nums" title={String(value)}>{value}</div>
      {sub && <div className="truncate text-xs text-dark-500">{sub}</div>}
      {progress !== undefined && <UtilBar pct={progress} tone={tone} className="mt-2" />}
    </div>
  );
}

function Caption({ children }) {
  return <div className="text-[10px] font-medium uppercase tracking-wide text-dark-400">{children}</div>;
}

function UtilRow({ pct, tone }) {
  return (
    <div className="mt-auto pt-2">
      <Caption>Utilization</Caption>
      <div className="mt-0.5 flex items-center gap-1.5">
        <UtilBar pct={pct} tone={tone} className="flex-1" />
        <span className={clsx('shrink-0 text-[11px] font-semibold tabular-nums', TONE[tone].text)}>{formatPercent(pct)}</span>
      </div>
    </div>
  );
}

function MetricRow({ label, children, className }) {
  return (
    <div className="flex items-center justify-between gap-1">
      <span className="truncate text-dark-500">{label}</span>
      <span className={clsx('shrink-0 font-semibold tabular-nums', className || 'text-dark-800')}>{children}</span>
    </div>
  );
}

function DayNumber({ date, today, muted }) {
  return (
    <span className={clsx('grid h-7 w-7 place-items-center rounded-full text-sm font-semibold',
      date === today ? 'bg-primary-600 text-white shadow-sm' : muted ? 'text-dark-400' : 'bg-white/80 text-dark-800 ring-1 ring-dark-200')}
    >
      {Number(date.slice(8))}
    </span>
  );
}

function DayCell({ date, row, today, top, allRoutes, onOpen }) {
  if (!date) return <div className="min-h-[148px] rounded-lg bg-dark-50/70" />;
  if (!row) {
    const none = date < today && !isWeekend(date);
    return (
      <div className={clsx('flex min-h-[148px] flex-col rounded-lg border p-2.5', none ? 'border-dashed border-dark-300 bg-dark-50' : 'border-dark-200 bg-white')}>
        <DayNumber date={date} today={today} muted />
        {none && <div className="mt-auto flex items-center gap-1 text-xs text-dark-400"><CalendarX size={13} />No record</div>}
      </div>
    );
  }
  const tone = utilTone(row.utilizationPct);
  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      title={`${dayTitle(date)} — view invoices`}
      className={clsx('group relative flex min-h-[148px] w-full flex-col overflow-hidden rounded-lg border p-2.5 pt-3 text-left shadow-sm transition',
        'hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500', TONE[tone].tile)}
    >
      <span className={clsx('absolute inset-x-0 top-0 h-1', TONE[tone].bar)} />
      <div className="flex items-center justify-between gap-1">
        <span className="flex items-center gap-1">
          <DayNumber date={date} today={today} />
          {top && <Star size={14} className="fill-warning-400 text-warning-500" aria-label="Top revenue day" />}
        </span>
        {allRoutes && <span className="truncate text-[10px] font-medium text-dark-500">{row.routes} {row.routes === 1 ? 'route' : 'routes'}</span>}
      </div>
      <div className="mt-2">
        <Caption>Revenue</Caption>
        <div className="truncate text-base font-semibold text-dark-900 tabular-nums">{formatCurrency(row.revenue)}</div>
      </div>
      <div className="mt-1.5 space-y-0.5 text-xs">
        <MetricRow label="Stops">{formatNumber(row.stops)}</MetricRow>
        <MetricRow label="Avg time">{shortMinutes(row.avgServiceMinutes)}</MetricRow>
      </div>
      <UtilRow pct={row.utilizationPct} tone={tone} />
    </button>
  );
}

function WeekCell({ summary }) {
  if (!summary) return <div className="grid min-h-[148px] place-items-center rounded-lg border border-dashed border-dark-200 text-xs text-dark-300">—</div>;
  const tone = utilTone(summary.utilizationPct);
  return (
    <div className="flex min-h-[148px] flex-col rounded-lg bg-primary-50/70 p-2.5 ring-1 ring-inset ring-primary-100">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-primary-700">Week total</div>
      <div className="mt-2 truncate text-base font-semibold text-dark-900 tabular-nums">{formatCurrency(summary.revenue)}</div>
      <div className="mt-1.5 space-y-0.5 text-xs">
        <MetricRow label="Stops">{formatNumber(summary.stops)}</MetricRow>
        <MetricRow label="Days">{formatNumber(summary.days)}</MetricRow>
      </div>
      <UtilRow pct={summary.utilizationPct} tone={tone} />
    </div>
  );
}

export default function RouteCalendar() {
  const opts = useApi(() => biService.checkinOptions(), []);
  const users = useApi(() => biService.routeUsers(), []);
  const [routeCode, setRouteCode] = useState('');
  const [month, setMonth] = useState(null);
  const [day, setDay] = useState(null);

  const today = isoDay(new Date());
  const earliest = opts.data && opts.data.earliestDate;
  const latest = opts.data && opts.data.latestDate;
  const latestMonth = (latest || today).slice(0, 7);
  const maxMonth = latestMonth > today.slice(0, 7) ? latestMonth : today.slice(0, 7);
  const activeMonth = month || latestMonth;
  const { from, to } = monthBounds(activeMonth);

  const [cal, setCal] = useState({ data: null, loading: true, error: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (opts.loading) return undefined;
    let alive = true;
    setCal((s) => ({ ...s, loading: true, error: null }));
    biService.routeCalendar({ from, to, routeCode })
      .then((res) => { if (alive) setCal({ data: (res && res.data) || null, loading: false, error: null }); })
      .catch((err) => { if (alive) setCal({ data: null, loading: false, error: (err && err.message) || 'Failed to load' }); });
    return () => { alive = false; };
  }, [from, to, routeCode, opts.loading, attempt]);
  const reload = () => setAttempt((n) => n + 1);

  const { data, loading, error } = cal;
  const fresh = !!data && data.from === from && data.to === to && (data.routeCode || '') === routeCode.toUpperCase();
  const busy = loading || opts.loading || !fresh;
  const shownMonth = data ? data.from.slice(0, 7) : activeMonth;
  const userOf = useMemo(() => new Map(((users.data) || []).map((u) => [u.routeCode, u.name])), [users.data]);
  const withUser = (code) => (userOf.get(code) ? `${code} · ${userOf.get(code)}` : code);
  const shownRoute = data && data.routeCode ? withUser(data.routeCode) : 'All routes';

  const routeOptions = useMemo(() => ((opts.data && opts.data.routes) || []).map((r) => ({ value: r, label: userOf.get(r) ? `${r} · ${userOf.get(r)}` : r })), [opts.data, userOf]);
  const monthChoices = useMemo(() => monthOptions(earliest ? earliest.slice(0, 7) : null, maxMonth), [earliest, maxMonth]);
  const days = useMemo(() => (data && data.days) || [], [data]);
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const topDate = useMemo(() => (days.length > 1 ? days.reduce((m, d) => (d.revenue > m.revenue ? d : m)).date : null), [days]);
  const withWeekend = days.some((d) => isWeekend(d.date));
  const weeks = useMemo(() => monthWeeks(shownMonth, withWeekend), [shownMonth, withWeekend]);
  const summaries = useMemo(() => weeks.map((w) => weekSummary(w, byDate)), [weeks, byDate]);
  const headers = WEEKDAYS.slice(0, withWeekend ? 7 : 5);
  const canPrev = !earliest || activeMonth > earliest.slice(0, 7);
  const canNext = activeMonth < maxMonth;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Route calendar — stops, avg time per stop, revenue and utilization for every day. Click a day to see its invoices."
        actions={<ExportButton rows={days} columns={exportColumns} filename={`route-calendar-${data && data.routeCode ? data.routeCode : 'all-routes'}-${shownMonth}`} disabled={busy} />}
      />

      <div className="card p-3 mb-5 flex flex-wrap items-end gap-3">
        <div className="flex flex-col"><span className="field-label">Route</span>
          <SearchSelect value={routeCode} onChange={setRouteCode} options={routeOptions} placeholder="All routes" allLabel="All routes" />
        </div>
        <div className="flex flex-col"><span className="field-label">Month</span>
          <div className="flex items-center gap-1">
            <button type="button" className="btn-secondary px-2" onClick={() => setMonth(shiftMonth(activeMonth, -1))} disabled={!canPrev} aria-label="Previous month"><ChevronLeft size={16} /></button>
            <SearchSelect value={activeMonth} onChange={(v) => { if (v) setMonth(v); }} options={monthChoices} placeholder={monthTitle(activeMonth)} clearable={false} />
            <button type="button" className="btn-secondary px-2" onClick={() => setMonth(shiftMonth(activeMonth, 1))} disabled={!canNext} aria-label="Next month"><ChevronRight size={16} /></button>
            <button type="button" className="btn-secondary" onClick={() => setMonth(null)} disabled={activeMonth === latestMonth}>Latest</button>
          </div>
        </div>
      </div>

      <AsyncSection loading={!error && busy} error={error} data={data} reload={reload}>
        {(d) => {
          const k = d.kpis;
          return (
            <div className={clsx('space-y-5 transition-opacity', busy && 'pointer-events-none opacity-60')}>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                <KpiCard icon={CalendarCheck} tone="info" label="Days worked" value={formatNumber(k.days)} sub={monthTitle(shownMonth)} />
                <KpiCard icon={MapPin} tone="info" label="Stops" value={formatNumber(k.stops)} sub={`${formatNumber(k.avgStopsPerDay)} per day`} />
                <KpiCard icon={Clock} tone="neutral" label="Avg time / stop" value={formatMinutes(k.avgServiceMinutes)} sub="on-site per stop" />
                <KpiCard icon={DollarSign} tone="success" label="Revenue" value={formatCurrency(k.revenue)} sub={`${formatCurrency(k.avgRevenuePerDay)} per day · before tax`} />
                <KpiCard icon={Gauge} tone={utilTone(k.utilizationPct)} label="Utilization" value={formatPercent(k.utilizationPct)} sub="on-site ÷ day span" progress={k.utilizationPct} />
              </div>

              <div className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dark-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dark-900">{monthTitle(shownMonth)}</h3>
                    <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-inset ring-primary-100">{shownRoute}</span>
                    {busy && <Loader2 size={15} className="animate-spin text-dark-400" />}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-dark-500">
                    <span className="font-medium text-dark-600">Utilization</span>
                    {UTIL_LEGEND.map((l) => (
                      <span key={l.tone} className="flex items-center gap-1.5"><span className={clsx('h-2.5 w-2.5 rounded-full', TONE[l.tone].bar)} />{l.label}</span>
                    ))}
                    <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-dashed border-dark-300 bg-dark-50" />No record</span>
                    <span className="flex items-center gap-1"><Star size={12} className="fill-warning-400 text-warning-500" />Top revenue day</span>
                  </div>
                </div>
                <div className="overflow-x-auto p-3">
                  <div className={clsx('grid gap-2', withWeekend
                    ? 'min-w-[900px] grid-cols-8'
                    : 'min-w-[700px] grid-cols-6')}
                  >
                    {headers.map((h, i) => (
                      <div key={h} className={clsx('px-1 text-[11px] font-semibold uppercase tracking-wide', i > 4 ? 'text-dark-400' : 'text-dark-500')}>{h}</div>
                    ))}
                    <div className="px-1 text-[11px] font-semibold uppercase tracking-wide text-primary-700">Week</div>
                    {weeks.map((wk, wi) => (
                      <React.Fragment key={`w${wi}`}>
                        {wk.map((date, di) => (
                          <DayCell key={date || `b${wi}-${di}`} date={date} row={date ? byDate.get(date) : null} today={today} top={date === topDate} allRoutes={!d.routeCode} onOpen={setDay} />
                        ))}
                        <WeekCell summary={summaries[wi]} />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        }}
      </AsyncSection>

      {day && (
        <DrillModal
          title={`${shownRoute} · ${formatDateShort(day.date)}`}
          subtitle={`${formatNumber(day.stops)} stop(s) · ${formatCurrency(day.revenue)} revenue`}
          filter={{ routeCode: (data && data.routeCode) || 'ALL' }}
          range={{ from: day.date, to: day.date }}
          defaultTab="invoices"
          onClose={() => setDay(null)}
        />
      )}
    </div>
  );
}
