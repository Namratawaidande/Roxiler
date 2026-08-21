# Store Rating Web Application - Initial Foundation

A robust, scalable full-stack web application foundation for a **Store Rating Platform**, built with modern best practices, clean MVC architecture, separated concerns, and production-style security.

---

## 🌟 Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Modern reactive frontend with rich glassmorphism UI, client-side routing, and live API state |
| **Backend** | Node.js + Express.js | Modular RESTful API server with security middlewares, custom validators, and central error handling |
| **Database** | PostgreSQL | Relational database schema with indexes, foreign keys, triggers, migrations, and connection pooling |
| **Authentication** | JWT + Bcrypt | Secure token-based authentication with 10-round salted password hashing & RBAC |

---

## 👥 User Roles & Permissions

1. **`SYSTEM_ADMIN`**
   - Manage all registered users.
   - Manage and moderate stores.
   - Access platform analytics (total users, stores, submitted ratings, ratings distribution).
2. **`STORE_OWNER`**
   - Maintain store details.
   - Monitor customer ratings and inspect overall average rating scores.
   - View recent feedback and reviews.
3. **`NORMAL_USER`**
   - Register and authenticate securely.
   - Browse, search, and sort stores by name, address, and rating.
   - Submit and update store ratings (1–5 stars) with optional feedback comments.

---

## 📁 Project Structure

```text
Roxiler/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js              # PostgreSQL connection pool with connection check
│   │   │   ├── env.js             # Centralized environment variable loader
│   │   │   └── jwt.js             # JWT configuration & options
│   │   ├── constants/
│   │   │   ├── httpStatus.js      # Standard HTTP status constants
│   │   │   └── roles.js           # SYSTEM_ADMIN, STORE_OWNER, NORMAL_USER constants
│   │   ├── controllers/
│   │   │   ├── adminController.js # Admin operations & statistics
│   │   │   ├── authController.js  # Registration, login, profile, role discovery
│   │   │   ├── healthController.js# System health & DB diagnostics
│   │   │   ├── ratingController.js# Ratings submission & store ratings
│   │   │   └── storeController.js # Store listings and management
│   │   ├── database/
│   │   │   ├── migrate.js         # Automated DDL schema migration runner
│   │   │   ├── schema.sql         # PostgreSQL schema (users, stores, ratings)
│   │   │   └── seed.js            # Initial demo data & accounts seeder
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js  # JWT Bearer token authentication
│   │   │   ├── errorMiddleware.js # 404 handler and global exception handler
│   │   │   ├── roleMiddleware.js  # Role-Based Access Control (RBAC)
│   │   │   └── validationMiddleware.js # express-validator wrapper
│   │   ├── routes/
│   │   │   ├── adminRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── healthRoutes.js
│   │   │   ├── index.js           # Root /api/v1 router
│   │   │   ├── ratingRoutes.js
│   │   │   └── storeRoutes.js
│   │   ├── utils/
│   │   │   ├── apiResponse.js     # Standardized JSON response envelope
│   │   │   ├── logger.js          # Timestamped console logging
│   │   │   ├── password.js        # Bcrypt hash and compare helpers
│   │   │   └── token.js           # JWT signing and verification
│   │   ├── app.js                 # Express app config (CORS, Helmet, Morgan)
│   │   └── server.js              # Server entrypoint & graceful shutdown
│   ├── .env                       # Backend environment configuration
│   ├── .env.example               # Backend environment template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── common/
│   │   │       ├── Footer.jsx
│   │   │       ├── Navbar.jsx     # Header with live API connection indicator
│   │   │       └── StatusBadge.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Global JWT auth & role management
│   │   ├── pages/
│   │   │   ├── DashboardPreviewPage.jsx # Multi-role dashboard previews
│   │   │   ├── HomePage.jsx       # Interactive foundation dashboard & API explorer
│   │   │   ├── LoginPage.jsx      # Auth login with 1-click test credentials
│   │   │   ├── NotFoundPage.jsx   # 404 handling
│   │   │   └── RegisterPage.jsx   # Registration with instant validation
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx      # React Router route registry
│   │   ├── services/
│   │   │   ├── api.js             # Axios instance with interceptors
│   │   │   ├── authService.js
│   │   │   └── healthService.js
│   │   ├── styles/
│   │   │   └── index.css          # Design system & dark glassmorphic styles
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env                       # Frontend environment configuration
│   ├── .env.example               # Frontend environment template
│   ├── index.html
│   ├── vite.config.js             # Vite configuration with /api proxy
│   └── package.json
│
├── package.json                   # Root package with concurrent startup scripts
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
Run the install command from the root directory to install dependencies for root, backend, and frontend:
```bash
npm run install:all
```

### 2. Start Both Frontend & Backend Concurrently
From the workspace root:
```bash
npm run dev
```

- **Frontend Application:** [http://localhost:5173](http://localhost:5173)
- **Backend API Server:** [http://localhost:5000](http://localhost:5000)
- **Health Diagnostic Endpoint:** [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

---

## 🗄️ PostgreSQL Database Setup

1. Make sure your PostgreSQL server is active on `localhost:5432` with a database named `store_rating_db` (or update `backend/.env`).
2. Run database schema migration:
   ```bash
   npm run db:migrate
   ```
3. Seed default demo data and role credentials:
   ```bash
   npm run db:seed
   ```

### Default Seeded Test Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **SYSTEM_ADMIN** | `admin@storerating.com` | `Admin@123456` |
| **STORE_OWNER** | `owner@storerating.com` | `Owner@123456` |
| **NORMAL_USER** | `user@storerating.com` | `User@123456` |

---

## 🛡️ API Endpoints Summary

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Public | Live system, uptime & database diagnostics |
| `POST` | `/api/v1/auth/register` | Public | Register account with validation & role assignment |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & receive JWT token |
| `GET` | `/api/v1/auth/me` | Private | Get authenticated user profile |
| `GET` | `/api/v1/auth/roles` | Public | List supported system roles |
| `GET` | `/api/v1/stores` | Public | List stores with average ratings |
| `POST` | `/api/v1/stores` | Admin/Owner | Create new store |
| `GET` | `/api/v1/ratings/store/:storeId` | Public | Get reviews & average for a store |
| `POST` | `/api/v1/ratings` | Normal User | Submit / modify store rating (1–5 stars) |
| `GET` | `/api/v1/admin/stats` | Admin | Get platform analytics & user counts |
| `GET` | `/api/v1/admin/users` | Admin | List all registered users |
