-- ==============================================================================
-- Store Rating Platform - Normalized PostgreSQL Database Schema (3NF)
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. ENUMS & DATA TYPES
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER');
    END IF;
END$$;

-- ==============================================================================
-- 2. USERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL CHECK (LENGTH(TRIM(name)) >= 3 AND LENGTH(TRIM(name)) <= 60),
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    password_hash VARCHAR(255) NOT NULL,
    address VARCHAR(400) CHECK (address IS NULL OR LENGTH(TRIM(address)) <= 400),
    role user_role NOT NULL DEFAULT 'NORMAL_USER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==============================================================================
-- 3. STORES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL CHECK (LENGTH(TRIM(name)) >= 2 AND LENGTH(TRIM(name)) <= 60),
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    address VARCHAR(400) NOT NULL CHECK (LENGTH(TRIM(address)) >= 3 AND LENGTH(TRIM(address)) <= 400),
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==============================================================================
-- 4. RATINGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    rating_value INTEGER NOT NULL CHECK (rating_value >= 1 AND rating_value <= 5),
    comment TEXT CHECK (comment IS NULL OR LENGTH(comment) <= 1000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_user_store_rating UNIQUE (user_id, store_id)
);

-- ==============================================================================
-- 5. PERFORMANCE & COMPOSITE INDEXES
-- ==============================================================================
-- Fast user lookups & filtering by email, role, name and creation date
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Fast store lookups, searches & owner associations
CREATE INDEX IF NOT EXISTS idx_stores_name ON stores(name);
CREATE INDEX IF NOT EXISTS idx_stores_email ON stores(email);
CREATE INDEX IF NOT EXISTS idx_stores_address ON stores(address);
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_created_at ON stores(created_at DESC);

-- Fast ratings queries, aggregations, user history & score lookups
CREATE INDEX IF NOT EXISTS idx_ratings_store_id ON ratings(store_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rating_value ON ratings(rating_value);
CREATE INDEX IF NOT EXISTS idx_ratings_store_rating ON ratings(store_id, rating_value);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at DESC);

-- ==============================================================================
-- 6. BUSINESS INTEGRITY TRIGGERS & FUNCTIONS
-- ==============================================================================

-- A. Auto-update updated_at timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach updated_at triggers
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_stores_updated_at ON stores;
CREATE TRIGGER trigger_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_ratings_updated_at ON ratings;
CREATE TRIGGER trigger_ratings_updated_at
    BEFORE UPDATE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- B. Role-check constraint trigger: Only NORMAL_USER can submit ratings
CREATE OR REPLACE FUNCTION validate_rating_user_role()
RETURNS TRIGGER AS $$
DECLARE
    user_actual_role user_role;
BEGIN
    SELECT role INTO user_actual_role FROM users WHERE id = NEW.user_id;

    IF user_actual_role IS NULL THEN
        RAISE EXCEPTION 'Cannot rate store: User with ID % does not exist.', NEW.user_id;
    END IF;

    IF user_actual_role <> 'NORMAL_USER' THEN
        RAISE EXCEPTION 'Permission denied: Only users with the NORMAL_USER role are authorized to submit store ratings. Current user role is %.', user_actual_role;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_rating_user_role ON ratings;
CREATE TRIGGER trigger_validate_rating_user_role
    BEFORE INSERT OR UPDATE OF user_id ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION validate_rating_user_role();

-- ==============================================================================
-- 7. MATERIALIZED / OPTIMIZED RATINGS SUMMARY VIEW
-- ==============================================================================
CREATE OR REPLACE VIEW store_ratings_summary AS
SELECT 
    s.id AS store_id,
    s.name AS store_name,
    s.email AS store_email,
    s.address AS store_address,
    s.owner_id,
    u.name AS owner_name,
    s.created_at AS store_created_at,
    COALESCE(ROUND(AVG(r.rating_value)::numeric, 1), 0.0)::float AS average_rating,
    COUNT(r.id)::int AS total_ratings,
    COUNT(CASE WHEN r.rating_value = 5 THEN 1 END)::int AS five_star_count,
    COUNT(CASE WHEN r.rating_value = 4 THEN 1 END)::int AS four_star_count,
    COUNT(CASE WHEN r.rating_value = 3 THEN 1 END)::int AS three_star_count,
    COUNT(CASE WHEN r.rating_value = 2 THEN 1 END)::int AS two_star_count,
    COUNT(CASE WHEN r.rating_value = 1 THEN 1 END)::int AS one_star_count
FROM stores s
LEFT JOIN users u ON s.owner_id = u.id
LEFT JOIN ratings r ON s.id = r.store_id
GROUP BY s.id, u.name;
