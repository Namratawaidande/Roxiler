import React, { useState, useEffect, useCallback } from 'react';
import {
  Store,
  Search,
  Filter,
  Star,
  MapPin,
  Mail,
  ArrowUpDown,
  RefreshCw,
  X,
  Edit3,
  ThumbsUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { Pagination } from '../components/common/Pagination';
import { RateStoreModal } from '../components/stores/RateStoreModal';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const StoreListPage = () => {
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [meta, setMeta] = useState({ totalItems: 0, totalPages: 1, currentPage: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [filters, setFilters] = useState({
    search: '',
    name: '',
    address: ''
  });

  // Debounced filters
  const debouncedSearch = useDebounce(filters.search, 300);
  const debouncedName = useDebounce(filters.name, 300);
  const debouncedAddress = useDebounce(filters.address, 300);

  // Sorting State
  const [sortBy, setSortBy] = useState('rating');
  const [order, setOrder] = useState('DESC');

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Rate Modal State
  const [selectedStoreToRate, setSelectedStoreToRate] = useState(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);

  // Fetch stores list
  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit,
        sortBy,
        order
      };

      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (debouncedName.trim()) params.name = debouncedName.trim();
      if (debouncedAddress.trim()) params.address = debouncedAddress.trim();

      const response = await api.get('/stores', { params });
      if (response?.data?.stores) {
        setStores(response.data.stores);
        if (response.meta) {
          setMeta(response.meta);
        } else if (response.pagination) {
          setMeta(response.pagination);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load store catalog. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, order, debouncedSearch, debouncedName, debouncedAddress]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, debouncedName, debouncedAddress]);

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
      address: ''
    });
    setPage(1);
  };

  const handleRatingUpdated = (updatedInfo) => {
    setStores((prevStores) =>
      prevStores.map((s) => {
        if (s.id === updatedInfo.storeId) {
          return {
            ...s,
            myRating: updatedInfo.rating,
            userSubmittedRating: updatedInfo.rating,
            myComment: updatedInfo.comment
          };
        }
        return s;
      })
    );
  };

  const hasActiveFilters = Boolean(filters.search || filters.name || filters.address);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ThumbsUp size={12} /> VERIFIED DIRECTORY
            </span>
          </div>
          <h1 style={{ fontSize: '2rem' }}>Explore & Rate Stores</h1>
          <p style={{ fontSize: '0.95rem' }}>
            Discover trusted merchant stores, check community reviews, and submit or modify your ratings.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="secondary" size="sm" icon={RefreshCw} loading={loading} onClick={fetchStores}>
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Filter and Sorting Control Bar */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={14} /> Search & Filter Stores
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              <X size={12} /> Clear Filters
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {/* General Search */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>General Search</label>
            <input
              type="text"
              name="search"
              placeholder="Search by keywords..."
              className="form-input"
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>

          {/* Search by Store Name */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Store Name</label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Apex Digital"
              className="form-input"
              value={filters.name}
              onChange={handleFilterChange}
            />
          </div>

          {/* Search by Address */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Location / Address</label>
            <input
              type="text"
              name="address"
              placeholder="e.g. Silicon Bay"
              className="form-input"
              value={filters.address}
              onChange={handleFilterChange}
            />
          </div>

          {/* Sorting Options */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Sort By</label>
            <select
              className="form-input"
              value={`${sortBy}_${order}`}
              onChange={(e) => {
                const [newSort, newOrder] = e.target.value.split('_');
                setSortBy(newSort);
                setOrder(newOrder);
                setPage(1);
              }}
              style={{ background: 'rgba(15, 23, 42, 0.9)' }}
            >
              <option value="rating_DESC">Highest Overall Rating</option>
              <option value="rating_ASC">Lowest Overall Rating</option>
              <option value="name_ASC">Store Name (A–Z)</option>
              <option value="name_DESC">Store Name (Z–A)</option>
              <option value="address_ASC">Address (A–Z)</option>
              <option value="myRating_DESC">Your Highest Rating</option>
              <option value="created_at_DESC">Newest Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stores Card Grid */}
      {stores.length === 0 && !loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Store size={48} color="var(--text-subtle)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>No Matching Stores Found</h3>
          <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto' }}>
            We couldn't find any stores matching your current search parameters. Try adjusting your keywords.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {stores.map((s) => {
            const overallRating = s.averageRating ?? s.overall_rating ?? 0.0;
            const reviewCount = s.ratingCount ?? 0;
            const userRating = s.myRating ?? s.userSubmittedRating ?? null;
            const hasUserRated = userRating !== null && userRating !== undefined;

            return (
              <div
                key={s.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.25rem',
                  position: 'relative',
                  border: hasUserRated ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid var(--border-color)',
                  background: hasUserRated
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(15, 23, 42, 0.7) 100%)'
                    : undefined
                }}
              >
                <div>
                  {/* Store Name & Overall Rating Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                        {s.name}
                      </h3>
                      {s.email && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={11} /> {s.email}
                        </div>
                      )}
                    </div>

                    {/* Overall Rating Star Badge */}
                    <div style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: '#fbbf24',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      whiteSpace: 'nowrap'
                    }}>
                      <Star size={14} fill="#fbbf24" />
                      {overallRating > 0 ? Number(overallRating).toFixed(1) : 'New'}
                    </div>
                  </div>

                  {/* Address */}
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={13} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.address}
                    </span>
                  </div>

                  {/* Community Reviews Count */}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    Community Feedback: <strong>{reviewCount} submitted review{reviewCount === 1 ? '' : 's'}</strong>
                  </div>
                </div>

                {/* User's Rating Status & Action */}
                <div style={{
                  background: hasUserRated ? 'rgba(99, 102, 241, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                  border: hasUserRated ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Your Rating Status
                    </div>
                    {hasUserRated ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                        <div style={{ display: 'flex' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              fill={userRating >= star ? '#fbbf24' : 'none'}
                              color="#fbbf24"
                            />
                          ))}
                        </div>
                        <strong style={{ fontSize: '0.85rem', color: '#fbbf24' }}>
                          {userRating} / 5
                        </strong>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
                        Not Rated Yet
                      </div>
                    )}
                  </div>

                  {/* Rate / Modify Button */}
                  <Button
                    variant={hasUserRated ? 'secondary' : 'primary'}
                    size="sm"
                    icon={hasUserRated ? Edit3 : Star}
                    onClick={() => {
                      setSelectedStoreToRate(s);
                      setIsRateModalOpen(true);
                    }}
                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                  >
                    {hasUserRated ? 'Modify' : 'Rate Store'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="glass-card" style={{ padding: 0 }}>
        <Pagination
          currentPage={meta.currentPage || meta.page || page}
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

      {/* Interactive Rating Modal */}
      <RateStoreModal
        store={selectedStoreToRate}
        isOpen={isRateModalOpen}
        onClose={() => {
          setIsRateModalOpen(false);
          setSelectedStoreToRate(null);
        }}
        onRatingSubmitted={handleRatingUpdated}
      />
    </div>
  );
};
