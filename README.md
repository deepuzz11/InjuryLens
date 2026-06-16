# InjuryLens

**AI-Powered Sports Movement Analysis & Injury Risk Assessment**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react)](https://react.dev)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-0.10-FF6F00?style=flat&logo=google)](https://mediapipe.dev)
[![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-4285F4?style=flat&logo=google)](https://aistudio.google.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![PhysTech 2026](https://img.shields.io/badge/PhysTech-2026_Hackathon-6366f1?style=flat)](https://phystech2026.io)

---

## What Problem It Solves

Access to professional sports physiotherapy is expensive and often inaccessible. Athletes and fitness enthusiasts frequently train without understanding the injury risks embedded in their movement patterns — until they're injured.

**InjuryLens** democratizes this expertise. A user records themselves performing any physical movement, uploads the video, and within seconds receives a comprehensive report that rivals what a sports physiotherapist would provide:

- **Pose analysis** using MediaPipe's 33-landmark body model across every frame
- **Quantified injury risk scores** for knee valgus (left & right), trunk lean, and bilateral asymmetry
- **AI-generated coaching** tailored to the athlete's profile via Gemini 2.0 Flash
- **Exercise prescription** with specific sets, reps, and clinical justification
- **Annotated movement frame** highlighting the highest-risk moment in the video

---

## Screenshots

> *(Add screenshots here after first run)*

| Upload Screen | Loading / Analysis | Results Report |
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

The free tier is sufficient for this application (handles ~60 requests/minute).

---

## Setup — Backend

```bash
# 1. Navigate to the backend directory
cd InjuryLens/backend

# 2. Create a virtual environment (strongly recommended)
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Set your Gemini API key
cp .env.example .env
# Edit .env and replace the placeholder with your actual key:
# GEMINI_API_KEY=AIzaYourActualKeyHere

# 5. Start the FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`.
- Health check: `http://localhost:8000/health`
- API docs: `http://localhost:8000/docs`

---

## Setup — Frontend

```bash
# 1. Navigate to the frontend directory
cd InjuryLens/frontend

# 2. Install Node.js dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

The Vite dev server is pre-configured to proxy `/analyze` and `/health` to the backend at `localhost:8000`, so no CORS issues during development.

---

## How to Use InjuryLens

1. **Record your movement** — Use your phone or webcam to record yourself performing a squat, run, lunge, jump landing, push-up, deadlift, or plank. Ensure your full body is visible and the lighting is good.

2. **Upload the video** — Drag and drop (or click to browse) your MP4, MOV, or AVI file (up to 100 MB) onto the upload zone.

3. **Configure your profile** — Select your movement type, fitness level, age group, and goal from the dropdown menus.

4. **Click "Analyze Movement"** — The backend processes your video through MediaPipe and Gemini AI. This takes 10–25 seconds depending on video length.

5. **Review your report** — The Results screen presents your risk scores, an annotated frame, AI coaching cues, a personalized exercise prescription, and a follow-up timeline.

6. **Export or share** — Download a text summary or copy a shareable link.

---

## How the Biomechanics Analysis Works

### Pose Detection (MediaPipe)

MediaPipe Pose detects **33 body landmarks** in 3D space on every video frame, tracking joints from head to foot with sub-centimeter accuracy. Only frames where key landmarks (hips, knees, ankles, shoulders) have mean visibility > 50% are included in analysis.

### Angle Calculations

Joint angles are computed using NumPy's arccos-based approach on the landmark coordinates:

```
angle_at_B = arccos( dot(A−B, C−B) / (|A−B| × |C−B|) )
```

- **Knee angle**: hip → knee → ankle
- **Trunk lean**: angle between torso vector (mid-hip → mid-shoulder) and vertical axis

### Risk Scoring

Four biomechanical checks are evaluated per frame:

| Check | Flag Condition | Weight in Overall Score |
|-------|---------------|------------------------|
| Left Knee Valgus | Hip→Knee→Ankle angle < 165° | 30% |
| Right Knee Valgus | Hip→Knee→Ankle angle < 165° | 30% |
| Trunk Lean | Torso-to-vertical angle > 25° | 25% |
| Asymmetry | Left knee angle − Right knee angle > 10° | 15% |

Each score = percentage of analyzed frames where the condition was flagged (0–100).

### AI Coaching (Gemini 2.0 Flash)

Risk scores, average joint angles, athlete profile, and movement type are sent to Gemini 2.0 Flash with a detailed physiotherapy prompt. The model returns structured JSON with clinical interpretation, coaching cues, exercise prescription, and a follow-up timeline.

The system degrades gracefully — if Gemini is unavailable, a clinically validated static fallback is returned automatically.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | FastAPI (Python) |
| Pose Detection | MediaPipe Pose v0.10 |
| Computer Vision | OpenCV |
| Numerical Analysis | NumPy |
| AI Coaching | Google Gemini 2.0 Flash |
| Frontend Framework | React 18 + Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| State Management | Zustand |
| Icons | Lucide React |

---

## Project Structure

```
InjuryLens/
├── backend/
│   ├── main.py              # FastAPI app, pose analysis, Gemini integration
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment variable template
└── frontend/
    ├── src/
    │   ├── screens/
    │   │   ├── UploadScreen.jsx    # Upload, movement selector, profile
    │   │   ├── LoadingScreen.jsx   # Animated skeleton + progress
    │   │   └── ResultsScreen.jsx   # Full results report
    │   ├── components/
    │   │   ├── Navbar.jsx          # Fixed top navigation
    │   │   ├── ErrorCard.jsx       # Styled error display
    │   │   ├── AnimatedBar.jsx     # Spring-animated risk bars
    │   │   ├── Accordion.jsx       # Expandable feedback sections
    │   │   └── RiskGauge.jsx       # SVG semi-circle gauge
    │   ├── App.jsx                 # Screen router with Framer Motion
    │   ├── store.js                # Zustand global state
    │   └── index.css               # Tailwind + custom design tokens
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## API Reference

### POST /analyze

Upload a video for biomechanical analysis.

**Form fields:**
- `file` — video file (MP4, MOV, AVI, max 100 MB)
- `movement_type` — e.g., "Squat"
- `fitness_level` — e.g., "Intermediate"
- `age_group` — e.g., "25–34"
- `goal` — e.g., "Injury Prevention"

**Response:** JSON with `movement_type`, `scores`, `supplementary`, `ai_coaching`, `annotated_frame`

### GET /health

Returns server status, MediaPipe version, uptime, and Gemini configuration status.

---

## PhysTech 2026 Hackathon

InjuryLens was built for the **PhysTech 2026 Hackathon**, a competition focused on applying emerging technology to sports medicine and human performance. The goal was to demonstrate that AI-assisted physiotherapy tools can be both technically rigorous and accessible to everyday athletes.

---

## Disclaimer

InjuryLens is an AI-assisted analytical tool intended for educational and informational purposes only. It does not constitute medical advice. Always consult a qualified physiotherapist or sports medicine professional before modifying your training, starting a new exercise program, or if you experience pain or discomfort.
