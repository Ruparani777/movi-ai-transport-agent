# 🚌 Movi — Multimodal Transport Management Agent #


**Movi** is an AI-powered assistant integrated into the **MoveInSync Shuttle** admin console. It helps transport managers manage operations through voice, text, and image inputs using a stateful agent pipeline.Movi is a multimodal, knowledge-aware agent that helps MoveInSync transport managers orchestrate both static (Stops, Paths, Routes) and dynamic (Trips, Deployments, Vehicles) operations. The solution bundles a LangGraph-powered backend, a modern admin console, and a seeded dummy database ready for demos or extension.



---> **Assignment coverage**  

> ✅ LangGraph agent with consequence-aware flows  

## 📋 Quick Summary> ✅ 10+ DB-backed tools covering CRUD operations  

> ✅ Multimodal frontend (text, voice, image) with contextual UI  

- ✅ **Full-stack application**: FastAPI backend + React/Vite frontend + SQLite database> ✅ Dummy SQLite database seeded with realistic transport data  

- ✅ **Stateful agent**: Manual state machine pipeline (parse → context → consequences → execute → respond)> ✅ README + architecture diagram + demo checklist

- ✅ **≥10 data-aware actions**: List, create, assign, remove, and update operations

- ✅ **Consequence checking**: Warns users before risky operations (e.g., removing a booked vehicle)---

- ✅ **Page-context awareness**: Agent knows current page (busDashboard or manageRoute)

- ✅ **Multimodal inputs**: Text chat, voice (via Speech API), image matching (mock)## Repository Layout

- ✅ **Seeded SQLite database**: 5 stops, 2 paths, 2 routes, 3 vehicles, 3 drivers, 2 trips


**Terminal 2 — Frontend:**

```powershell---

cd frontend

npm run dev## Getting Started

```

### Prerequisites

**Open browser:**

```- Python 3.11+

http://127.0.0.1:5173/- Node.js 18+

```- pnpm or npm (examples use `npm`)

```

**Backend setup**

## 🏗️ Architecture bash

cd backend

```python -m venv .venv

Frontend (React/Vite).venv\Scripts\activate    # Windows

├── BusDashboard → View/manage daily tripspip install -r requirements.txt

├── ManageRoute → CRUD routes/pathsuvicorn app.main:app --reload

└── MoviAssistant → Chat with Movi agent```

           ↓ HTTP/REST

Backend (FastAPI)The first launch creates `db/movi.db` and seeds it with:

├── /stops, /paths, /routes → Static assets

├── /trips, /deployments → Dynamic operations- 5 stops, 2 paths, 2 routes

├── /agent/action → Agent request handler- 3 vehicles, 3 drivers

└── /vision/match → Image recognition (mock)- 2 daily trips (with booking percentages)

           ↓ SQL- 1 active deployment

Database (SQLite)

├── Stops, Paths, Routes (static)### Frontend setup

└── Vehicles, Drivers, Trips, Deployments (dynamic)

``````bash

cd frontend

### Agent State Machinenpm install

npm run dev

``````

**ARCHITECTURE**/
[React Admin Console]  <--REST-->  [FastAPI Backend]  <--SQLModel-->  [SQLite Dummy DB]
       |                                   |
       | Web Speech API / uploads          | LangGraph StateGraph
       v                                   v
  Movi Assistant Panel ---------> MoviAgent.handle_action()
                                      | 10+ DB tools (CRUD + query)
                                      | Consequence checks
                                      | Confirmation loop for risky ops
``````

**User Input**

    ↓The Vite dev server proxies all `/api` requests to `http://localhost:8000`, so both apps should run concurrently.

[1] Parse Intent

    ↓---

[2] Check Context (page awareness)

    ↓ Feature Walkthrough

[3] Check Consequences (warn if risky)

    ↓1. Bus Dashboard (`/busDashboard`)

[4] Execute Action (if no confirmation needed)

    ↓- Live metrics for trips, deployments, and fleet utilization

[5] Respond (format result)- Interactive table showing booking fill, assigned vehicle, and driver placeholders

    ↓- Pull-to-refresh button that re-fetches trips, deployments, vehicles

Agent Response

``` 2. Manage Route (`/manageRoute`)



---- Form-driven creation of new stops (delegates to Movi agent for execution)

- Snapshot views of all paths and their ordered stops

## 📊 Database Schema- Route table with status pills and shift details



### Static Assets### 3. Movi Assistant Panel

- **Stops**: stop_id, name, latitude, longitude

- **Paths**: path_id, path_name, ordered_stop_ids- **Context Awareness**: Maintains `currentPage` (`busDashboard` or `manageRoute`) and surfaces prompts tailored to the present workflow.

- **Routes**: route_id, path_id, route_display_name, shift_time, direction, status- **Text & Voice Input**: Users can type or dictate requests; the captured transcript pre-populates the chat.

- **Consequence Flow**: Actions such as `remove_vehicle_from_trip` and `update_route_status` raise warnings when impactful, offering an inline “Confirm and proceed” path that resubmits with `confirmed: true`.

### Dynamic Operations- **Vision Stub**: Image uploads send filenames to `/vision/match`. The mock implementation maps human-friendly names (e.g., `Bulk-00-01.png`) to trips for demo purposes.

- **Vehicles**: vehicle_id, license_plate, type, capacity, is_active- **DB Tools (10+)**: Intents supported include `list_unassigned_vehicles`, `get_trip_status`, `list_stops_for_path`, `list_routes_using_path`, `assign_vehicle_to_trip`, `remove_vehicle_from_trip`, `create_stop`, `create_path`, `create_route`, `update_route_status`, `list_daily_trips`, `list_deployments`, and `list_available_drivers`.

- **Drivers**: driver_id, name, phone_number, is_available

- **DailyTrips**: trip_id, route_id, display_name, booking_status_percentage, live_status---

- **Deployments**: deployment_id, trip_id, vehicle_id, driver_id

## Demo Script (2–5 minutes)

### Seeded Data

- 5 stops: Campus Gate, Tech Park, Metro Station, City Center, Warehouse Hub1. **Intro & Context**

- 2 paths: North Loop, South Loop   - Show layout, highlight persistent Movi panel, mention context awareness badge.

- 2 routes with different shift times2. **Static Assets**

- 3 vehicles (2 active, 1 inactive)   - From `manageRoute`, add a new stop via the form (Movi executes the action).

- 3 drivers   - Ask Movi: “List routes using path North Loop.”

- 2 daily trips with 1 vehicle deployment3. **Dynamic Operations**

   - Switch to `busDashboard`; request “List unassigned vehicles.”

---   - Trigger “Remove the vehicle from ‘Bulk - 00:01’.” Demonstrate confirmation guard, then confirm.

4. **Vision Check**

## 🧠 Agent Actions (≥10 Implemented)   - Upload screenshot named `Bulk-00-01.png` (or similar) to prove image matching.

5. **Voice Interaction**

### Reads (No Consequence)   - Use microphone to ask “What is the status of Bulk - 08:30?” and observe STT & TTS.

- `list_stops_for_path` → List stops in a path

- `list_routes_using_path` → List routes using a pathWrap up with the architecture summary and highlight future extension hooks (live tracking, richer vision, role-based access).

- `list_daily_trips` → List all trips

- `list_deployments` → List all assignments---

- `list_unassigned_vehicles` → Count unassigned vehicles

- `get_trip_status` → Get trip status## Testing & Validation

- `list_available_drivers` → List available drivers

- **Backend**: cURL or Postman the REST endpoints (`/stops`, `/routes`, `/deployments`, `/agent/action`).

### Creates (No Consequence)- **Frontend**: `npm run lint` to lint React code; manual verification via the demo script.

- `create_stop` → Add a new stop- **Reliability**: Consequence guard ensures no vehicle removal happens while seats are booked unless confirmed.

- `create_path` → Add a new path

- `create_route` → Add a new route---



### Actions (May Require Confirmation)## Future Enhancements

- `assign_vehicle_to_trip` → Assign vehicle & driver to trip

- `remove_vehicle_from_trip` → Remove vehicle (⚠️ warns if booked)- Replace filename heuristic with genuine OCR/vision pipeline (OpenAI Vision, Azure Cognitive Services, etc.).

- `update_route_status` → Change route status (⚠️ warns if deactivating)- Expand LangGraph to use LLM-based intent parsing and memory for multi-turn reasoning.

- Integrate live telemetry APIs for real-time vehicle health and location.

---- Introduce role-based access control and per-user session contexts.



## 📌 Example API Call---



**Request:**## Credits

```json

POST http://127.0.0.1:8000/agent/action- Prepared for **Movi_ai_transport agemt*  

Content-Type: application/json- Author: **Ruparani Thupakula** 

- Date: _12 November 2025_

{

  "intent": "list_daily_trips",
  "parameters": {},
  "context": {
    "currentPage": "busDashboard"
  }
}
```

**Response (with consequence):**
```json
{
  "message": "Confirmation required before executing action.",
  "consequence": {
    "requires_confirmation": true,
    "reason": "60% of seats already booked for Bulk – 08:30."
  },
  "data": null
}
```

**To confirm:**
```json
{
  "intent": "remove_vehicle_from_trip",
  "parameters": {
    "trip_id": 1,
    "confirmed": true
  },
  "context": {
    "currentPage": "busDashboard"
  }
}
```

---

## 🎤 Multimodal Features

### Text
Chat interface in MoviAssistant component

### Voice (Speech-to-Text)
`frontend/src/hooks/useSpeech.ts` hook captures audio and sends transcript to agent

### Image (Filename Matching)
```powershell
POST http://127.0.0.1:8000/vision/match
Content-Type: multipart/form-data
file: <screenshot.png>
```
Returns matching trip name and confidence score (mock implementation)

---

## 🛠️ Debugging

### Backend Logs
```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --log-level debug
```

### Port Already in Use
```powershell
Get-NetTCPConnection -LocalPort 8000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### Reset Database
```powershell
Remove-Item db\movi.db -ErrorAction SilentlyContinue
# Restart uvicorn to recreate and seed
```

### Test Agent Endpoint
```powershell
$body = @{
    intent = "list_daily_trips"
    parameters = @{}
    context = @{ currentPage = "busDashboard" }
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://127.0.0.1:8000/agent/action' `
  -Method POST `
  -ContentType 'application/json' `
  -Body $body
```

---

## 📁 Project Structure

```
movi-ai-transport-agent/
├── backend/
│   ├── .venv/          # Python venv
│   ├── app/
│   │   ├── main.py     # FastAPI entrypoint
│   │   ├── models.py   # SQLModel ORM
│   │   ├── crud.py     # Database helpers
│   │   ├── schemas.py  # Pydantic models
│   │   ├── database.py # SQLite config
│   │   ├── dependencies.py
│   │   └── seed_data.py
│   ├── db/
│   │   └── movi.db     # SQLite file
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/ # Layout, MoviAssistant
│   │   ├── pages/      # BusDashboard, ManageRoute
│   │   ├── hooks/      # useSpeech
│   │   ├── lib/        # api.ts
│   │   ├── App.tsx     # React Router root
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── langgraph_agent/
│   ├── graph.py        # Agent state machine (no external graph lib)
│   └── tools.py        # Agent tools (lazy imports)
└── README.md
```

---

## ✅ Code Changes from Original

1. **Removed langchain/langgraph dependencies** (were causing Windows build conflicts)
2. **Reimplemented agent** as a lightweight manual state machine in `langgraph_agent/graph.py`
3. **Deferred imports** in `backend/app/main.py` to avoid circular dependencies
4. **Lazy-loaded CRUD/models** in `langgraph_agent/tools.py` (runtime imports inside methods)
5. **Updated requirements.txt**: Removed langchain/langgraph, pinned pydantic==2.5.0

---

## 📝 Notes

- **No external graph library**: Uses simple serial state machine for portability
- **Page-context aware**: Agent knows if you're on BusDashboard or ManageRoute
- **Consequence checking**: Prevents accidental deletions of booked resources
- **Seeded data**: Ready to demo immediately after startup
- **Frontend form integration**: Chat can trigger actions from UI forms

---

**Stack**: FastAPI, React, Vite, SQLModel, SQLite  
**Status**: Ready for local testing 
**Created**: November 2025
