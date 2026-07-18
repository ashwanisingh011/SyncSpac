<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# TaskBridge AI Agent Instructions

## Project Overview

TaskBridge is a Jira-inspired SaaS project management platform being developed at Tierce India Pvt. Ltd.

The platform follows a multi-tenant workspace architecture where:
One Company = One Workspace

Examples:

* Tierce Workspace
* Infosys Workspace
* Google Workspace

---

# Tech Stack

## Frontend

* Next.js App Router
* TypeScript
* TailwindCSS

---

# Current Modules

## Completed

* Login
* Register
* Email Verification
* Forgot Password
* Reset Password
* 2FA Authentication
* Protected Routes

## Current Development

Organization / Workspace Module

Features:

* Create Workspace
* Invite Team Members
* Team Management
* Workspace Settings
* Billing & Subscription UI

---

# Frontend Rules

* Focus only on frontend development
* Do not modify backend logic
* If backend changes are needed, mention them separately
* Keep components reusable
* Avoid hardcoded dummy data
* Keep components API-ready
* Follow existing TaskBridge UI patterns
* Use responsive layouts
* Use functional React components
* Avoid using any type
* Match existing navbar/dashboard structure

---

# Folder Structure

src/app/(protected)/workspace/

workspace/

* page.tsx
* create/page.tsx
* members/page.tsx
* settings/page.tsx
* billing/page.tsx

---

# UI Style

* Clean SaaS dashboard
* Jira-inspired UX
* Minimal UI
* White background
* Soft borders
* Blue accents
* Card-based layouts
