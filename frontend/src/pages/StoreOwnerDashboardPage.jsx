import React, { useState, useEffect, useCallback } from 'react';
import {
  Store,
  Star,
  MapPin,
  Mail,
  Users,
  RefreshCw,
  TrendingUp,
  Award,
  Search,
  Filter,
  Calendar,
  MessageSquare,
  Building,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { Pagination } from '../components/common/Pagination';
import { useDebounce } from '../hooks/useDebounce';
import api from '../services/api';

export const StoreOwnerDashboardPage = () => {
  const { user } = useAuth();

  // Dashboard Overview & Stats State
  const [dashboardData, setDashboardData] = useState({
    stores: [],
    totalStores: 0,
    totalRatings: 0,
    averageRating: 0.0,
    overallRating: 0.0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [dashLoading, setDashLoading] = useState(true);
  const [error, setError] = useState(null);

  // Customer Reviews Table State
  const [ratingsList, setRatingsList] = useState([]);
  const [ratingsMeta, setRatingsMeta] = useState({ page: 1, totalPages: 1, totalItems: 0, pageSize: 10 });
  const [ratingsLoading, setRatingsLoading] = useState(true);

  // Table Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [starFilter, setStarFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('DESC');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // 1. Fetch Dashboard Metrics & Store Details from Live Express Endpoints
  const fetchDashboardMetrics = async () => {
    setDashLoading(true);
    setError(null);

    try {
      // Parallel requests to /dashboard/owner and /ratings/owner/stats
      const [dashRes, statsRes] = await Promise.all([
        api.get('/dashboard/owner').catch(() => null),
        api.get('/ratings/owner/stats').catch(() => null)
      ]);

      const d = dashRes?.data || {};
      const s = statsRes?.data || {};

      const combinedStores = s.stores || d.stores || d.myStores || [];
      const totalRatings = s.totalRatings !== undefined ? s.totalRatings : (d.totalRatingsReceived || d.totalRatings || 0);
      const averageRating = Number(s.averageRating !== undefined ? s.averageRating : (d.averageRating || d.overallRating || 0.0));
      const ratingDistribution = s.ratingDistribution || d.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

      setDashboardData({
        stores: combinedStores,
        totalStores: s.totalStores || combinedStores.length,
        totalRatings,
        averageRating,
        overallRating: averageRating,
        ratingDistribution
      });
    } catch (err) {
      setError(err.message || 'Failed to load merchant dashboard metrics. Please check your connection.');
    } finally {
      setDashLoading(false);
    }
  };

  // 2. Fetch Paginated Customer Reviews from Live Express Endpoint
  const fetchCustomerRatings = useCallback(async () => {
    setRatingsLoading(true);

    try {
      const params = {
        page,
        limit,
        sortBy,
        order
      };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const response = await api.get('/ratings/owner', { params });
      if (response?.data?.ratings) {
        let fetchedRatings = response.data.ratings;
        if (starFilter !== 'ALL') {
          const filterNum = parseInt(starFilter, 10);
          fetchedRatings = fetchedRatings.filter((r) => r.rating === filterNum || r.ratingValue === filterNum);
        }
        setRatingsList(fetchedRatings);

        if (response.meta) {
          const m = response.meta.pagination || response.meta;
          setRatingsMeta({
            page: m.page || page,
            pageSize: m.pageSize || m.limit || limit,
            totalItems: m.totalItems || fetchedRatings.length,
            totalPages: m.totalPages || 1
          });
        }
      }
    } catch {
      // Keep existing list on transient network error
    } finally {
      setRatingsLoading(false);
    }
  }, [page, limit, sortBy, order, debouncedSearch, starFilter]);

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  useEffect(() => {
    fetchCustomerRatings();
  }, [fetchCustomerRatings]);

  // Reset page when search or star filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, starFilter]);

  const totalRatingsCount = dashboardData.totalRatings || 0;
  const dist = dashboardData.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const positiveRatings = (dist[5] || 0) + (dist[4] || 0);
  const satisfactionRate = totalRatingsCount > 0 ? Math.round((positiveRatings / totalRatingsCount) * 100) : 0;

  const primaryStore = dashboardData.stores[0] || {
    name: user?.name ? `${user.name}'s Store` : 'Your Registered Store',
    email: user?.email || 'merchant@storerating.com',
    address: 'Store Address Registered on Platform'
  };

  const getPerformanceLabel = (avg) => {
    if (avg >= 4.5) return 'Exceptional Quality';
    if (avg >= 4.0) return 'Highly Rated Store';
    if (avg >= 3.0) return 'Satisfactory Rating';
    if (avg > 0) return 'Needs Improvement';
    return 'New Merchant Store';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Store size={12} /> STORE_OWNER AREA
            </span>
            <span className="badge badge-success">Merchant: {user?.name || user?.email}</span>
          </div>
          <h1 style={{ fontSize: '2rem' }}>Merchant Performance Dashboard</h1>
          <p style={{ fontSize: '0.95rem' }}>
            Real-time PostgreSQL analytics, store rating performance, and customer review insights.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={dashLoading || ratingsLoading}
            onClick={() => {
              fetchDashboardMetrics();
              fetchCustomerRatings();
            }}
          >
            Refresh Analytics
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* 1. STORE INFORMATION OVERVIEW */}
      <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '120px',
          height: '120px',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
              padding: '16px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)'
            }}>
              <Building size={32} color="#ffffff" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                  {primaryStore.name}
                </h2>
                <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                  <ShieldCheck size={11} style={{ marginRight: '3px' }} /> Verified Merchant
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--text-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={14} color="#818cf8" />
                  <span>{primaryStore.address}</span>
                </div>

                {primaryStore.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Mail size={14} color="#818cf8" />
                    <span>{primaryStore.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '0.75rem 1.25rem',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Performance Rating Status
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fbbf24', marginTop: '2px' }}>
              {getPerformanceLabel(dashboardData.averageRating)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. RATING SUMMARY KPI CARDS */}
      <div className="grid grid-3" style={{ gap: '1rem' }}>
        {/* KPI 1: Average Rating */}
        <div className="kpi-card glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-label">STORE AVERAGE RATING</div>
              <div className="kpi-value" style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Star size={24} fill="#fbbf24" color="#fbbf24" />
                {dashboardData.averageRating > 0 ? dashboardData.averageRating.toFixed(1) : '0.0'}
                <span style={{ fontSize: '1rem', color: 'var(--text-subtle)', fontWeight: 400 }}>/ 5.0</span>
              </div>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '10px', borderRadius: '12px' }}>
              <Award size={22} color="#fbbf24" />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.75rem' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={14}
                fill={dashboardData.averageRating >= star ? '#fbbf24' : dashboardData.averageRating >= star - 0.5 ? '#f59e0b' : 'none'}
                color="#fbbf24"
              />
            ))}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginLeft: '6px' }}>
              Calculated across all reviews
            </span>
          </div>
        </div>

        {/* KPI 2: Total Ratings Received */}
        <div className="kpi-card glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-label">TOTAL RATINGS RECEIVED</div>
              <div className="kpi-value" style={{ color: '#6366f1' }}>
                {totalRatingsCount}
              </div>
            </div>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '10px', borderRadius: '12px' }}>
              <Users size={22} color="#818cf8" />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '0.75rem' }}>
            Verified customer ratings submitted for your store
          </div>
        </div>

        {/* KPI 3: Satisfaction Rate */}
        <div className="kpi-card glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-label">CUSTOMER SATISFACTION</div>
              <div className="kpi-value" style={{ color: '#34d399' }}>
                {satisfactionRate}%
              </div>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '12px' }}>
              <TrendingUp size={22} color="#34d399" />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '0.75rem' }}>
            Percentage of 4-star and 5-star customer reviews
          </div>
        </div>
      </div>

      {/* 3. RATING DISTRIBUTION PROGRESS VISUALIZATION */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} color="#818cf8" /> Rating Distribution Breakdown
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginBottom: '1.5rem' }}>
          Review frequency across individual star ratings (1 to 5 Stars).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = dist[star] || 0;
            const pct = totalRatingsCount > 0 ? Math.round((count / totalRatingsCount) * 100) : 0;
            const barColors = {
              5: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
              4: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
              3: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
              2: 'linear-gradient(90deg, #f97316 0%, #fb923c 100%)',
              1: 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)'
            };

            return (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '70px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-color)' }}>
                  <span>{star}</span>
                  <Star size={13} fill="#fbbf24" color="#fbbf24" />
                </div>

                <div style={{
                  flex: 1,
                  height: '14px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: barColors[star],
                    borderRadius: '10px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>

                <div style={{ width: '90px', textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
                  <strong style={{ color: '#f8fafc' }}>{count}</strong> ({pct}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. USERS WHO RATED THE STORE (TABLE & CONTROLS) */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="#818cf8" /> Customers Who Rated Your Store
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', margin: '2px 0 0' }}>
              List of verified customers who have submitted feedback for your store.
            </p>
          </div>

          {/* Star Filter Pills */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {['ALL', '5', '4', '3', '2', '1'].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setStarFilter(val)}
                className={`btn btn-sm ${starFilter === val ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
              >
                {val === 'ALL' ? 'All Ratings' : `${val} ★`}
              </button>
            ))}
          </div>
        </div>

        {/* Live Search & Sort Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              placeholder="Search by customer name or email..."
              className="form-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.2rem' }}
            />
          </div>

          <div>
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
              <option value="createdAt_DESC">Date: Newest First</option>
              <option value="createdAt_ASC">Date: Oldest First</option>
              <option value="rating_DESC">Rating: Highest First</option>
              <option value="rating_ASC">Rating: Lowest First</option>
              <option value="userName_ASC">Customer Name (A–Z)</option>
              <option value="userName_DESC">Customer Name (Z–A)</option>
              <option value="userEmail_ASC">Customer Email (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Ratings Table */}
        {ratingsList.length === 0 && !ratingsLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-subtle)' }}>
            <Users size={40} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>No Ratings Match Your Filters</h3>
            <p style={{ fontSize: '0.85rem', maxWidth: '380px', margin: '0 auto' }}>
              {searchTerm || starFilter !== 'ALL'
                ? 'Try clearing your search query or selecting "All Ratings".'
                : 'Your store has not received ratings yet. Once customers rate your store, their reviews will appear here.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer Name & Email</th>
                  <th>Customer Address</th>
                  <th>Submitted Rating</th>
                  <th>Review Feedback</th>
                  <th>Date Submitted</th>
                </tr>
              </thead>
              <tbody>
                {ratingsList.map((review) => (
                  <tr key={review.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                        {review.userName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                        {review.userEmail}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} /> {review.userAddress || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <div style={{ display: 'flex' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              fill={(review.rating || review.ratingValue) >= star ? '#fbbf24' : 'none'}
                              color="#fbbf24"
                            />
                          ))}
                        </div>
                        <strong style={{ fontSize: '0.85rem', color: '#fbbf24' }}>
                          {review.rating || review.ratingValue}★
                        </strong>
                      </div>
                    </td>
                    <td>
                      {review.comment ? (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-color)', fontStyle: 'italic', maxWidth: '280px' }}>
                          "{review.comment}"
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>No comment</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        {review.createdAt || review.created_at ? new Date(review.createdAt || review.created_at).toLocaleDateString() : 'Recent'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div style={{ marginTop: '1rem' }}>
          <Pagination
            currentPage={ratingsMeta.page}
            totalPages={ratingsMeta.totalPages}
            totalItems={ratingsMeta.totalItems}
            limit={limit}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            loading={ratingsLoading}
            itemName="customer ratings"
          />
        </div>
      </div>
    </div>
  );
};
