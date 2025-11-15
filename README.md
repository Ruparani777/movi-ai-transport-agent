Movi is a multimodal, knowledge-aware agent that helps MoveInSync transport managers orchestrate both static (Stops, Paths, Routes) and dynamic (Trips, Deployments, Vehicles) operations. The solution bundles a LangGraph-powered backend, a modern admin console, and a seeded dummy database ready for demos or extension.

> **coverage**  
> ✅ LangGraph agent with consequence-aware flows  
> ✅ 10+ DB-backed tools covering CRUD operations  
> ✅ Multimodal frontend (text, voice, image) with contextual UI  
> ✅ Dummy SQLite database seeded with realistic transport data  
> ✅ README
> 
# Movi LangGraph Architecture
This document describes the recommended LangGraph architecture for the Movi agent, how it maps to the existing codebase in `langgraph_agent/`, and how to integrate run output capture.

## Goals

- Represent the 5-stage pipeline as an explicit StateGraph: parse -> context -> consequences -> execute -> respond
- Keep nodes small and testable (one responsibility per node)
- Make consequences explicit so any destructive action must pass a confirmation node
- Provide an adapter layer to build a LangGraph `StateGraph` from the repo's existing tools and handlers
- Persist run outputs (events, decisions, outcomes) to an `outputs/` directory for audit/demo

## High-level components

- `langgraph_agent/graph.py` — existing manual state machine (reference). Can be used as a fallback when LangGraph isn't available.
- `langgraph_agent/langgraph_graph.py` — (optional) guarded adapter that translates the Movi pipeline into a LangGraph `StateGraph`.
- `langgraph_agent/tools.py` — concrete action implementations that call the backend CRUD and DB helpers.
- `langgraph_agent/output_writer.py` — simple utility (created in this repo) that writes run JSON and a human-readable markdown summary into `outputs/`.
- `backend/app/main.py` — exposes `/agent/action` endpoint which can call into the LangGraph adapter when available, or the manual state machine fallback.

## Node types and responsibilities

1. Intent Parser (node: `parse`) — takes user input (text/audio payload) and returns a normalized intent object:
   - shape: { intent: str, params: dict, raw: str }
   - implementation: can be a deterministic parser or an LLM-based parser plugged via a tool

2. Context Resolver (node: `context`) — loads DB state and augments the intent with relevant context:
   - shape: { intent, params, context: { stops, routes, trips, vehicles, bookings } }

3. Consequence Checker (node: `consequences`) — determines side-effects and whether confirmation is required
   - output: { safe: bool, consequences: [ { type, severity, description } ] }

4. Confirmation Gate (node: `confirm`) — if consequences are present and non-trivial, ask for user confirmation. Accept/Reject moves to different branches.

5. Executor (node: `execute`) — executes the operation using `tools.py` functions. Returns operation result + audit events.

6. Responder (node: `respond`) — formats the final message and returns structured result to the caller and to the UI.

## Example LangGraph mapping (pseudo-Python)

```py
from langgraph.graph import StateGraph, Node

# nodes
parse_node = Node("parse", handler=parse_handler)
context_node = Node("context", handler=context_handler)
conseq_node = Node("consequences", handler=consequence_handler)
confirm_node = Node("confirm", handler=confirm_handler)
exec_node = Node("execute", handler=execute_handler)
respond_node = Node("respond", handler=respond_handler)

# graph
g = StateGraph("movi")
g.add_edge(parse_node, context_node)
g.add_edge(context_node, conseq_node)
g.add_edge(conseq_node, confirm_node)
# confirm branches to execute or respond with cancellation
g.add_edge(confirm_node, exec_node, condition=lambda r: r.get('confirmed'))
g.add_edge(confirm_node, respond_node, condition=lambda r: not r.get('confirmed'))
g.add_edge(exec_node, respond_node)
```

In the above mapping, each node's `handler` should be a small function that accepts the current run state and returns a dict of outputs that are merged into the state.

## Data shapes and output capture

- `run_id` (string) — unique ID for each agent run (UUID or timestamp-based)
- `events` (array) — time-ordered events recorded during the run. Each event: { ts, node, actor, payload }
- `final_result` (object) — the produced response and any operation results

We persist runs into `outputs/{run_id}.json` and a short markdown summary `outputs/{run_id}.md` so they are easy to inspect for demos.

## Integration steps

1. Ensure `langgraph` is included in the backend environment only where it's supported (WSL/Docker). The repo includes an optional `requirements.langgraph.txt` for this purpose.
2. Provide a guarded adapter (`langgraph_agent/langgraph_adapter.py`) that:
   - attempts to import `langgraph` and fails with a clear message when not available
   - builds the `StateGraph` mapping to the repo's handlers in `langgraph_agent/tools.py`
   - exposes `run_graph(input_payload, write_output=True)` that returns the final response
3. Use `langgraph_agent/output_writer.py` to persist runs for audit/demo.

## How to run (dev)

1. In WSL or Docker (recommended) create the venv and install the langgraph requirements:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt -r backend/requirements.langgraph.txt
```

2. Start the backend and call the `/agent/action` endpoint. The backend will use the langgraph adapter when available.


## Repository Layout

```
/backend           # FastAPI service and LangGraph integration
  /app
    main.py        # FastAPI entrypoint & REST endpoints
    database.py    # SQLModel engine configuration
    models.py      # ORM models for stops, paths, routes, etc.
    crud.py        # Database helpers used by both API and agent
    seed_data.py   # Dummy data seeded on startup
/frontend          # Vite + React + Tailwind admin console
  /src/pages       # busDashboard & manageRoute clones
  /src/components  # Layout shell and Movi assistant widget
  /src/hooks       # Web Speech API utilities
/langgraph_agent   # LangGraph state machine and tools
/db                # SQLite file generated on first run
<!--
   Classy README: concise, presentable, and demo-friendly.
   Replaces the earlier assignment-style README with a polished project front page.
-->

# Movi — Multimodal Transport Assistant

A lightweight, demo-ready agent and admin console that helps transport managers inspect and operate shuttle fleets. Movi blends a modern React admin UI with a backend agent (LangGraph-aware when available) that reasons about consequences before executing critical changes.

Badges: [Demo-ready] [WSL/Docker recommended] [SQLite seed data]

— Elegant. Practical. Demonstrable. —

## Quick highlights

- Multimodal UI: text, voice (Web Speech API), and image upload stubs for vision matching.
- Consequence-aware agent: parse → context → consequences → confirm → execute → respond.
- Full CRUD-backed domain: Stops, Paths, Routes, Vehicles, Drivers, DailyTrips, Deployments (SQLite seed included).
- Demo-first: demo scripts and output capture utilities that write timestamped run summaries to `outputs/`.

## Project layout

Top-level overview:

```
backend/            # FastAPI service, models, CRUD and agent endpoint
frontend/           # Vite + React + TypeScript + Tailwind UI
langgraph_agent/    # Agent implementations (manual state-machine + optional LangGraph adapter)
scripts/            # Helper scripts (WSL/Docker/demo/push-to-github)
outputs/            # Persisted agent run JSON + markdown summaries (created by output_writer)
db/                 # SQLite database file (generated on first run)
README.md
```

## Getting started — short and reliable

Notes: Windows PowerShell has shown uvicorn shutdown issues in some environments. For a reliable demo, use WSL2 or Docker (instructions below).

1) Backend (WSL / Linux / Docker recommended)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # WSL / macOS / Linux
pip install -r requirements.txt
# (Optional) If you want LangGraph features, install extras in WSL/Docker:
pip install -r requirements.langgraph.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

2) Frontend (dev)

```bash
cd frontend
npm install
npm run dev
# open http://localhost:5173 (or the port Vite prints)
```

3) Quick demo (one-command)

Use the provided script to run the output writer that triggers the agent (adapter or fallback) and persists a run into `outputs/`:

PowerShell (Windows):
```powershell
.\scripts\run_output_demo.ps1
```

Bash (WSL / macOS / Linux):
```bash
./scripts/run_output_demo.sh
```

After running, look in `outputs/` for `YYYYMMDDTHHMMSSZ_{runid}.json` and `.md` summaries.

## Demo flow (2–5 minutes)

1. Open the frontend and point it at a running backend.
2. Show the Movi assistant panel and explain context-awareness (it changes suggestions by page).
3. From Manage Route: create a stop via the form — show the backend CRUD call and the agent confirmation flow if a consequence exists.
4. From Bus Dashboard: ask the agent “List unassigned vehicles” then try removing a vehicle from a trip to demonstrate the confirmation gate.
5. Run the `run_output_demo` script and show the generated markdown summary in `outputs/` to demonstrate auditability.

## LangGraph support and graceful fallback

- The repo includes a manual state-machine implementation (fully self-contained) in `langgraph_agent/graph.py` for portability.
- A guarded LangGraph adapter is available/optional — install `backend/requirements.langgraph.txt` and run in WSL/Docker to exercise the full StateGraph where desired.

## Developer notes

- Seed data: `backend/app/seed_data.py` seeds a realistic dummy dataset the first time the app runs.
- Output capture: `langgraph_agent/output_writer.py` writes JSON + compact markdown summaries to `outputs/` for every persisted run.
- Scripts: `scripts/` contains helpers to run demos, prepare WSL, and optionally push to GitHub.

## Next steps & ideas

- Hook a real vision pipeline (OCR/Object detection) to replace filename heuristics.
- Add role-based sessions and audit trails per user.
- Expand the graph with an LLM-based intent parser and conversational memory.

## Contact & credits

- Project: Movi — MoviAgent demo for MoveInSync-style transport management
- Author:Ruparani Thupakula
- Date: November 2025




