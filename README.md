# Atlas AI Resume — "Talk with my Resume."

Atlas AI Resume is a production-quality, ultra-premium, full-stack AI Resume Portal. Designed with a futuristic dark glassmorphic design and smooth micro-interactions, the portal allows recruiters to explore Kartik Raikar's resume interactively, view high-fidelity printable layouts, and chat with **Atlas AI**—an intelligent agent trained on his official credentials, projects, and achievements.

## 🚀 Key Features

- **Interactive PDF Viewer**: Displays a high-fidelity, fully typeset responsive resume with page pagination, real-time keyword highlights, zoom controls, and a direct download/print trigger.
- **SaaS Dashboard (Extra Tabs)**:
  - **Projects Console**: Interactive grid showcasing Kartik's systems with a dedicated "Ask AI" trigger that automatically focuses the chat agent on that specific project.
  - **Credentials Directory**: Verified list of professional accreditations from Google Developers, Kaggle, and Harvard.
  - **Visual Skills Gauge**: Glowing interactive skill bars representing programming languages and ML frameworks.
  - **Recruiter Telemetry Console**: Real-time telemetry tracking visits, questions asked, project exploration, resume downloads, and session durations with beautiful interactive SVG area charts.
  - **RAG Index Studio**: Admin interface enabling dragging and dropping of custom text/files to chunk and embed into the active local index in real-time.
  - **Direct Engagement**: Connect card with one-click recruiter mail invitation drafting.
- **Floating AI Chatbot (Atlas AI)**:
  - Slides open with a spring animation and glowing gradient frames.
  - Features typing indicators, auto-scroll, message timestamps, and suggested follow-up questions.
  - Custom markdown, tables, bullet-list rendering, and syntax-highlighted code panels.
  - Displays dynamic **Confidence Scores** & clickable **Source Citations** (e.g. `Resume.pdf`, `README.md`, `Certificate.pdf`).
    

## 🛠️ Full-Stack Technology Stack

### Frontend Architecture
- **React 19** & **Vite**: Ultra-fast hot-reloading development and static generation.
- **TypeScript**: Complete strict type-safety across components.
- **Tailwind CSS v4**: Modern, hardware-accelerated fluid utility grids.
- **Lucide React**: Clean, lightweight vector indicators.

### Backend & RAG pipeline
- **Express.js (Node)**: High-performance, low-latency API proxy and asset server.
- **Gemini AI API (`gemini-3.5-flash`)**: Orchestrates advanced semantic responses, custom role parameters, and factual compliance.
- **Vector Embeddings (`gemini-embedding-2-preview`)**: Dynamically chunks and embeds resume assets during server startup or admin uploads.
- **Dual-Engine Search**: Performs cosine similarity vector lookups with automatic fallback to keyword term overlap to guarantee offline reliability.
- **Server-Sent Events (SSE)**: Streams chatbot responses word-by-word for a fluid, ChatGPT-like conversational experience.

## 📂 Project Directory Structure

```text
/
├── server.ts                    # Full-stack Express.js server (APIs + RAG + Analytics + Vite middleware)
├── index.html                   # HTML entrypoint
├── package.json                 # Dependency manifests and build scripts
├── tsconfig.json                # TS compiler configuration
├── vite.config.ts               # Vite bundler options
├── .env.example                 # Environment configuration template
│
└── src/
    ├── main.tsx                 # Client entrypoint
    ├── App.tsx                  # Master UI view coordinator and tracking manager
    ├── index.css                # Tailwind CSS core directives
    │
    ├── data/
    │   └── resumeData.ts        # Single source of truth for Kartik's structured credentials
    │
    └── components/
        ├── Navbar.tsx           # Glassmorphic top navigation header
        ├── PDFViewer.tsx        # High-fidelity document viewer with real-time text highlight
        ├── Dashboard.tsx        # Projects, credentials, skills, admin panel, & SVG analytics charts
        └── Chatbot.tsx          # Floating assistant panel, RAG streaming client, and markdown parser
```


## ⚙️ Environment Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kartikraikar2005/atlas-ai-resume.git
   cd atlas-ai-resume
   ```

2. **Configure environment variables**:
   Create a `.env` file in the root directory (using `.env.example` as a template):
   ```env
   # Your Google AI Studio API Key (for Gemini and embeddings)
   GEMINI_API_KEY="AIzaSy..."
   
   # Current Deployment URL
   APP_URL="http://localhost:3000"
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   *The server runs on port 3000, hosting both the backend REST endpoints and the client-side compiler.*

5. **Build and start in Production**:
   ```bash
   npm run build
   npm start
   ```


## ☁️ Production Deployment Walkthrough

To accommodate different platform designs, Kartik's portfolio is built with decoupled microservice compatibility:

### Option A: Unified Container (Render / Cloud Run)
Because the codebase compiles the entire app into a single, high-performance Node bundle, you can deploy it directly to **Render** or **Google Cloud Run** using a Docker container:
- Set Build Command: `npm run build`
- Set Start Command: `npm start`
- Inject Environment Variable: `GEMINI_API_KEY`

### Option B: Decoupled Deploy (Vercel + Python/FastAPI backend)
If you prefer deploying the frontend as static files to Vercel and hosting a separate Python backend:

#### 1. Frontend (Vercel)
- Set Framework Preset: `Vite`
- Root Directory: `.`
- Build Command: `npm run build` (outputs to `dist/`)
- Outputs static files which can be served for free on Vercel Edge.

#### 2. Backend (FastAPI / Render)
We provide a Python transition outline for a matching FastAPI backend:
```python
# main.py (FastAPI RAG Backend)
import os
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from google import genai
import numpy as np

app = FastAPI()
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# Add matching endpoints: /api/analytics, /api/track, /api/admin/upload, and /api/chat
```
For embeddings, compute cosine similarities using numpy:
```python
def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
```




## 🏆 Crafted for Premium Engineering Evaluation

Atlas AI Resume bypasses cheap standard templates. The layout operates with **Desktop-First Precision** scaling into **Mobile-First Responsive Grids**, maintaining high visual contrast, elegant spacing, and custom-engineered analytical gauges.
