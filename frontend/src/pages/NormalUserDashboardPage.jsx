import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Star,
  Store,
  MapPin,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Edit3,
  ThumbsUp,
  X,
  Building,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { Pagination } from '../components/common/Pagination';
import { RateStoreModal } from '../components/stores/RateStoreModal';
import { useDebounce } from '../hooks/useDebounce';
import api from '../services/api';

export const NormalUserDashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'history'

  // Dashboard Summary State
  const [dashboardData, setDashboardData] = useState({ totalRatingsSubmitted: 0, myRatings: [] });
  const [dashLoading, setDashLoading] = useState(true);

  // Store Catalog State
  const [stores, setStores] = useState([]);
  const [meta, setMeta] = useState({ totalItems: 0, totalPages: 1, currentPage: 1, limit: 10 });
  const [storesLoading, setStoresLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [filters, setFilters] = useState({
    search: '',
    name: '',
    address: ''
  });

  const debouncedSearch = useDebounce(filters.search, 300);
  const debouncedName = useDebounce(filters.name, 300);
  const debouncedAddress = useDebounce(filters.address, 300);

  // Sorting & Pagination State
  const [sortBy, setSortBy] = useState('rating');
  const [order, setOrder] = useState('DESC');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Rate Modal State
  const [selectedStoreToRate, setSelectedStoreToRate] = useState(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);

  // 1. Fetch User Dashboard Stats
  const fetchDashboardStats = async () => {
    setDashLoading(true);
    try {
      const response = await api.get('/dashboard/user');
      if (response?.data) {
        setDashboardData({
          totalRatingsSubmitted: response.data.totalRatingsSubmitted || 0,
          myRatings: response.data.myRatings || []
        });
      }
    } catch {
      // Fallback
    } finally {
      setDashLoading(false);
    }
  };

  // 2. Fetch Stores Catalog
  const fetchStores = useCallback(async () => {
    setStoresLoading(true);
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
      setError(err.message || 'Failed to load stores catalog.');
    } finally {
      setStoresLoading(false);
    }
  }, [page, limit, sortBy, order, debouncedSearch, debouncedName, debouncedAddress]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

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
    setFilters({ search: '', name: '', address: '' });
    setPage(1);
  };

  const handleRatingUpdated = (updatedInfo) => {
    // Optimistically update store card
    setStores((prev) =>
      prev.map((s) => {
        if (s.id === updatedInfo.storeId) {
          const newAvg = updatedInfo.storeAverageRating ?? s.averageRating;
          const newCount = updatedInfo.storeRatingCount ?? (s.myRating ? s.ratingCount : s.ratingCount + 1);
          return {
            ...s,
            myRating: updatedInfo.rating,
            userSubmittedRating: updatedInfo.rating,
            myComment: updatedInfo.comment,
            averageRating: newAvg,
            overall_rating: newAvg,
            ratingCount: newCount
          };
        }
        return s;
      })
    );

    // Refresh user dashboard metrics
    fetchDashboardStats();
  };

  const hasActiveFilters = Boolean(filters.search || filters.name || filters.address);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <User size={12} /> CUSTOMER PORTAL
            </span>
            <span className="badge badge-primary">Account: {user?.name || user?.email}</span>
          </div>
          <h1 style={{ fontSize: '2rem' }}>Customer Ratings & Store Explorer</h1>
          <p style={{ fontSize: '0.95rem' }}>
            Browse registered stores, inspect verified community ratings, and submit or modify your personal feedback.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="secondary" size="sm" icon={RefreshCw} loading={storesLoading || dashLoading} onClick={() => { fetchDashboardStats(); fetchStores(); }}>
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* KPI Activity Banner */}
      <div className="grid grid-3" style={{ gap: '1rem' }}>
        <div className="kpi-card glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-label">RATINGS SUBMITTED</div>
              <div className="kpi-value" style={{ color: '#34d399' }}>
                {dashboardData.totalRatingsSubmitted}
              </div>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '12px' }}>
              <CheckCircle2 size={22} color="#34d399" />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '0.5rem' }}>
            Total merchant reviews submitted by your account
          </div>
        </div>

        <div className="kpi-card glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-label">AVAILABLE STORES</div>
              <div className="kpi-value" style={{ color: '#6366f1' }}>
                {meta.totalItems || stores.length}
              </div>
            </div>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '10px', borderRadius: '12px' }}>
              <Store size={22} color="#818cf8" />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '0.5rem' }}>
            Verified platform merchants open for community ratings
          </div>
        </div>

        <div className="kpi-card glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-label">REVIEW STATUS</div>
              <div className="kpi-value" style={{ color: '#fbbf24' }}>
                {dashboardData.totalRatingsSubmitted > 0 ? 'Active Reviewer' : 'New Member'}
              </div>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '10px', borderRadius: '12px' }}>
              <Sparkles size={22} color="#fbbf24" />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '0.5rem' }}>
            {dashboardData.totalRatingsSubmitted > 0 ? 'Your reviews are helping the community' : 'Submit your first store rating below'}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('browse')}
          className={`btn btn-sm ${activeTab === 'browse' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Store size={14} /> Explore Stores Catalog ({meta.totalItems || stores.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Star size={14} /> Your Rating History ({dashboardData.totalRatingsSubmitted})
        </button>
      </div>

      {/* ----------------- TAB 1: BROWSE STORES ----------------- */}
      {activeTab === 'browse' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Filters Card */}
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
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Keyword Search</label>
                <input
                  type="text"
                  name="search"
                  placeholder="Search across all fields..."
                  className="form-input"
                  value={filters.search}
                  onChange={handleFilterChange}
                />
              </div>

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
          {stores.length === 0 && !storesLoading ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
              <Store size={48} color="var(--text-subtle)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>No Matching Stores Found</h3>
              <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto' }}>
                No stores match your current filters. Try broadening your search query.
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
                      {/* Name & Community Rating */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                            {s.name}
                          </h3>
                          {s.email && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                              {s.email}
                            </div>
                          )}
                        </div>

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

                      {/* Location Address */}
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={13} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.address}
                        </span>
                      </div>

                      {/* Feedback Count */}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        Community Feedback: <strong>{reviewCount} review{reviewCount === 1 ? '' : 's'}</strong>
                      </div>
                    </div>

                    {/* Personal Rating Status & Action */}
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
              loading={storesLoading}
              itemName="registered stores"
            />
          </div>
        </div>
      )}

      {/* ----------------- TAB 2: MY RATING HISTORY ----------------- */}
      {activeTab === 'history' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star size={18} color="#fbbf24" fill="#fbbf24" /> Your Submitted Store Reviews ({dashboardData.myRatings.length})
          </h2>

          {dashboardData.myRatings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-subtle)' }}>
              <Star size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
              <p>You haven't submitted any store ratings yet.</p>
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className="btn btn-primary btn-sm"
                style={{ marginTop: '0.5rem' }}
              >
                Browse & Rate Stores Now
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {dashboardData.myRatings.map((review) => (
                <div
                  key={review.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                      {review.storeName}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <MapPin size={11} /> {review.storeAddress}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            fill={review.rating >= star ? '#fbbf24' : 'none'}
                            color="#fbbf24"
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24' }}>
                        {review.rating} / 5 Stars
                      </span>
                    </div>

                    {review.comment && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-color)', marginTop: '0.5rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.5rem', borderRadius: '6px', fontStyle: 'italic', margin: '0.5rem 0 0' }}>
                        "{review.comment}"
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Calendar size={11} /> {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Recent'}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Edit3}
                      onClick={() => {
                        const targetStore = stores.find((s) => s.id === review.storeId) || {
                          id: review.storeId,
                          name: review.storeName,
                          address: review.storeAddress,
                          myRating: review.rating,
                          myComment: review.comment
                        };
                        setSelectedStoreToRate(targetStore);
                        setIsRateModalOpen(true);
                      }}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                    >
                      Modify Rating
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
