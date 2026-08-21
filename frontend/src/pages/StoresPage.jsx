import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, Star, MapPin, Search, Sparkles, Filter, RefreshCw } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const StoresPage = () => {
  const { isNormalUser, isAuthenticated } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  const fetchStores = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      const response = await api.get('/stores', { params });
      if (response?.data?.stores) {
        setStores(response.data.stores);
      }
    } catch (err) {
      setError(err.message || 'Failed to load store catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStores();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-primary">Verified Marketplace</span>
            <span className="badge badge-success">Public Catalog</span>
          </div>
          <h1 style={{ fontSize: '2rem' }}>Explore & Rate Stores</h1>
          <p style={{ fontSize: '0.95rem' }}>Browse local merchants, evaluate ratings, and share your customer feedback.</p>
        </div>

        {isAuthenticated && isNormalUser && (
          <Link to="/user" className="btn btn-secondary btn-sm">
            View My Ratings History
          </Link>
        )}
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="glass-card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search stores by name, address, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <Button type="submit" variant="primary" icon={Search} loading={loading}>
            Search Stores
          </Button>
          {search && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSearch('');
                fetchStores();
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </form>

      {/* Stores Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem' }}>Available Stores ({stores.length})</h2>
        </div>

        {stores.length === 0 && !loading ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <Store size={40} color="var(--text-subtle)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Stores Found</h3>
            <p style={{ color: 'var(--text-subtle)', fontSize: '0.9rem' }}>
              No stores matched your search query. Try clearing your search or checking back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-3">
            {stores.map((store) => (
              <div key={store.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>{store.name}</h3>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: 'rgba(245, 158, 11, 0.15)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '8px',
                      color: '#fbbf24',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}>
                      <Star size={13} fill="#fbbf24" />
                      <span>{store.averageRating ? Number(store.averageRating).toFixed(1) : 'New'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-subtle)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                    <MapPin size={13} />
                    <span>{store.address}</span>
                  </div>

                  {store.owner_name && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: '0.5rem' }}>
                      Merchant: <span style={{ color: '#e2e8f0' }}>{store.owner_name}</span>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                    {store.ratingCount || 0} customer reviews
                  </span>
                  {isAuthenticated && isNormalUser ? (
                    <Link to="/user" className="btn btn-primary btn-sm" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
                      Rate Store
                    </Link>
                  ) : (
                    <Link to="/login" className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
                      Sign In to Rate
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
