import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from './EmptyState';
import ExportButton from './ExportButton';

const PAGE_SIZES = [25, 50, 100, 250];

export default function DataTable({
  columns, rows, exportFilename, exportable = true, initialSort, emptyMessage, onRowClick,
  paginated = true, pageSize = 25,
}) {
  const [sort, setSort] = useState(initialSort || null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(pageSize);

  const sorted = useMemo(() => {
    if (!sort) return rows || [];
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows || [];
    const val = (r) => (col.sortValue ? col.sortValue(r) : col.accessor ? col.accessor(r) : r[col.key]);
    return [...(rows || [])].sort((a, b) => {
      const av = val(a); const bv = val(b);
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av ?? '').localeCompare(String(bv ?? ''));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  const total = sorted.length;
  const pageCount = paginated ? Math.max(1, Math.ceil(total / size)) : 1;
  const current = Math.min(page, pageCount);

  useEffect(() => { setPage(1); }, [total, sort?.key, sort?.dir, size]);

  const pageRows = paginated ? sorted.slice((current - 1) * size, current * size) : sorted;
  const startIdx = total === 0 ? 0 : (current - 1) * size + 1;
  const endIdx = Math.min(current * size, total);

  const toggleSort = (key) => setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  return (
    <div className="card overflow-hidden">
      {exportable && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-dark-100">
          <span className="text-xs text-dark-400">{total} rows</span>
          <ExportButton rows={sorted} columns={columns} filename={exportFilename || 'export'} label="Export CSV" />
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
                key={row._id || row.id || `${(current - 1) * size + i}`}
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
            <span>Rows per page</span>
            <select className="rounded border border-dark-300 bg-white px-1.5 py-1" value={size} onChange={(e) => setSize(Number(e.target.value))}>
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span>{startIdx}–{endIdx} of {total}</span>
            <div className="flex items-center gap-1">
              <button className="btn-secondary px-2 py-1 disabled:opacity-40" disabled={current <= 1} onClick={() => setPage(current - 1)} aria-label="Previous page">
                <ChevronLeft size={14} />
              </button>
              <span>Page {current} / {pageCount}</span>
              <button className="btn-secondary px-2 py-1 disabled:opacity-40" disabled={current >= pageCount} onClick={() => setPage(current + 1)} aria-label="Next page">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
