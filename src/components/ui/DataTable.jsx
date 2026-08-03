import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from './EmptyState';
import ExportButton from './ExportButton';

const PAGE_SIZES = [25, 50, 100, 250];

export default function DataTable({
  columns, rows, exportFilename, exportable = true, initialSort, emptyMessage, onRowClick,
  paginated = true, pageSize = 25, searchable = true, searchPlaceholder = 'Search…',
  serverSide = false, serverTotal = 0, page: controlledPage = 1, onPageChange, onExportAll,
}) {
  const [sort, setSort] = useState(initialSort || null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(pageSize);
  const [query, setQuery] = useState('');

  const showSearch = !serverSide && searchable && (rows?.length || 0) > 5;
  const q = query.trim().toLowerCase();
  const filteredRows = useMemo(() => {
    const base = rows || [];
    if (serverSide || !q) return base;
    return base.filter((row) => Object.values(row).some((v) => v != null && typeof v !== 'object' && String(v).toLowerCase().includes(q)));
  }, [rows, q, serverSide]);

  const sorted = useMemo(() => {
    if (!sort) return filteredRows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filteredRows;
    const val = (r) => (col.sortValue ? col.sortValue(r) : col.accessor ? col.accessor(r) : r[col.key]);
    return [...filteredRows].sort((a, b) => {
      const av = val(a); const bv = val(b);
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av ?? '').localeCompare(String(bv ?? ''));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sort, columns, filteredRows]);

  const effSize = serverSide ? pageSize : size;
  const total = serverSide ? serverTotal : sorted.length;
  const pageCount = paginated ? Math.max(1, Math.ceil(total / effSize)) : 1;
  const current = serverSide ? controlledPage : Math.min(page, pageCount);

  useEffect(() => { if (!serverSide) setPage(1); }, [total, sort?.key, sort?.dir, size, serverSide]);

  const pageRows = serverSide ? sorted : (paginated ? sorted.slice((current - 1) * effSize, current * effSize) : sorted);
  const startIdx = total === 0 ? 0 : (current - 1) * effSize + 1;
  const endIdx = Math.min(current * effSize, total);
  const goTo = (p) => (serverSide ? onPageChange && onPageChange(p) : setPage(p));

  const toggleSort = (key) => setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  return (
    <div className="card overflow-hidden">
      {(exportable || showSearch) && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-dark-100">
          <div className="flex items-center gap-3">
            {showSearch && (
              <input
                className="field h-8 py-1 text-sm w-48 sm:w-56"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            )}
            <span className="text-xs text-dark-400 whitespace-nowrap">{total} rows</span>
          </div>
          {exportable && <ExportButton rows={sorted} fetchRows={onExportAll} columns={columns} filename={exportFilename || 'export'} />}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-dark-50 text-dark-500">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => c.sortable !== false && toggleSort(c.key)}
                  className={clsx('px-4 py-2.5 font-medium whitespace-nowrap select-none',
                    c.align === 'right' ? 'text-right' : 'text-left',
                    c.sortable !== false && 'cursor-pointer hover:text-dark-700')}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {c.sortable !== false && <ArrowUpDown size={12} className={clsx('opacity-40', sort?.key === c.key && 'opacity-100 text-primary-600')} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-100">
            {pageRows.map((row, i) => (
              <tr
                key={row._id || row.id || `${(current - 1) * effSize + i}`}
                className={clsx('hover:bg-primary-50/40', onRowClick && 'cursor-pointer')}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key} className={clsx('px-4 py-2.5 text-dark-700 whitespace-nowrap', c.align === 'right' && 'text-right tabular-nums')}>
                    {c.render ? c.render(row) : c.accessor ? c.accessor(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total === 0 && <EmptyState message={emptyMessage || 'No rows match the current filters.'} />}

      {paginated && total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dark-100 px-4 py-2 text-xs text-dark-500">
          <div className="flex items-center gap-2">
            {!serverSide && (
              <>
                <span>Rows per page</span>
                <select className="rounded border border-dark-300 bg-white px-1.5 py-1" value={size} onChange={(e) => setSize(Number(e.target.value))}>
                  {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span>{startIdx}–{endIdx} of {total}</span>
            <div className="flex items-center gap-1">
              <button className="btn-secondary px-2 py-1 disabled:opacity-40" disabled={current <= 1} onClick={() => goTo(current - 1)} aria-label="Previous page">
                <ChevronLeft size={14} />
              </button>
              <span>Page {current} / {pageCount}</span>
              <button className="btn-secondary px-2 py-1 disabled:opacity-40" disabled={current >= pageCount} onClick={() => goTo(current + 1)} aria-label="Next page">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
