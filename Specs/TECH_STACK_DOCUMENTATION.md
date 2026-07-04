# ILMA Technical Stack Documentation

This document explains the main technologies used in the ILMA project, why each one was selected, and how the stack supports the production demo.

## 1. Project Overview

ILMA is a full-stack, AI-powered learning platform for software engineering students. It helps learners discover structured roadmaps, follow course content, track progress, receive AI recommendations, chat with an AI assistant, and manage their learning profile in Arabic and English.

The project is divided into two main applications:

- `WEB/frontend`: React and TypeScript single-page application.
- `WEB/backend`: Express and MongoDB REST API.

The frontend communicates with the backend through REST endpoints under `/api/*`. The backend handles authentication, user data, roadmaps, courses, AI features, admin operations, contact messages, and system health checks.

## 2. High-Level Architecture

```text
User Browser
  -> React SPA
  -> React Router pages and route loaders
  -> TanStack Query API hooks
  -> Fetch API wrapper
  -> Express REST API
  -> Middleware: CORS, auth, roles, validation, rate limits
  -> Controllers and services
  -> Mongoose models
  -> MongoDB
  -> External services: AI providers, email, Cloudinary
```

This architecture keeps the user interface, backend logic, database models, and external integrations clearly separated.

## 3. Frontend Stack

| Technology | Purpose in the Project |
| --- | --- |
| React 19 | Builds the user interface using reusable components. |
| TypeScript | Adds type safety to frontend code and reduces runtime mistakes. |
| Vite | Provides fast development server, bundling, and production builds. |
| React Router | Manages client-side routing, language routes, route loaders, and protected pages. |
| TanStack React Query | Handles server state, API caching, loading states, and data refetching. |
| Zustand | Stores lightweight client-side UI and session state. |
| Tailwind CSS 4 | Provides utility-first styling and responsive layout control. |
| i18next | Supports Arabic and English translations. |
| react-i18next | Connects i18next translation data with React components. |
| i18next-browser-languagedetector | Detects preferred browser language. |
| React Hook Form | Manages form state for login, signup, profile, contact, and admin forms. |
| Zod | Validates frontend form data using shared-style schemas. |
| Framer Motion | Adds page and component animations. |
| @xyflow/react | Renders roadmap graph visualizations. |
| Three.js | Supports 3D visual elements and interactive visual assets. |
| Sonner | Displays user feedback through toast notifications. |
| Hugeicons | Provides icon assets for the interface. |
| QRCode React | Generates QR codes where needed in the UI. |

### Frontend Responsibilities

The frontend is responsible for:

- Rendering the student and admin interfaces.
- Managing language-aware routes such as `/en` and `/ar`.
- Protecting pages with route loaders.
- Calling backend APIs through dedicated API modules.
- Displaying roadmap graphs, dashboard summaries, AI chat, course details, forms, and admin tables.
- Managing loading, error, and success states for user workflows.

### Important Frontend Folders

| Path | Responsibility |
| --- | --- |
| `WEB/frontend/src/routes` | Page-level route components for user, admin, and common screens. |
| `WEB/frontend/src/components` | Reusable UI, auth, dashboard, profile, roadmap, contact, and admin components. |
| `WEB/frontend/src/libs` | API clients, query client, i18n setup, and shared library utilities. |
| `WEB/frontend/src/hooks` | Custom React hooks for forms, auth flows, roadmap data, and queries. |
| `WEB/frontend/src/stores` | Zustand stores for UI, dashboard, auth session, and AI chat state. |
| `WEB/frontend/src/context` | Language and theme contexts. |
| `WEB/frontend/src/utils` | Route helpers, API wrapper, graph builder, browser utilities, and lazy loading helpers. |
| `WEB/frontend/src/locales` | Arabic and English translation files. |
| `WEB/frontend/src/style` | Global styling. |

## 4. Backend Stack

| Technology | Purpose in the Project |
| --- | --- |
| Node.js | Runs the backend JavaScript runtime. |
| Express 5 | Provides the REST API framework. |
| MongoDB | Stores application data. |
| Mongoose | Defines schemas and communicates with MongoDB. |
| Zod | Validates API request bodies before they reach business logic. |
| JSON Web Tokens | Handles secure authentication and session tokens. |
| cookie-parser | Reads and manages authentication cookies. |
| bcryptjs | Hashes and verifies user passwords. |
| CORS | Controls which frontend origins can access the API. |
| express-rate-limit | Protects sensitive and AI endpoints from excessive requests. |
| dotenv | Loads environment variables for local and production configuration. |
| Morgan | Logs HTTP requests during development. |
| Winston | Provides structured application logging. |
| Nodemailer | Sends verification, password reset, and contact-related emails. |
| Cloudinary | Stores uploaded media such as user avatars. |
| Google Auth Library | Supports Google OAuth login and signup. |
| OpenAI SDK | Integrates OpenAI-compatible AI features. |
| Google GenAI SDK | Integrates Gemini AI features. |
| Swagger JSDoc | Generates OpenAPI documentation from backend annotations. |
| Swagger UI Dist | Serves interactive API documentation. |
| Nano ID | Creates short unique IDs where needed. |

### Backend Responsibilities

The backend is responsible for:

- User signup, login, logout, email verification, password reset, and token refresh.
- Google OAuth authentication.
- Profile, preferences, and account lifecycle operations.
- Roadmap template browsing, roadmap assignment, and step progress tracking.
- Course listing, enrollment, progress, completion, rating, and abandonment.
- AI recommendations, AI chat, topic explanations, and roadmap generation.
- Admin dashboards, user management, course management, roadmap management, and contact message replies.
- Contact form handling and support workflows.
- API documentation, health checks, logging, validation, and error handling.

### Important Backend Folders

| Path | Responsibility |
| --- | --- |
| `WEB/backend/routes` | Defines API routes and attaches middleware. |
| `WEB/backend/controllers` | Handles HTTP request and response flow. |
| `WEB/backend/services` | Contains domain business logic and integrations. |
| `WEB/backend/services/ai` | Contains AI provider logic, prompts, parsers, chat, recommendations, cache, and usage handling. |
| `WEB/backend/models` | Mongoose models for users, roadmaps, courses, AI data, contact messages, and admin logs. |
| `WEB/backend/validation` | Zod schemas for request validation. |
| `WEB/backend/middleware` | Authentication, authorization, validation, and centralized error handling. |
| `WEB/backend/helpers` | Shared helpers for responses, pagination, auth, dates, roadmap logic, and text handling. |
| `WEB/backend/config` | Database, mailer, and Cloudinary configuration. |
| `WEB/backend/utils` | Logging, rate limiting, token helpers, and email templates. |
| `WEB/backend/docs` | Swagger/OpenAPI documentation setup. |
| `WEB/backend/test` | Node test files for health checks, AI chat models, and roadmap helpers. |

## 5. API and Routing Stack

The backend exposes REST endpoints grouped by product domain.

| Route Prefix | Main Responsibility |
| --- | --- |
| `/api/health` | Confirms that the API is running. |
| `/api/docs` | Serves Swagger/OpenAPI documentation. |
| `/api/auth` | Handles authentication, profile, preferences, and account lifecycle. |
| `/api/roadmaps` | Handles roadmap templates, roadmap search, user assignment, and progress. |
| `/api/courses` | Handles courses, enrollment, progress, completion, and ratings. |
| `/api/ai` | Handles AI recommendations, chat, explanations, roadmap drafts, and AI access. |
| `/api/pro-access` | Handles student requests for pro access. |
| `/api/contact` | Handles public contact messages and support requests. |
| `/api/admin` | Handles admin authentication, users, courses, roadmaps, and messages. |
| `/api/system` | Handles system and version information. |

## 6. Database Stack

ILMA uses MongoDB with Mongoose. The database design separates reusable platform content from each user's personal state.

| Model Area | Example Responsibility |
| --- | --- |
| User account | Credentials, roles, status, verification, streak, and account lifecycle. |
| User profile | Public user information and avatar. |
| User preferences | Learning goals, interests, level, pace, language, and weekly study hours. |
| Roadmap template | Reusable learning path managed by admins or generated through AI. |
| User roadmap | A roadmap assigned to a specific learner. |
| Step progress | Completion state for each roadmap step. |
| Course | Published course catalog data. |
| User course progress | Enrollment, completion, progress, rating, and course state. |
| AI usage | Tracks AI feature usage and limits. |
| AI conversation/message | Stores AI assistant conversations and message history. |
| Contact message | Stores support requests and admin replies. |
| Admin action log | Records important admin actions. |

This separation allows the same roadmap or course to be reused by many learners while each learner keeps independent progress.

## 7. AI Stack

ILMA includes AI features as a controlled backend capability, not as direct frontend calls to AI providers.

| AI Area | Technical Role |
| --- | --- |
| Provider integration | Connects to Gemini and OpenAI-compatible providers. |
| Recommendation engine | Generates personalized learning recommendations from user progress and preferences. |
| AI chat | Stores conversations and messages while injecting relevant learning context. |
| Topic explanation | Explains roadmap topics to help learners understand next steps. |
| Roadmap generation | Produces AI roadmap drafts that can be parsed, validated, and saved. |
| Usage metering | Tracks access and limits for AI features. |
| Rate limiting | Reduces abuse risk on AI endpoints. |
| Prompt modules | Keeps AI prompts organized by feature. |
| Parsers | Normalizes generated content into application data structures. |

Demo wording:

> "AI features are routed through the backend so we can validate input, protect API keys, rate-limit requests, track usage, parse generated output, and save useful results into the normal data model."

## 8. Authentication and Security Stack

Security is handled across both frontend and backend.

| Layer | Implementation |
| --- | --- |
| Password security | Passwords are hashed with `bcryptjs`. |
| Session handling | JWT tokens and cookies support authenticated sessions. |
| Protected API routes | Backend middleware verifies authenticated users. |
| Role authorization | Role checks separate student and admin capabilities. |
| Protected frontend pages | React Router loaders redirect users based on auth state. |
| Request validation | Zod schemas validate incoming API payloads. |
| CORS | Allowed origins are configured through environment variables. |
| Rate limiting | AI and sensitive endpoints can be limited by request frequency. |
| Body size control | Request body size is configurable. |
| Error handling | Centralized error middleware returns consistent responses. |

## 9. DevOps and Production Stack

| Area | Technology or File |
| --- | --- |
| Backend production start | `npm start` from `WEB`. |
| Backend development | `npm run dev` from `WEB`. |
| Backend tests | `npm test` from `WEB`. |
| Frontend development | `npm run dev` from `WEB/frontend`. |
| Frontend build | `npm run build` from `WEB/frontend`. |
| Frontend preview | `npm run preview` from `WEB/frontend`. |
| Deployment config | `WEB/vercel.json`. |
| Runtime config | Environment variables loaded through `dotenv`. |
| API health check | `/api/health`. |
| API documentation | `/api/docs`. |

The backend is configured to run on Vercel using `backend/server.js` as the server entry point.

## 10. Why This Stack Fits ILMA

This stack fits the product because:

- React and Vite provide a fast and maintainable user interface.
- TypeScript improves frontend reliability.
- React Router supports protected, language-aware navigation.
- TanStack Query makes API-driven screens easier to cache and refresh.
- Express provides a straightforward REST API structure.
- MongoDB and Mongoose work well for user progress, roadmaps, AI conversations, and flexible learning content.
- Zod improves input safety across forms and API routes.
- JWT, cookies, role middleware, and route loaders support secure access control.
- AI provider modules keep AI integrations behind the backend.
- Swagger docs, health checks, logging, and tests support production readiness.

## 11. Short Demo Explanation

Use this short script when explaining the tech stack during the production demo:

> "ILMA is built with a React and TypeScript frontend powered by Vite, React Router, TanStack Query, Tailwind CSS, i18next, Zustand, and visualization libraries such as XYFlow and Three.js. The backend is an Express API connected to MongoDB through Mongoose. It uses JWT authentication, cookies, Zod validation, role-based authorization, rate limiting, Winston logging, Swagger documentation, email integration, Cloudinary uploads, and AI provider integrations with Gemini and OpenAI. The important architecture decision is that the frontend focuses on user experience, while the backend owns security, validation, persistence, AI access, and business logic."

