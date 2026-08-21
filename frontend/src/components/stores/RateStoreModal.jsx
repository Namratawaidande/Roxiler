import React, { useState, useEffect } from 'react';
import { Star, X, Check, MessageSquare, Store, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import api from '../../services/api';

export const RateStoreModal = ({ store, isOpen, onClose, onRatingSubmitted }) => {
  if (!isOpen || !store) return null;

  const isEditing = store.myRating !== null && store.myRating !== undefined;
  const [ratingValue, setRatingValue] = useState(store.myRating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(store.myComment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    setRatingValue(store.myRating || 5);
    setComment(store.myComment || '');
    setError(null);
    setSuccess(null);
  }, [store]);

  const ratingDescriptions = {
    1: '1 Star — Poor (Needs Improvement)',
    2: '2 Stars — Fair (Below Expectations)',
    3: '3 Stars — Good (Satisfactory Experience)',
    4: '4 Stars — Very Good (Highly Recommended)',
    5: '5 Stars — Exceptional (Outstanding Quality & Service)'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent duplicate clicks while in flight

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let res;
      if (isEditing) {
        // State B: Modify Existing Rating (PUT /api/v1/ratings/:storeId)
        res = await api.put(`/ratings/${store.id}`, {
          rating: ratingValue,
          comment: comment.trim() || undefined
        });
      } else {
        // State A: Submit New Rating (POST /api/v1/ratings)
        res = await api.post('/ratings', {
          storeId: store.id,
          rating: ratingValue,
          comment: comment.trim() || undefined
        });
      }

      const returnedRating = res?.data?.rating;
      setSuccess(
        isEditing
          ? 'Your rating has been updated successfully!'
          : 'Thank you! Your rating has been submitted successfully.'
      );

      // Optimistic update callback
      setTimeout(() => {
        if (onRatingSubmitted) {
          onRatingSubmitted({
            storeId: store.id,
            rating: ratingValue,
            comment: comment.trim(),
            storeAverageRating: returnedRating?.storeAverageRating,
            storeRatingCount: returnedRating?.storeRatingCount
          });
        }
        onClose();
      }, 700);
    } catch (err) {
      setError(err.message || 'Failed to process rating. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(2, 6, 23, 0.90)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1.5rem',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#0d1322',
          border: '1px solid rgba(251, 191, 36, 0.35)',
          borderRadius: '16px',
          padding: '1.75rem',
          position: 'relative',
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.95), 0 0 45px rgba(251, 191, 36, 0.15)',
          maxHeight: 'calc(100vh - 3rem)',
          overflowY: 'auto',
          margin: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Star size={18} color="#000" fill="#000" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
                {isEditing ? 'Modify Your Rating' : 'Submit Store Rating'}
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', margin: 0 }}>
                {store.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {success && <Alert type="success" message={success} />}

        {/* Store Summary Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>STORE LOCATION</div>
            <div style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 500 }}>{store.address}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>OVERALL RATING</div>
            <div style={{ fontSize: '0.9rem', color: '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Star size={13} fill="#fbbf24" />
              {Number(store.averageRating || store.overall_rating || 0).toFixed(1)} / 5.0
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Interactive Star Picker */}
          <div style={{
            textAlign: 'center',
            padding: '1.25rem',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
            borderRadius: '10px',
            border: '1px solid rgba(245, 158, 11, 0.25)'
          }}>
            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-color)' }}>
              Select Your Rating (1 to 5 Stars)
            </label>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = (hoverRating || ratingValue) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingValue(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    disabled={loading}
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      padding: '4px',
                      transform: isActive ? 'scale(1.2)' : 'scale(1)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <Star
                      size={36}
                      color="#fbbf24"
                      fill={isActive ? '#fbbf24' : 'transparent'}
                      style={{ filter: isActive ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))' : 'none' }}
                    />
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fbbf24', minHeight: '1.2rem' }}>
              {ratingDescriptions[hoverRating || ratingValue]}
            </div>
          </div>

          {/* Optional Review Comment */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MessageSquare size={13} /> Optional Review Feedback (Max 400 chars)
            </label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Share your thoughts about this store's customer service, quality, or experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={400}
              disabled={loading}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={loading} disabled={loading} icon={Check}>
              {isEditing ? 'Update Rating' : 'Submit Rating'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
