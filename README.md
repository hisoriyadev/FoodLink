# FoodLink – Smart Surplus Food Management and Redistribution System

FoodLink is a full-stack, real-time surplus food management platform connecting **Donors** (restaurants, hotels, events), **NGOs** (shelters, food banks), **Volunteers** (transport drivers), and **Admins** to eliminate food waste and fight hunger.

---

## 🌟 Key Features

- 👤 **Multi-Role Authentication**: JWT & Cookie-based security for Admins, Donors, NGOs, and Volunteers.
- 🍲 **Donor Surplus Posting**: Image uploads, expiry window calculators, and meal quantity metrics.
- 🏪 **NGO Marketplace**: Browse surplus food, claim donations, and request nearby volunteers.
- 🚚 **Volunteer Delivery Marketplace**: Claim transport jobs, update live delivery stages (*Assigned, To Pickup, Food Picked Up, To NGO, Delivered*).
- 🤖 **AI & Smart Automation**:
  - **AI Freshness Score (0–100%)**: Color-coded freshness indicators (*Fresh, Moderate, Urgent, Expired*).
  - **Donation Priority Score**: Calculates urgency based on remaining time, quantity, and food type.
  - **Smart NGO Matcher**: Recommends top 5 nearby NGOs based on radius, capacity, and location.
  - **Admin AI Analytics Hub**: Recharts charts for food saved (kg), meals served, category trends, and waste hotspots.
  - **Multi-Criteria AI Search**: Search by food name, location, category, freshness level, and min priority.
- 🗺️ **Google Maps & Live GPS Tracking**: Real-time volunteer movement, ETA in minutes, distance remaining, and route maps.
- 🔔 **Socket.IO Real-Time Notifications**: Instant header bell popups, status updates, and transaction emails via Nodemailer.
- 💬 **Direct Messaging & Chat Hub**: Real-time 1-on-1 messaging between Donors, NGOs, Volunteers, and Admins with typing indicators.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or MongoDB Atlas URI.

### 2. Backend Setup
```bash
cd server
npm install
npm run seed     # Populate database with sample test accounts & data
npm run dev      # Start backend API server on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev      # Start Vite React app on http://localhost:5173
```

---

## 🔑 Test User Accounts
All test accounts are created with password: `Password@123`

| Role | Email | Password | Description |
|---|---|---|---|
| **Admin** | `admin@foodlink.org` | `Password@123` | Full access to AI Analytics, user management, and verification |
| **Donor** | `donor@foodlink.org` | `Password@123` | Grand Horizon Hotel – Post surplus food & view matches |
| **NGO** | `ngo@foodlink.org` | `Password@123` | Hope Foundation Shelter – Claim available food & chat |
| **Volunteer** | `volunteer@foodlink.org` | `Password@123` | Alex Driver – Claim transport jobs & update live GPS location |

---

## 🛠 Tech Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Lucide React, Framer Motion, Recharts, React Hot Toast, Socket.IO Client.
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, Socket.IO, Nodemailer, Helmet, Compression, Express Rate Limit.

---

## 🔒 Security & Optimization Features

- Centralized API Error handling middleware with `ApiError` class.
- Security Headers via `helmet` and Gzip response `compression`.
- API Rate Limiting to prevent brute-force attacks (`express-rate-limit`).
- React Global `<ErrorBoundary>` fallback handling.
