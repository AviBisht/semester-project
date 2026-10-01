# Flood & Emergency Incident Reporting and Response Dashboard

A college mini-project for disaster management, community reporting, and municipal emergency dispatch.
---

## Tech Stack

- **Frontend**: React (JavaScript, Vite), Tailwind CSS, React Router, Axios, Leaflet + react-leaflet with OpenStreetMap tiles, Recharts (one chart only), lucide-react for icons
- **Backend**: Python, FastAPI, Pydantic, SQLAlchemy
- **Database**: SQLite (`backend/emergency.db`)
- **Weather**: Open-Meteo API (free, no API key required) with automatic fallback to mock data
- **Auth**: Simple Operator login (username + bcrypt hashed password, JWT). Citizens do not log in.
- **Real-Time Updates**: Polls the API every 10 seconds.

---

## Features

### 1. Citizen Incident Reporting (Public, No Login)
- Route: `/`
- Fields: Incident Type (Flooding/Waterlogging, Fire, Road Accident, Medical Emergency, Road Blockage, Other), Description, Location, People Affected, Vulnerable People Involved (Yes/No), Severity (1-5), and Optional Photo Upload.
- Location Behavior:
  - The map displays the city view of Dehradun, Uttarakhand without placing any default pin.
  - A pin appears **only** when the citizen clicks the map or uses the "Use my location" button.
  - If no pin is placed, form submission is blocked and an inline error is displayed under the map: *"Please select the incident location on the map."*
- Confirmation screen displays a unique Tracking ID (e.g. `INC-XXXX`) and direct link to track the report.

### 2. Incident Tracking (Public)
- Route: `/track` (supports direct search or `?id=INC-XXXX`)
- Citizens inspect the live status, assigned response team, and complete lifecycle update history.

### 3. Priority Scoring Formula
Calculated by a plain, readable Python function:
```python
score = (severity * 10)
      + min(people_affected, 20)
      + (15 if vulnerable_people_involved else 0)
      + type_weight
```
**Type weights**: Medical Emergency (10), Fire (10), Flooding/Waterlogging (6), Road Accident (6), Road Blockage (3), Other (2).  
**Priority Tiers**: Critical ($\ge 60$), High ($\ge 40$), Medium ($\ge 25$), Low ($< 25$).  
The score and full breakdown are saved with each incident and displayed on the operator incident detail panel.

### 4. Operator Dashboard (Login Required)
- Routes: `/operator/login`, `/operator/dashboard`
- **Default Operator Credentials**:
  - **Username**: `operator`
  - **Password**: `operator123`
- **Summary Cards**: Active incidents, Critical, Assigned, Resolved, Available teams.
- **Interactive Map**:
  - Incident markers colored by priority tier (Critical, High, Medium, Low).
  - Team markers in distinct shapes with vehicle/unit icons and colored by status (Available, Assigned, Busy).
  - Road Blockage zones displayed as translucent red circles (~300m radius) with map legend.
- **Incident Queue Table**: Sortable and filterable by status and priority.
- **Detail & Dispatch Panel**:
  - Score formula calculation breakdown.
  - Displays the **3 nearest available** response teams of a suitable type with their distance computed using the **Haversine formula**.
  - One-click team dispatch (sets team to *Assigned*, incident to *Assigned*).
  - Lifecycle state transitions (*Reported $\rightarrow$ Assigned $\rightarrow$ In Progress $\rightarrow$ Resolved / Rejected*).
  - Resolving an incident automatically releases assigned teams back to *Available*.
  - Warning banner if an incident is within **500 meters** of an active road blockage.

### 5. Weather Advisory Banner
- Live Dehradun weather via Open-Meteo API displaying current rain, precipitation rate, wind speed, and temperature.
- Issues warning banners when precipitation exceeds safety thresholds.

### 6. Analytics Page
- Route: `/analytics`
- Single bar chart (Recharts) displaying incidents by category.
- Simple count cards comparing resolved vs active cases.

---

## Project Structure

```
mini-project/
├── backend/
│   ├── app/
│   │   ├── auth.py         # Bcrypt password hashing & JWT token verification
│   │   ├── database.py     # SQLite connection & sessionmaker
│   │   ├── models.py       # SQLAlchemy ORM models (User, Incident, Resource, Assignment, IncidentUpdate)
│   │   ├── schemas.py      # Pydantic validation schemas with lat/lon constraints
│   │   ├── scoring.py      # Priority scoring algorithm and breakdown
│   │   ├── seed.py         # Database seeder (operator user, 10 Dehradun response teams)
│   │   ├── utils.py        # Haversine distance formula & blockage proximity
│   │   ├── weather.py      # Open-Meteo client with mock fallback
│   │   └── main.py         # FastAPI endpoints and static file mounts
│   ├── uploads/            # Uploaded citizen incident photos
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, IncidentMap, WeatherBanner, IncidentTable, DetailPanel, etc.
│   │   ├── pages/          # ReportIncidentPage, TrackReportPage, OperatorDashboard, Analytics, Login
│   │   ├── api.js          # Axios instance with JWT interceptor
│   │   ├── App.jsx         # React Router setup
│   │   └── index.css       # Tailwind CSS & custom Leaflet styling
│   ├── tailwind.config.js  # Soft pastel design palette
│   └── package.json
├── run_backend.py          # Backend runner
├── start_servers.ps1       # PowerShell launcher for both servers
└── README.md
```

---

## How to Run

### 1. Backend Server
```bash
# In the project root:
python run_backend.py
```
Backend API will be live at: `http://127.0.0.1:8000`  
Swagger API Docs: `http://127.0.0.1:8000/docs`

### 2. Frontend Server
```bash
cd frontend
npm run dev
```
Frontend Web App will be live at: `http://127.0.0.1:5173/`

### 3. One-Command PowerShell Launcher
```powershell
.\start_servers.ps1
```
