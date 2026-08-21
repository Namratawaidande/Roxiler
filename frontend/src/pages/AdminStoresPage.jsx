import React, { useState, useEffect, useCallback } from 'react';
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
  X
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { Pagination } from '../components/common/Pagination';
import { AddStoreModal } from '../components/admin/AddStoreModal';
import { StoreDetailsModal } from '../components/admin/StoreDetailsModal';
import { useDebounce } from '../hooks/useDebounce';
import api from '../services/api';

export const AdminStoresPage = () => {
  const [stores, setStores] = useState([]);
  const [meta, setMeta] = useState({ totalItems: 0, totalPages: 1, currentPage: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter Input States
  const [filters, setFilters] = useState({
    search: '',
    name: '',
    email: '',
    address: ''
  });

  // Debounced filter values for smooth server querying
  const debouncedSearch = useDebounce(filters.search, 300);
  const debouncedName = useDebounce(filters.name, 300);
  const debouncedEmail = useDebounce(filters.email, 300);
  const debouncedAddress = useDebounce(filters.address, 300);

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

  // Server-side query execution with full state synchronization
  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit,
        sortBy: sort.sortBy,
        order: sort.order
      };

      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (debouncedName.trim()) params.name = debouncedName.trim();
      if (debouncedEmail.trim()) params.email = debouncedEmail.trim();
      if (debouncedAddress.trim()) params.address = debouncedAddress.trim();

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
  }, [page, limit, sort.sortBy, sort.order, debouncedSearch, debouncedName, debouncedEmail, debouncedAddress]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, debouncedName, debouncedEmail, debouncedAddress]);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
    setSort((prev) => {
      if (prev.sortBy === column) {
        return {
          sortBy: column,
          order: prev.order === 'ASC' ? 'DESC' : 'ASC'
        };
      }
      return {
        sortBy: column,
        order: column === 'rating' ? 'DESC' : 'ASC'
      };
    });
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

  const hasActiveFilters = Boolean(
    filters.search || filters.name || filters.email || filters.address
  );

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
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={14} /> Filters
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              style={{ background: 'none', border: 'none', color: '#06b6d4', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              <X size={12} /> Clear All Filters
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
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
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Filter by Location</label>
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
      </div>

      {/* Stores Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {stores.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <Store size={40} color="var(--text-subtle)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>No Matching Stores</h3>
            <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto' }}>
              No registered store listings match your active search filters.
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

        {/* Server-Side Pagination */}
        <Pagination
          currentPage={meta.currentPage || page}
          totalPages={meta.totalPages || 1}
          totalItems={meta.totalItems || stores.length}
          limit={limit}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          loading={loading}
          itemName="registered stores"
        />
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
