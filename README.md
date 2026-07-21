# SyncSpac (TaskBridge) — Enterprise Multi-Tenant Project Management & Collaboration Platform

> An enterprise-grade, real-time project management and workspace collaboration system designed for multi-tenant organizations, high-frequency task tracking, asynchronous queue processing, and granular access control.

---

## Executive Overview

**SyncSpac** (internally code-named *TaskBridge*) is a full-stack, multi-tenant project management platform engineered to deliver corporate-level collaboration, high-concurrency real-time updates, multi-tier organization billing, and isolated client access. Designed with scalability and operational security at its core, SyncSpac empowers enterprise organizations to manage complex project lifecycles, file assets, sprint schedules, and user roles within isolated multi-tenant environments.

### Target Audience & Engineering Focus
* **Senior Engineers & System Architects**: Reviewing high-concurrency event-driven real-time architectures, asynchronous task queue design, Mongoose schema modeling across 28 entities, and multi-tenant resource boundary isolation.
* **Technical Recruiters & Engineering Leadership**: Assessing production-grade TypeScript patterns, enterprise authorization security (RBAC/ABAC), dynamic subscription checkout infrastructure, and full-stack system scalability.

---

## Tech Stack Breakdown

### Backend Architecture
* **Core Runtime & Framework**: Node.js, Express.js, TypeScript (Strict Mode).
* **Database & ORM**: MongoDB, Mongoose ODM (Data modeling across 28 relational/document schemas).
* **Real-Time Communication**: Socket.IO (WebSockets with workspace-level room management).
* **Background Queues & Cron**: BullMQ, Redis (Asynchronous job processing, email dispatches, recurring task scheduling).
* **Authentication & Security**: JSON Web Tokens (JWT Access & Refresh Token Rotation), `otplib` (TOTP-based 2-Factor Authentication), `bcryptjs`, `helmet` (HTTP header security), `express-rate-limit`.
* **Storage Infrastructure**: Cloudinary API (Hierarchical asset management, signed uploads, virtual folder trees).
* **Payment Integration**: Razorpay API & Simulated Dynamic Test Mode Gateway (Multi-currency checkout, promotion engine).

### Frontend Architecture
* **Core Framework**: React 19, Vite (Ultra-fast HMR and bundle optimization).
* **Styling & UI Components**: Tailwind CSS v4, Lucide React (Enterprise visual design system).
* **State & Navigation**: React Router v6 / Next.js File-Based Routing architecture, React Context API, Custom Hooks.
* **Drag-and-Drop & Interactions**: `@hello-pangea/dnd` / `@dnd-kit` for real-time Kanban workflow manipulations.

---

## Key Architectural Features

### 1. Multi-Tenant Architecture & Granular RBAC/ABAC
* **Isolated Organization Boundaries**: Tenants are partitioned by `Organization` and `Workspace` structures. Data queries enforce organization-scoped filtering to guarantee complete tenant data isolation.
* **Role-Based & Attribute-Based Access Control**: Supports multi-tiered custom roles (`Super Admin`, `Org Admin`, `Project Manager`, `Developer`, `Client`, `Guest`). Dynamic middleware evaluates permissions at both resource (`RBAC`) and property-level context (`ABAC`), restricting modifications based on user ownership and tenant boundaries.

### 2. Full Authentication & Security Suite
* **Token Rotation & Session Management**: Implements short-lived JWT Access Tokens combined with persistent Refresh Tokens stored in secure HTTP-only cookies, paired with active `Session` tracking in MongoDB.
* **TOTP Two-Factor Authentication (2FA)**: Fully integrated 2FA using `otplib` with QR code provisioning and verification workflows.
* **Defensive Middleware**: Protected by `helmet` headers, CORS configuration, request sanitization, and IP-based rate limiters to defend against brute-force attacks and abuse.

### 3. Real-Time Collaboration Engine
* **Socket.IO Event Pipeline**: Broadcasts instant updates across connected clients for active workspace presence, live Kanban board column changes, task assignment alerts, and active typing indicators.
* **Optimistic UI Updates**: Client application reflects board state transitions instantly while synchronizing changes asynchronously over WebSocket channels with automatic fallback recovery.

### 4. Asynchronous Queue & Background Worker System
* **BullMQ & Redis Processing**: High-throughput queues handle heavy background operations including automated transactional emails, batch report generation, and webhooks.
* **Recurring Task Cron Engine**: Scheduled background workers process `RecurringTask` blueprints, dynamically generating recurring task instances according to user-defined cron schedules.

### 5. Multi-Tier Subscription & Dynamic Checkout Engine
* **Tiered Subscription Plans**: Supports `Free`, `Pro`, and `Business` tiers with distinct quota enforcement (user count, active projects, Cloudinary storage caps).
* **Dynamic Multi-Currency Checkout**: Real-time currency conversions between **INR (🇮🇳)** and **USD (🇺🇸)**, 4% exchange guarantee fee handling, promotional discount validation (`WELCOME20`), and test-mode credit card processing (`4242` success vs. `9999` decline simulation).
* **Quota Enforcement Middleware**: Intercepts project creation and file upload requests, rejecting actions that breach current organization tier limits.

### 6. Hierarchical Cloudinary Storage System
* **Virtual Directory Tree**: Implements a folder tree structure backed by `File` Mongoose models linked to Cloudinary cloud assets.
* **Quota Tracking & Auto-Cleanup**: Tracks storage usage per tenant in real time. Deletions automatically purge assets from Cloudinary servers and recover storage quotas.

### 7. Dedicated External Client Portal
* **Sub-Path Client Dashboard (`/client-dashboard`)**: Tailored portal for external project stakeholders and clients.
* **Filtered Project Visibility**: Clients gain read/comment access strictly to assigned projects, tasks, sprint deliverables, and shared documents while internal workspace controls remain hidden.

---

## Database Schema Overview

The SyncSpac persistence layer consists of **28 specialized Mongoose schemas**, grouped into functional domain modules:

| Domain Module | Mongoose Models | Purpose & Key Responsibilities |
| :--- | :--- | :--- |
| **Identity & Auth** | `User`, `Session`, `Permission`, `Role`, `RolePermission` | Identity management, password hashing, 2FA secrets, session revoking, system & custom RBAC grants. |
| **Organization & Tenant** | `Organization`, `OrganizationMember`, `WorkspaceSettings`, `Department`, `Team`, `Invitation` | Multi-tenant organization hierarchies, departmental structures, user memberships, workspace configurations, email invites. |
| **Project Management** | `Project`, `ProjectMember`, `ProjectStatus`, `ProjectSettings` | Core project metadata, member assignments, custom status pipelines, and project configurations. |
| **Task & Sprint Lifecycle** | `Task`, `Sprint`, `TaskComment`, `TaskAttachment`, `TaskDependency`, `TaskHistory`, `TaskTimeLog`, `RecurringTask`, `Label` | Task tracking, sprint planning, time logging, dependencies, audit history, attachment linking, cron-based recurring tasks, and labels. |
| **Storage & Documents** | `File` | Hierarchical file meta, virtual directory paths, Cloudinary public IDs, file sizes, and project scope bindings. |
| **Billing & Subscriptions** | `Plan` | Monetization plans, tier storage caps, feature flags, member limits, and billing cycle pricing. |
| **Audit & Notifications** | `AuditLog`, `Notification` | System-wide audit logging for compliance and activity notifications (in-app popups & email). |

---

## Repository Directory Structure

```
SyncSpac/
├── backend/
│   ├── src/
│   │   ├── config/             # DB, Redis, Cloudinary, Razorpay, and Socket setup
│   │   ├── controllers/        # Request handlers (Auth, Billing, Tasks, Files, Orgs)
│   │   ├── middleware/         # Auth, RBAC/ABAC, Rate Limiter, Quota Enforcement
│   │   ├── models/             # 28 Mongoose data models & interfaces
│   │   ├── routes/             # Express API route modules
│   │   ├── scripts/            # Database seed scripts & system utilities
│   │   ├── seed/               # Default roles, permissions, & tier plan seeds
│   │   ├── types/              # Custom TypeScript interfaces & Express definitions
│   │   ├── utils/              # Token helpers, response formatters, queue dispatchers
│   │   └── server.ts           # HTTP server initialization & Socket.IO mounting
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js / Vite Route Pages & Layouts
│   │   │   ├── (protected)/    # Authenticated route group (Dashboard, Billing, Checkout)
│   │   │   ├── client-dashboard/ # Dedicated Client Portal sub-application
│   │   │   └── auth/           # Login, Register, 2FA Verification pages
│   │   ├── components/         # Reusable UI components (Kanban, Nav, Modals, Checkout)
│   │   ├── context/            # Global state providers (Auth, Org, Socket, Theme)
│   │   ├── hooks/              # Custom React hooks (useAuth, useSocket, useProjects)
│   │   ├── services/           # Axios API client & endpoint service definitions
│   │   └── types/              # Frontend TypeScript contracts
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── walkthrough.md              # System walkthrough & verification guide
```

---

## Getting Started & Local Development Setup

### Prerequisites
* **Node.js**: `v18.x` or `v20.x` installed
* **MongoDB**: Local MongoDB instance running on `mongodb://localhost:27017` or MongoDB Atlas URI
* **Redis**: Redis server running on `localhost:6379` (Required for BullMQ & Socket.IO adapter)
* **npm**: Package manager (`v9.x`+)

---

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` root directory (refer to template below).

4. **Seed Database (Initial Seed Data)**:
   ```bash
   npm run seed
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The backend API service will start on `http://localhost:5001`.

---

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `frontend/` root directory (refer to template below).

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The frontend application will be accessible at `http://localhost:3000`.

---

### Environment Variables Specification

#### Backend Environment Template (`backend/.env`)
```env
# Core Server Configuration
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/taskbridge

# JWT & Authentication
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d

# Redis Configuration (BullMQ & Socket.IO)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Email Transporter (Nodemailer / SMTP)
EMAIL_PORT=587
EMAIL_USER=your_smtp_user
EMAIL_PASS=your_smtp_password
EMAIL_FROM=noreply@taskbridge.com

# Initial Superadmin Provisioning
SUPERADMIN_FIRST_NAME=Super
SUPERADMIN_LAST_NAME=Admin
SUPERADMIN_USERNAME=taskbridge_admin
SUPERADMIN_EMAIL=admin@taskbridge.io
SUPERADMIN_PASSWORD=YourSecurePassword123!

# Cloudinary Storage Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# OAuth Integrations (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5001/api/auth/google/callback

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:5001/api/auth/github/callback

# Payment Gateway Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

#### Frontend Environment Template (`frontend/.env`)
```env
# API Gateway Target
NEXT_PUBLIC_API_URL=http://localhost:5001/api

# Payment Gateway Public Key
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_id_here
```

---

## API Endpoints Overview Table

| Module | HTTP Method | Endpoint Path | Authorization / Access | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Public | Register user & initialize organization workspace. |
| **Auth** | `POST` | `/api/auth/login` | Public | Authenticate user, issue JWT access token & session cookie. |
| **Auth** | `POST` | `/api/auth/2fa/verify` | Authenticated | Verify TOTP passcode for two-factor enabled accounts. |
| **Auth** | `GET` | `/api/auth/me` | Authenticated | Retrieve profile details of currently logged-in user. |
| **Organization** | `GET` | `/api/organizations` | Authenticated | Fetch list of organizations accessible by user. |
| **Organization** | `POST` | `/api/organizations` | Authenticated | Create a new organization tenant workspace. |
| **Organization** | `GET` | `/api/organizations/:id/members` | Org Admin / Member | List members belonging to specified organization. |
| **Projects** | `GET` | `/api/projects` | Authenticated | List all active projects in current organization workspace. |
| **Projects** | `POST` | `/api/projects` | Project Manager / Admin | Create project (enforces organization storage & count quota). |
| **Projects** | `GET` | `/api/projects/:id` | Project Member | Retrieve detailed project metadata, sprints, and metrics. |
| **Tasks** | `GET` | `/api/tasks` | Authenticated / Client | Fetch tasks filtered by project, status, sprint, or user assignment. |
| **Tasks** | `POST` | `/api/tasks` | Developer / PM | Create new task item with metadata, tags, and dependencies. |
| **Tasks** | `PATCH` | `/api/tasks/:id/status` | Developer / PM | Move task status column (triggers Socket.IO real-time event). |
| **Sprints** | `GET` | `/api/sprints` | Authenticated | Fetch active sprint iterations for selected project. |
| **Sprints** | `POST` | `/api/sprints` | Project Manager | Plan and launch new sprint lifecycle. |
| **Files** | `GET` | `/api/files` | Authenticated / Client | List hierarchical virtual directory tree and uploaded assets. |
| **Files** | `POST` | `/api/files/upload` | Authorized Member / Client | Upload asset to Cloudinary & record file model in database. |
| **Files** | `DELETE` | `/api/files/:id` | Authorized Member | Delete asset from DB and release quota on Cloudinary. |
| **Billing** | `GET` | `/api/billing/plans` | Authenticated | Retrieve available subscription tiers and feature matrices. |
| **Billing** | `POST` | `/api/billing/checkout` | Org Admin | Execute tier upgrade checkout (simulated test mode / Razorpay). |
| **Billing** | `POST` | `/api/billing/cancel` | Org Admin | Revert active organization subscription back to Free tier. |
| **Notifications** | `GET` | `/api/notifications` | Authenticated | List user notifications for inline header bell popup. |
| **Notifications** | `PATCH` | `/api/notifications/read` | Authenticated | Mark individual or all notifications as read. |
| **Audit Logs** | `GET` | `/api/admin/audit-logs` | Super Admin / Org Admin | Query security audit trails and organization system logs. |

---

## License & Attribution

SyncSpac (TaskBridge) is an open-source enterprise software project. Built with high standards of software engineering, robust data isolation, and modern web architectures.
