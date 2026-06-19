# ILMA — AI-powered SWE Learning Recommendation System

**ILMA** (Arabic: **عِلْم** — meaning Knowledge) is a state-of-the-art, AI-powered course recommendation and roadmap personalization platform tailored specifically for Software Engineering (SWE) students and professionals in the Arabic-speaking region. 

The platform bridges the gap in structured career pathways by dynamically recommending courses, parsing markdown roadmaps, generating AI learning drafts, and providing live AI chat guidance.

---

## 🚀 Key Features

* **Multi-Format Roadmaps:** Browse curated public learning paths or parse custom roadmap templates from markdown descriptions.
* **Personalized AI Recommendations:** Customized course suggestions based on user profiles, study habits, skill level, and weekly study limits.
* **Interactive AI Chat Assistant:** Page-aware, course-aware, and roadmap-aware chat interface powered by Google Gemini and OpenAI.
* **Progress Tracking:** Interactive React Flow graph visualization for tracking course and milestone completions.
* **Secure Enterprise Auth:** Access and refresh token rotation, login streaks, secure HTTP-only cookies, and automated account lockout policies.
* **Bilingual Support:** Complete RTL (Arabic) and LTR (English) localization.

---

## 🛠️ Technology Stack

### Backend
* **Runtime:** Node.js (ES Modules)
* **Framework:** Express 5.x
* **Database:** MongoDB Atlas (via Mongoose 9 ODM)
* **Testing:** Native Node.js Test Runner (`node:test`)
* **Logging:** Winston (structured file + console logs)
* **AI SDKs:** Google Gen AI (`@google/genai`), OpenAI SDK

### Frontend
* **Core:** React 19, TypeScript 6.0, Vite 8.0
* **Styles:** TailwindCSS v4 + CSS custom variables
* **State Management:** Zustand 5.x (Auth, UI, Chat, Dashboard)
* **Data Fetching:** TanStack React Query 5.x
* **Routing:** React Router v7 (29 routes with route loaders/guards)
* **Visualizations:** `@xyflow/react` (React Flow), Three.js (3D logos), Framer Motion (micro-animations)

---

## 📂 Folder Structure

```text
ILMA/
├── backend/                  # Node.js + Express backend
│   ├── config/               # Database, Cloudinary, Mailer config
│   ├── controllers/          # Request delegation layer
│   ├── docs/                 # Swagger/OpenAPI documentation
│   ├── helpers/              # Text formatting, roadmap parsers, and errors
│   ├── middleware/           # Zod validation, JWT guards, error handles
│   ├── models/               # 14 Mongoose Database Collections
│   ├── routes/               # API Router endpoints
│   ├── services/             # Core business logic handlers
│   ├── test/                 # Integration and Unit Test suite
│   └── utils/                # Logger, cookie utilities, rate limiters
│
├── frontend/                 # React SPA frontend
│   ├── public/               # Static icons and bilingual translation assets
│   └── src/
│       ├── components/       # 3D models, auth pages, cards, and layouts
│       ├── context/          # Language/direction & theme providers
│       ├── hooks/            # React Query queries & mutation triggers
│       ├── libs/             # API Client wrappers, i18n configure
│       ├── routes/           # User pages & Admin panels
│       ├── stores/           # Zustand client stores
│       └── utils/            # Graph builders and router loaders
```

---

## ⚙️ Setup and Installation

### Prerequisites
* Node.js (v18+)
* MongoDB instance (Local or Atlas Cluster)
* Cloudinary API Credentials (for avatars)
* SMTP Server Credentials (for verification emails)
* Google Gemini / OpenAI API Keys

### Step 1: Clone and Configure environment variables
Create a `.env` file in the root directory:
```env
PORT=5000
NODE_ENV=development
DB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/ilma
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
FRONTEND_URL=http://localhost:5173
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
```

### Step 2: Install dependencies
Install root-level (backend) dependencies:
```bash
npm install
```

Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

---

## 🏃 Running the Application

### Start Backend (Dev Mode)
Runs the server with Nodemon auto-reload:
```bash
npm run dev
```

### Start Frontend
Run from the root or within the `frontend/` directory:
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Testing

The backend includes offline schema verification and health checks using Node's native test runner.

Run the test suite:
```bash
npm run test
```

Expected output:
```text
✔ UserAiMessage accepts user and assistant chat roles
✔ UserAiMessage accepts assistant roadmap and course links
✔ GET /api/health stays available without MongoDB
✔ POST /api/contact sends a templated email without MongoDB
✔ slugifyStepKey helper formats titles to kebab-case step keys
✔ ensureUniqueStepKeys guarantees unique step keys and sets default values
✔ parseRoadmapMarkdownToSteps parses headings and resources correctly
ℹ tests 21
ℹ pass 21
ℹ fail 0
```
