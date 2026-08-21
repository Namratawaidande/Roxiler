import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  limit = 10,
  onPageChange,
  onLimitChange,
  loading = false,
  itemName = 'records'
}) => {
  if (totalPages <= 1 && totalItems <= limit) {
    return null;
  }

  // Generate page numbers with intelligent truncation
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = 4;
      }
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const startRecord = (currentPage - 1) * limit + 1;
  const endRecord = Math.min(currentPage * limit, totalItems);

  return (
    <div style={{
      padding: '0.85rem 1.25rem',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '0.75rem'
    }}>
      {/* Status Summary & Limit Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
          Showing <strong>{totalItems > 0 ? startRecord : 0}–{endRecord}</strong> of <strong>{totalItems}</strong> {itemName} (Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>)
        </div>

        {onLimitChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
            <span>Per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#f8fafc',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '2px 6px',
                fontSize: '0.78rem'
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}
      </div>

      {/* Page Navigation Controls */}
      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1 || loading}
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
        >
          <ChevronLeft size={13} /> Prev
        </Button>

        {getPageNumbers().map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`dots-${idx}`} style={{ color: 'var(--text-subtle)', padding: '0 4px', fontSize: '0.85rem' }}>
                ...
              </span>
            );
          }
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              disabled={loading}
              className={`btn btn-sm ${currentPage === p ? 'btn-primary' : 'btn-secondary'}`}
              style={{ minWidth: '30px', padding: '0.25rem 0.45rem', fontSize: '0.78rem' }}
            >
              {p}
            </button>
          );
        })}

        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages || loading}
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
        >
          Next <ChevronRight size={13} />
        </Button>
      </div>
    </div>
  );
};
