# HRMS Lite – Frontend

React frontend for the HRMS Lite (Human Resource Management System) application.

---

## Project Overview

HRMS Lite is a lightweight web application that allows an admin to:

- Manage employee records (add, edit, delete, search)
- Track daily attendance (mark Present / Absent, filter by employee and date)
- View a dashboard with summary stats and department breakdown

---

## Tech Stack

| Purpose | Technology |
|---|---|
| UI Framework | React 19 |
| Routing | React Router DOM v7 |
| HTTP Client | Axios |
| Icons | React Icons (HeroIcons) |
| Notifications | React Toastify |
| Styling | Custom CSS |
| Deployment | Vercel |

---

## Running Locally

### Prerequisites

- Node.js 16+
- npm
- Backend API running at `http://localhost:8000`

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/your-username/hrms-lite.git
cd hrms-lite

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local and set REACT_APP_API_URL=http://localhost:8000/api

# 4. Start the dev server
npm start
```

Open **http://localhost:3000** in your browser.

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `REACT_APP_API_URL` | Backend API base URL | `http://localhost:8000/api` |

---

## Deployment (Vercel)

1. Import the GitHub repo into Vercel
2. Add environment variable in Vercel dashboard:
   - `REACT_APP_API_URL` → `https://hrms-fastapi-api.onrender.com/api`
3. Vercel auto-detects Create React App — no extra config needed
4. `vercel.json` handles client-side routing (all routes → `index.html`)

---

## Project Structure

```
src/
├── components/        # Reusable UI (Sidebar, Modal, Loading, EmptyState, ErrorState, ConfirmDialog)
├── pages/             # Dashboard, Employees, Attendance
├── services/
│   └── api.js         # Axios instance + all API calls
├── styles/
│   └── App.css
├── App.js
└── index.js
```

---

## Assumptions & Limitations

- No authentication — single admin user (per project scope)
- All data is managed via the backend REST API; no local state persistence
- MongoDB is used on the backend for persistent storage (via FastAPI + Motor)
- Pagination is handled server-side (page size: 50 records)

