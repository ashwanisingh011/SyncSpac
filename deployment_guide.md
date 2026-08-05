# Deployment Guide for SyncSpac (PaaS Setup)

This step-by-step guide explains how to deploy the SyncSpac enterprise collaboration platform using **MongoDB Atlas**, **Upstash Redis**, and **Render**.

---

## Prerequisites
Before you start, make sure you have:
1. A **GitHub** account with this repository pushed.
2. A **MongoDB Atlas** account (free tier works great).
3. An **Upstash** account (for free serverless Redis).
4. A **Render** account (for backend hosting & frontend static serving).
5. Existing credentials for:
   - **Cloudinary** (Cloud Name, API Key, API Secret)
   - **Razorpay** (Key ID, Key Secret, Webhook Secret)
   - **Google & GitHub OAuth** keys (Optional, for social authentication)

---

## Step 1: Database Setup (MongoDB Atlas)

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new shared cluster (the free M0 tier).
3. **Configure Database Access**:
   - Go to **Database Access** under Security.
   - Click **Add New Database User**.
   - Select **Read and write to any database**.
   - Create a username and password. Keep these handy.
4. **Configure Network Access**:
   - Go to **Network Access** under Security.
   - Click **Add IP Address**.
   - For initial testing, choose **Allow Access From Anywhere** (`0.0.0.0/0`). *(Note: In production, you can restrict this to Render's outbound IPs for maximum security).*
5. **Retrieve Connection String**:
   - Go to **Database** -> Click **Connect** next to your cluster.
   - Choose **Drivers** -> Copy the connection string. It will look like:
     `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
   - Replace `<username>` and `<password>` with your database user credentials. Change the database name in the path to `syncspac` (e.g. `...mongodb.net/syncspac?...`).

---

## Step 2: Cache & Queue Setup (Upstash Redis)

SyncSpac uses Redis to power BullMQ background email jobs and socket performance.

1. Log in to [Upstash Console](https://console.upstash.com/).
2. Click **Create Database**.
3. Choose a name, select the primary region closest to your Render server (e.g., US-East or EU-Central), and click **Create**.
4. In the database dashboard, scroll down to the **Connection Details** section.
5. Copy the **Redis Connect URL** starting with `rediss://` (it contains your password embedded in the URL).
   - *Example:* `rediss://default:your-password@your-endpoint.upstash.io:6379`

---

## Step 3: Deploy Backend (Render Web Service)

1. Log in to [Render](https://render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Set the following configuration options:
   - **Name**: `syncspac-backend`
   - **Environment**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
5. Scroll down to **Environment Variables** and add the following keys:
   - `PORT`: `5001` *(Render will inject its own port, but setting 5001 is a safe default)*
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: *Your MongoDB connection string from Step 1*
   - `REDIS_URL`: *Your Upstash Redis connection string from Step 2*
   - `JWT_SECRET`: *A secure random string*
   - `JWT_EXPIRES_IN`: `7d`
   - `FRONTEND_URL`: *The URL of your frontend (e.g. `https://syncspac.onrender.com` — you can update this after deploying the frontend)*
   - `CLOUDINARY_CLOUD_NAME`: *Your Cloudinary cloud name*
   - `CLOUDINARY_API_KEY`: *Your Cloudinary API key*
   - `CLOUDINARY_API_SECRET`: *Your Cloudinary API secret*
   - `RAZORPAY_KEY_ID`: *Your Razorpay Key ID*
   - `RAZORPAY_KEY_SECRET`: *Your Razorpay Key Secret*
   - `RAZORPAY_WEBHOOK_SECRET`: *Your Razorpay Webhook Secret*
   - `EMAIL_PORT`: `587` *(or your SMTP server port)*
   - `EMAIL_USER`: *SMTP sender email*
   - `EMAIL_PASS`: *SMTP password or API key*
   - `EMAIL_FROM`: *Email sender display address*
   - `SUPERADMIN_FIRST_NAME`: `Super`
   - `SUPERADMIN_LAST_NAME`: `Admin`
   - `SUPERADMIN_USERNAME`: `admin`
   - `SUPERADMIN_EMAIL`: `admin@yourdomain.com`
   - `SUPERADMIN_PASSWORD`: *A secure password to seed your initial admin user*
6. Click **Create Web Service**. Render will build and deploy the backend. Note down your backend URL (e.g., `https://syncspac-backend.onrender.com`).

---

## Step 4: Database Seeding (First-time deployment)

To initialize the default subscription plans, system permissions, and the super admin user:
1. Once the backend is successfully deployed, go to the **Shell** tab in the Render dashboard for `syncspac-backend`.
2. Run the seed script inside the terminal shell:
   ```bash
   npm run seed
   ```
3. This will populate MongoDB with the initial roles, billing tiers, and seed your superadmin user (`admin@yourdomain.com`).

---

## Step 5: Deploy Frontend (Render Static Site)

1. On the Render Dashboard, click **New +** -> **Static Site**.
2. Connect your GitHub repository.
3. Configure the following fields:
   - **Name**: `syncspac` *(or any preferred name)*
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Add the following **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: *Your Render backend URL followed by `/api` (e.g. `https://syncspac-backend.onrender.com/api`)*
   - `NEXT_PUBLIC_SOCKET_URL`: *Your Render backend URL (e.g. `https://syncspac-backend.onrender.com`)*
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`: *Your Razorpay Key ID*
   - `NEXT_PUBLIC_SITE_URL`: *This frontend's URL (e.g. `https://syncspac.onrender.com`)*
5. Click **Create Static Site**.
6. **Configure SPA Client Routing Fallback**:
   - Because React Router handles URLs client-side, trying to access deep paths (like `/dashboard/billing`) directly will cause a `404 Not Found` error.
   - In your Render static site dashboard, go to **Redirects/Rewrites**.
   - Click **Add Rule**.
   - Set **Source**: `/*`
   - Set **Destination**: `/index.html`
   - Set **Action**: `Rewrite` (Status code `200`).
   - Click **Save**.

---

## Step 6: Link Front & Back Cors Scopes

1. Go back to your **Render Backend Web Service** (`syncspac-backend`).
2. Go to **Environment Variables**.
3. Update the `FRONTEND_URL` value to match your actual frontend URL (e.g., `https://syncspac.onrender.com`).
4. Save changes. Render will automatically re-deploy the backend with the correct CORS and Socket.IO origin checks enabled.

---

## Step 7: Verify Deployed App

1. Visit your frontend URL (e.g., `https://syncspac.onrender.com`).
2. Attempt to sign in with your configured `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD`.
3. Try creating a project, invite a user, and inspect the websocket updates (e.g., drag and drop tasks on the Kanban board in two separate windows).
