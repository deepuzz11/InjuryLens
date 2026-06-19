# InjuryLens

**AI-Powered Sports Movement Analysis & Injury Risk Assessment**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react)](https://react.dev)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-0.10-FF6F00?style=flat&logo=google)](https://mediapipe.dev)
[![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-4285F4?style=flat&logo=google)](https://aistudio.google.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## What It Does

Access to professional sports physiotherapy is expensive and often inaccessible. Athletes train without understanding the injury risks in their movement patterns — until they're injured.

**InjuryLens** bridges this gap. Record any movement, upload the video, and receive a comprehensive clinical-grade report in seconds:

- **6 biomechanical risk metrics** — knee valgus (left & right), trunk lean, bilateral asymmetry, shoulder height asymmetry, hip drop
- **Automatic rep counting** — detects repetitions from joint angle oscillations
- **Fatigue detection** — compares form quality between the first and second halves of your session
- **Frame-by-frame angle timeline** — chart showing joint angles across every frame
- **3-frame annotated gallery** — worst, best, and middle frames with skeleton overlay
- **AI coaching report** — personalised via Gemini 2.0 Flash: 5 movement cues, 5 exercises, warm-up routine, 5-day training plan
- **12 supported movement types** — from Squat to Bench Press
- **Webcam recording** — record directly in the browser
- **Analysis history** — save and revisit past analyses (stored locally)
- **Progress dashboard** — track your risk scores over time with Recharts
- **Comparison mode** — side-by-side analysis of two sessions
- **Text report export** — download a full clinical summary as a .txt file

---

## Screenshots

| Upload Screen | Loading | Results Report |
|:---:|:---:|:---:|
| `screenshot-upload.png` | `screenshot-loading.png` | `screenshot-results.png` |

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Python | 3.11+ | MediaPipe requires 3.8–3.12 |
| Node.js | 18+ | For the Vite/React frontend |
| npm | 9+ | Installed with Node.js |
| Gemini API Key | Free | See section below |

---

## Getting Your Free Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API key"**
4. Copy the key — it starts with `AIza...`

The free tier handles ~60 requests/minute, sufficient for personal use.

---

## Setup — Backend

```bash
# 1. Navigate to the backend directory
cd InjuryLens/backend

# 2. Create a Python 3.11 virtual environment (recommended)
py -3.11 -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure your Gemini API key
cp .env.example .env
# Edit .env:  GEMINI_API_KEY=AIzaYourActualKeyHere

# 5. Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend endpoints:
- Health check: `http://localhost:8000/health`
- Supported movements: `http://localhost:8000/movements`
- Interactive API docs: `http://localhost:8000/docs`

---

## Setup — Frontend

```bash
# 1. Navigate to the frontend directory
cd InjuryLens/frontend

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

The Vite dev server proxies `/analyze`, `/health`, and `/movements` to the backend at `localhost:8000`.

---

## How to Use

1. **Upload or record** — Drag-and-drop a video file (MP4/MOV/AVI/WebM) or click "Record with Webcam" to capture directly in the browser. Ensure your full body is visible in good lighting.

2. **Select your movement** — Choose from 12 movement types, filtered by category (Lower Body, Upper Body, Core, Power, Cardio, Full Body).

3. **Set your profile** — Pick your fitness level, age group, training goal, and optionally your sport for context-specific coaching.

4. **Click Analyze** — Processing takes 15–30 seconds. The backend runs MediaPipe pose detection on every frame, then Gemini generates your report.

5. **Review your report** — See your risk scores, annotated frames, joint angle timeline, rep count, fatigue score, warm-up routine, and 5-day training plan.

6. **Save & compare** — Analyses are auto-saved to History. Visit the Progress dashboard to track improvements over time, or use Comparison mode to view two sessions side-by-side.

---

## Biomechanics Analysis

### Pose Detection
MediaPipe Pose detects **33 body landmarks** in 3D space on every frame. Only frames where mean landmark visibility exceeds 50% are included.

### Risk Metrics

| Metric | Method | Threshold | Weight |
|--------|--------|-----------|--------|
| Left Knee Valgus | Hip→Knee→Ankle angle | < 165° (movement-dependent) | 27% |
| Right Knee Valgus | Hip→Knee→Ankle angle | < 165° (movement-dependent) | 27% |
| Trunk Lean | Torso vector vs vertical axis | > 25–50° (movement-dependent) | 22% |
| Bilateral Asymmetry | Left vs right knee angle diff | > 8–20° (movement-dependent) | 12% |
| Shoulder Asymmetry | Left vs right shoulder height | > 5% frame height | 7% |
| Hip Drop | Left vs right hip height | > 4% frame height | 5% |

Each score = percentage of analyzed frames where the condition was flagged (0–100%).

### Supported Movements

| Movement | Category | Key Focus |
|----------|----------|-----------|
| Squat | Lower Body | Knee valgus, trunk lean, depth |
| Deadlift | Full Body | Hip hinge, trunk lean, bar path |
| Lunge | Lower Body | Knee valgus, hip stability |
| Running | Cardio | Gait symmetry, trunk lean |
| Jump Landing | Power | ACL risk, bilateral load |
| Push-up | Upper Body | Shoulder alignment, trunk control |
| Plank | Core | Trunk alignment, hip sag |
| Hip Hinge | Lower Body | Posterior chain, trunk lean |
| Overhead Press | Upper Body | Shoulder symmetry, trunk lean |
| Lateral Lunge | Lower Body | Frontal plane knee valgus |
| Split Squat | Lower Body | Unilateral knee alignment |
| Bench Press | Upper Body | Shoulder alignment, elbow flare |

### AI Coaching
Risk scores, joint angles, athlete profile, movement type, and sport context are sent to Gemini 2.0 Flash. The model returns structured JSON including:
- Overall risk assessment
- Priority corrective focus
- 5 movement cues
- 5 exercises with sets/reps and clinical justification
- 4-item warm-up routine
- 5-day weekly training plan
- Individual feedback for each metric
- Sport-specific note (when sport is provided)

If Gemini is unavailable, a clinically validated adaptive fallback report is generated automatically.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend API | FastAPI | 0.111 |
| ASGI Server | Uvicorn | 0.29 |
| Pose Detection | MediaPipe Pose | 0.10.14 |
| Computer Vision | OpenCV | 4.9 |
| Numerical Analysis | NumPy | 1.26.4 |
| AI Coaching | Google Gemini 2.0 Flash | via google-generativeai 0.7.2 |
| Frontend Framework | React | 18.3 |
| Build Tool | Vite | 5.3 |
| Styling | Tailwind CSS | 3.4 |
| Animations | Framer Motion | 11.3 |
| State Management | Zustand (with persist) | 5.0 |
| Charts | Recharts | 2.12 |
| Icons | Lucide React | 0.400 |

---

## Project Structure

```
InjuryLens/
├── backend/
│   ├── main.py              # FastAPI app + all endpoints
│   ├── models.py            # Pydantic request/response schemas
│   ├── biomechanics.py      # Joint angle calculation, rep counting, fatigue
│   ├── scoring.py           # Frame flags → 0-100 risk scores
│   ├── ai_coach.py          # Gemini 2.0 Flash integration + adaptive fallback
│   ├── annotator.py         # Frame annotation with skeleton + angle labels
│   ├── pose_extractor.py    # MediaPipe pose landmark extraction
│   ├── config.py            # Pydantic Settings (.env)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── screens/
    │   │   ├── UploadScreen.jsx     # Upload, webcam, movement selector, profile
    │   │   ├── LoadingScreen.jsx    # Animated skeleton + progress
    │   │   ├── ResultsScreen.jsx    # Full results report (all sections)
    │   │   ├── HistoryScreen.jsx    # Saved analysis browser
    │   │   ├── DashboardScreen.jsx  # Progress charts (Recharts)
    │   │   └── ComparisonScreen.jsx # Side-by-side analysis comparison
    │   ├── components/
    │   │   ├── Navbar.jsx           # Navigation with history/progress links
    │   │   ├── BodyMap.jsx          # SVG body heat map
    │   │   ├── TimelineChart.jsx    # Joint angle timeline (Recharts)
    │   │   ├── WebcamRecorder.jsx   # In-browser video recording
    │   │   ├── AnimatedBar.jsx      # Spring-animated risk score bars
    │   │   ├── RiskGauge.jsx        # SVG semi-circle gauge
    │   │   ├── Accordion.jsx        # Expandable feedback sections
    │   │   └── ErrorCard.jsx        # Styled error display
    │   ├── App.jsx                  # Screen router
    │   ├── store.js                 # Zustand state + localStorage persistence
    │   ├── api.js                   # Fetch wrappers + report export
    │   └── index.css                # Tailwind + design tokens
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## API Reference

### GET /health
Returns server status, MediaPipe version, Gemini availability, uptime, and supported movement count.

### GET /movements
Returns the full list of supported movement types with category, description, key metrics, and difficulty.

### POST /analyze
Upload a video for full biomechanical analysis.

**Form fields:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `file` | File | required | MP4, MOV, AVI, or WebM, max 100 MB |
| `movement_type` | string | "Squat" | One of the 12 supported movements |
| `fitness_level` | string | "Intermediate" | Beginner / Intermediate / Advanced / Elite |
| `age_group` | string | "25–34" | Age bracket |
| `goal` | string | "Injury Prevention" | Training goal context |
| `sport` | string | "" | Optional sport context for AI coaching |

**Response fields:**
- `analysis_id` — unique ID for this analysis
- `scores` — 7 risk scores (0–100) including overall
- `supplementary` — average joint angles, rep count, fatigue score, FPS, duration
- `ai_coaching` — full coaching report (cues, exercises, warm-up, weekly plan, etc.)
- `annotated_frame` — base64 PNG of worst frame with skeleton overlay
- `annotated_frames` — set of worst/best/middle annotated frames
- `frame_timeline` — downsampled per-frame angle data for charting

---

## Disclaimer

InjuryLens is an AI-assisted analytical tool intended for educational and informational purposes only. It does not constitute medical advice. Always consult a qualified physiotherapist or sports medicine professional before modifying your training, starting a new exercise program, or if you experience pain or discomfort.
