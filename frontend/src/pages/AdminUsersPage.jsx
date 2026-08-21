import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  RefreshCw,
  X,
  Shield,
  MapPin,
  Mail
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { Pagination } from '../components/common/Pagination';
import { AddUserModal } from '../components/admin/AddUserModal';
import { UserDetailsModal } from '../components/admin/UserDetailsModal';
import { ParticleCard } from '../components/common/MagicBento';
import { useDebounce } from '../hooks/useDebounce';
import api from '../services/api';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ totalItems: 0, totalPages: 1, currentPage: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter Input States
  const [filters, setFilters] = useState({
    search: '',
    name: '',
    email: '',
    address: '',
    role: ''
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
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Server-side query execution with full state synchronization
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit,
        sortBy: sort.sortBy,
        order: sort.order
      };

      if (filters.role) params.role = filters.role;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (debouncedName.trim()) params.name = debouncedName.trim();
      if (debouncedEmail.trim()) params.email = debouncedEmail.trim();
      if (debouncedAddress.trim()) params.address = debouncedAddress.trim();

      const response = await api.get('/users', { params });
      if (response?.data?.users) {
        setUsers(response.data.users);
        if (response.meta) {
          setMeta(response.meta);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort.sortBy, sort.order, filters.role, debouncedSearch, debouncedName, debouncedEmail, debouncedAddress]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, debouncedName, debouncedEmail, debouncedAddress, filters.role]);

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
      address: '',
      role: ''
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
        order: 'ASC'
      };
    });
    setPage(1);
  };

  const renderSortIcon = (column) => {
    if (sort.sortBy !== column) {
      return <ArrowUpDown size={12} color="var(--text-subtle)" style={{ marginLeft: '4px' }} />;
    }
    return sort.order === 'ASC' ? (
      <ArrowUp size={12} color="#818cf8" style={{ marginLeft: '4px' }} />
    ) : (
      <ArrowDown size={12} color="#818cf8" style={{ marginLeft: '4px' }} />
    );
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SYSTEM_ADMIN':
        return <span className="badge badge-primary">SYSTEM_ADMIN</span>;
      case 'STORE_OWNER':
        return <span className="badge badge-warning">STORE_OWNER</span>;
      case 'NORMAL_USER':
      default:
        return <span className="badge badge-success">NORMAL_USER</span>;
    }
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.name || filters.email || filters.address || filters.role
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
          <h1 style={{ fontSize: '2rem' }}>User Management Directory</h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="secondary" size="sm" icon={RefreshCw} loading={loading} onClick={fetchUsers}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" icon={UserPlus} onClick={() => setIsAddModalOpen(true)}>
            Add New User
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Multi-Dimensional Filter Card */}
      <ParticleCard className="glass-card" glowColor="99, 102, 241" enableTilt={false} enableBorderGlow={true} style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={14} /> Filters
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              <X size={12} /> Clear All Filters
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {/* Quick Search */}
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
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Filter by Name</label>
            <input
              type="text"
              name="name"
              placeholder="e.g. John"
              className="form-input"
              value={filters.name}
              onChange={handleFilterChange}
            />
          </div>

          {/* Filter by Email */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Filter by Email</label>
            <input
              type="text"
              name="email"
              placeholder="e.g. @example.com"
              className="form-input"
              value={filters.email}
              onChange={handleFilterChange}
            />
          </div>

          {/* Filter by Address */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Filter by Address</label>
            <input
              type="text"
              name="address"
              placeholder="e.g. Springfield"
              className="form-input"
              value={filters.address}
              onChange={handleFilterChange}
            />
          </div>

          {/* Filter by Role Dropdown */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Filter by Role</label>
            <select
              name="role"
              className="form-input"
              value={filters.role}
              onChange={handleFilterChange}
              style={{ background: 'rgba(15, 23, 42, 0.9)' }}
            >
              <option value="">All Roles</option>
              <option value="SYSTEM_ADMIN">SYSTEM_ADMIN</option>
              <option value="STORE_OWNER">STORE_OWNER</option>
              <option value="NORMAL_USER">NORMAL_USER</option>
            </select>
          </div>
        </div>
      </ParticleCard>

      {/* Users Table */}
      <ParticleCard className="glass-card" glowColor="99, 102, 241" enableTilt={false} enableBorderGlow={true} style={{ padding: 0, overflow: 'hidden' }}>
        {users.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <Users size={40} color="var(--text-subtle)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>No Matching Users</h3>
            <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto' }}>
              No registered user records match your active search filters.
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
                      Name {renderSortIcon('name')}
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
                    onClick={() => handleSort('role')}
                    style={{ padding: '0.85rem 1rem', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Role {renderSortIcon('role')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('created_at')}
                    style={{ padding: '0.85rem 1rem', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Joined {renderSortIcon('created_at')}
                    </div>
                  </th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#f8fafc' }}>
                      {u.name}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-color)' }}>
                      {u.email}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-subtle)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.address || '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {getRoleBadge(u.role)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-subtle)', fontSize: '0.8rem' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(u);
                          setIsDetailModalOpen(true);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        <Eye size={12} /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination */}
        <Pagination
          currentPage={meta.currentPage || page}
          totalPages={meta.totalPages || 1}
          totalItems={meta.totalItems || users.length}
          limit={limit}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          loading={loading}
          itemName="registered users"
        />
      </ParticleCard>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserCreated={() => {
          fetchUsers();
        }}
      />

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
};
