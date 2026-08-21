import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  RefreshCw,
  Star,
  MapPin,
  Mail,
  User,
  Shield,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { AddStoreModal } from '../components/admin/AddStoreModal';
import { StoreDetailsModal } from '../components/admin/StoreDetailsModal';
import api from '../services/api';

export const AdminStoresPage = () => {
  const [stores, setStores] = useState([]);
  const [meta, setMeta] = useState({ totalItems: 0, totalPages: 1, currentPage: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [filters, setFilters] = useState({
    search: '',
    name: '',
    email: '',
    address: ''
  });

  // Sorting State
  const [sort, setSort] = useState({
    sortBy: 'created_at',
    order: 'DESC'
  });

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchStores = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit,
        sortBy: sort.sortBy,
        order: sort.order
      };

      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.name.trim()) params.name = filters.name.trim();
      if (filters.email.trim()) params.email = filters.email.trim();
      if (filters.address.trim()) params.address = filters.address.trim();

      const response = await api.get('/stores', { params });
      if (response?.data?.stores) {
        setStores(response.data.stores);
        if (response.meta) {
          setMeta(response.meta);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load store catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [page, limit, sort]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStores();
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      name: '',
      email: '',
      address: ''
    });
    setPage(1);
  };

  const handleSort = (column) => {
    if (sort.sortBy === column) {
      setSort({
        sortBy: column,
        order: sort.order === 'ASC' ? 'DESC' : 'ASC'
      });
    } else {
      setSort({
        sortBy: column,
        order: column === 'rating' ? 'DESC' : 'ASC'
      });
    }
    setPage(1);
  };

  const renderSortIcon = (column) => {
    if (sort.sortBy !== column) {
      return <ArrowUpDown size={12} color="var(--text-subtle)" style={{ marginLeft: '4px' }} />;
    }
    return sort.order === 'ASC' ? (
      <ArrowUp size={12} color="#06b6d4" style={{ marginLeft: '4px' }} />
    ) : (
      <ArrowDown size={12} color="#06b6d4" style={{ marginLeft: '4px' }} />
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={12} /> ADMIN ACCESS
            </span>
            <Link to="/admin" style={{ color: 'var(--text-subtle)', fontSize: '0.8rem', textDecoration: 'none' }}>
              ← Return to Dashboard Overview
            </Link>
          </div>
          <h1 style={{ fontSize: '2rem' }}>Store Management Directory</h1>
          <p style={{ fontSize: '0.95rem' }}>
            Register new merchant stores, assign verified store owners, and review customer satisfaction ratings.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="secondary" size="sm" icon={RefreshCw} loading={loading} onClick={fetchStores}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsAddModalOpen(true)}>
            Add New Store
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Multi-Dimensional Filter Card */}
      <form onSubmit={handleSearchSubmit} className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-subtle)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Filter size={14} /> Search & Filter Platform Stores
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          {/* General Search */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>General Search</label>
            <input
              type="text"
              name="search"
              placeholder="Search across all fields..."
              className="form-input"
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>

          {/* Filter by Name */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Filter by Store Name</label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Apex Digital"
              className="form-input"
              value={filters.name}
              onChange={handleFilterChange}
            />
          </div>

          {/* Filter by Email */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Filter by Contact Email</label>
            <input
              type="text"
              name="email"
              placeholder="e.g. @apexdigital.com"
              className="form-input"
              value={filters.email}
              onChange={handleFilterChange}
            />
          </div>

          {/* Filter by Address */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Filter by Location / Address</label>
            <input
              type="text"
              name="address"
              placeholder="e.g. Silicon Bay"
              className="form-input"
              value={filters.address}
              onChange={handleFilterChange}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
          <Button type="button" variant="secondary" size="sm" onClick={handleClearFilters}>
            Clear Filters
          </Button>
          <Button type="submit" variant="primary" size="sm" icon={Search} loading={loading}>
            Apply Filters
          </Button>
        </div>
      </form>

      {/* Stores Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
            Registered Stores ({meta.totalItems || stores.length})
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#f8fafc',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '2px 6px',
                fontSize: '0.8rem'
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {stores.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <Store size={40} color="var(--text-subtle)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>No Stores Found</h3>
            <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto' }}>
              No registered store listings match your selected filter criteria. Try resetting your search filters.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-subtle)' }}>
                  <th
                    onClick={() => handleSort('name')}
                    style={{ padding: '0.85rem 1rem', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Store Name {renderSortIcon('name')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('email')}
                    style={{ padding: '0.85rem 1rem', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Email {renderSortIcon('email')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('address')}
                    style={{ padding: '0.85rem 1rem', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Address {renderSortIcon('address')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('rating')}
                    style={{ padding: '0.85rem 1rem', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Overall Rating {renderSortIcon('rating')}
                    </div>
                  </th>
                  <th style={{ padding: '0.85rem 1rem' }}>
                    Assigned Owner
                  </th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((s) => {
                  const rating = s.averageRating ?? s.overall_rating ?? 0.0;
                  const count = s.ratingCount ?? 0;
                  return (
                    <tr
                      key={s.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#f8fafc' }}>
                        {s.name}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-color)' }}>
                        {s.email}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-subtle)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.address}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Star size={14} fill={rating > 0 ? '#fbbf24' : 'none'} color="#fbbf24" />
                          <strong style={{ color: '#fbbf24', fontSize: '0.9rem' }}>
                            {rating > 0 ? Number(rating).toFixed(1) : 'No ratings'}
                          </strong>
                          {count > 0 && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                              ({count})
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                          <User size={10} style={{ marginRight: '3px' }} />
                          {s.owner_name || `Owner #${s.owner_id}`}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStore(s);
                            setIsDetailModalOpen(true);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          <Eye size={12} /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {meta.totalPages > 1 && (
          <div style={{
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
              Showing Page <strong>{meta.currentPage}</strong> of <strong>{meta.totalPages}</strong> ({meta.totalItems} total stores)
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                <ChevronLeft size={14} /> Previous
              </Button>

              {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span style={{ color: 'var(--text-subtle)', padding: '0 4px' }}>...</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setPage(p)}
                      className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ minWidth: '32px', padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}

              <Button
                variant="secondary"
                size="sm"
                disabled={page >= meta.totalPages || loading}
                onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))}
              >
                Next <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Store Modal */}
      <AddStoreModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onStoreCreated={() => {
          fetchStores();
        }}
      />

      {/* Store Details Modal */}
      <StoreDetailsModal
        store={selectedStore}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedStore(null);
        }}
      />
    </div>
  );
};
