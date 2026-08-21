# Store Rating Web Application

A robust, scalable full-stack web application for a **Store Rating Platform**, built with React.js, Express.js (3-tier architecture), PostgreSQL, and JWT-based authentication with Role-Based Access Control (RBAC).

---

## 🌟 Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Modern reactive frontend with glassmorphism UI, client-side routing, and real-time backend state |
| **Backend** | Node.js + Express.js | 3-tier Service-Oriented Architecture (`Routes` $\rightarrow$ `Controllers` $\rightarrow$ `Services` $\rightarrow$ `Database`) |
| **Database** | PostgreSQL | 3NF normalized schema with composite unique constraints, triggers, indexes, and summary view |
| **Authentication** | JWT + Bcrypt | Secure token-based authentication with 10-round salted password hashing & RBAC |

---

## 👥 User Roles & Permissions Matrix

| Role | Permissions & Capabilities |
| :--- | :--- |
| **`SYSTEM_ADMIN`** | • Full user management (list, inspect, update roles, delete)<br>• Store management and oversight<br>• System-wide statistics and analytical dashboard access |
| **`STORE_OWNER`** | • Create and manage owned store profiles<br>• Monitor customer ratings and reviews in real-time<br>• View store average rating scores and feedback stream |
| **`NORMAL_USER`** | • Browse, search, filter, and sort stores by name, address, and rating<br>• Submit 1–5 star ratings and optional review comments<br>• Modify previously submitted ratings anytime (1 rating per store enforced at DB level) |

---

## 🗄️ PostgreSQL Database Setup & Seeding

### 1. Environment Configuration
Verify your `backend/.env` configuration:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# PostgreSQL Connection Pool Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=store_rating_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT_MS=30000
DB_CONNECTION_TIMEOUT_MS=2000

# JWT Authentication
JWT_SECRET=super_secret_jwt_key_store_rating_platform_2026
JWT_EXPIRES_IN=7d
```

### 2. Database Management Commands

Run any of these commands from the root directory:

```powershell
# 1. Complete Initial Database Setup (Migrates schema & seeds realistic data)
npm run db:setup

# 2. Run / Re-apply Schema Migrations Only
npm run db:migrate

# 3. Seed / Update Demo Records Safely (Idempotent: ON CONFLICT DO UPDATE)
npm run db:seed

# 4. Clean Reset (Drops tables, re-migrates, and re-seeds development DB)
npm run db:reset
```

---

## 🔑 Default Seeded Test Credentials

All passwords are securely hashed using `bcrypt` (10 salt rounds) and **never exposed in API responses**:

| Role | Name | Email | Password | Associated Stores |
| :--- | :--- | :--- | :--- | :--- |
| **SYSTEM_ADMIN** | System Administrator | `admin@storerating.com` | `Admin@123456` | Platform-wide Access |
| **STORE_OWNER** | Alice Storekeeper | `owner1@storerating.com` | `Owner@123456` | Apex Digital, Apex Mobile |
| **STORE_OWNER** | Marcus Vance | `owner2@storerating.com` | `Owner@123456` | Urban Gourmet Market |
| **NORMAL_USER** | John Doe | `john.doe@example.com` | `User@123456` | Customer / Reviewer |
| **NORMAL_USER** | Sarah Jenkins | `sarah.jenkins@example.com` | `User@123456` | Customer / Reviewer |
| **NORMAL_USER** | Michael Chang | `michael.chang@example.com` | `User@123456` | Customer / Reviewer |
| **NORMAL_USER** | Emily Watson | `emily.watson@example.com` | `User@123456` | Customer / Reviewer |

---

## 🚀 Quick Start Guide

### Install all dependencies:
```powershell
npm run install:all
```

### Start Frontend & Backend concurrently:
```powershell
npm run dev
```

- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Diagnostics:** [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

### Run Backend Integration Verification Tests:
```powershell
npm run test:backend
```
