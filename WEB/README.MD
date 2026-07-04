# ILMA Project Documentation

This is the compact documentation for the ILMA project. It combines the project specification, feature inventory, AI specification, UML diagrams, architecture review, design notes, roadmap graph plan, frontend README, and tech stack notes into one smaller source-of-truth document.

## 1. What ILMA Is

ILMA is a bilingual learning platform for software engineering students. It helps learners choose a path, follow structured roadmaps, enroll in courses, track progress, and use AI for recommendations, roadmap generation, topic explanations, and chat support.

The platform has three main user groups:

| User | What they can do |
| --- | --- |
| Visitor | Browse public roadmaps/courses, choose language, contact support, sign up or log in. |
| Student | Manage profile/preferences, use dashboard, assign roadmaps, track steps, enroll in courses, use AI features. |
| Admin | Manage users, roadmaps, courses, contact messages, admin profile, and platform content. |

## 2. Product Scope

Implemented product areas:

- Authentication and account lifecycle.
- English/Arabic interface with language-aware routing.
- User profile, avatar, preferences, and dashboard.
- Roadmap templates, roadmap assignment, and step progress.
- Course catalog, enrollment, progress, completion, rating, and abandonment.
- AI recommendations, AI chat, topic explanation, and roadmap draft generation.
- Admin dashboard, user management, roadmap management, course management, and contact inbox.
- Contact/support flow with email integration.
- Swagger/OpenAPI docs and health endpoints.

Partial or planned areas:

- Pro/subscription access exists as data and request flow, but a payment provider is not fully integrated.
- Admin action logging exists, but a full audit-log UI may still be limited.
- Notifications, achievements, bookmarks/favorites, analytics dashboards, and CI/CD files are not complete product surfaces in the visible repo.
- External NestJS or Go ETL/microservice references are planning items unless they exist in a separate repo.

## 3. System Architecture

ILMA is a full-stack web application:

```text
Browser
  -> React + TypeScript SPA
  -> React Router loaders and pages
  -> TanStack Query hooks and API clients
  -> Express REST API
  -> Middleware: CORS, auth, roles, validation, rate limits
  -> Controllers and services
  -> Mongoose models
  -> MongoDB
  -> External services: email, OAuth, Cloudinary, Gemini/OpenAI
```

The frontend owns the user experience. The backend owns authentication, validation, business rules, persistence, AI provider access, and external integrations.

## 4. Repository Structure

| Path | Purpose |
| --- | --- |
| `WEB/frontend` | React/Vite frontend application. |
| `WEB/backend` | Express/MongoDB REST API. |
| `WEB/package.json` | Backend dependencies and scripts. |
| `WEB/frontend/package.json` | Frontend dependencies and scripts. |
| `WEB/vercel.json` | Backend Vercel serverless routing config. |
| `Specs` | Project documentation, diagrams, audits, design notes, and plans. |

Important backend folders:

| Folder | Purpose |
| --- | --- |
| `routes` | API route definitions and middleware chains. |
| `controllers` | HTTP request/response orchestration. |
| `services` | Business logic and provider integrations. |
| `services/ai` | AI provider, usage, chat, recommendations, prompts, parsers, and cache modules. |
| `models` | Mongoose schemas for user, roadmap, course, AI, contact, and admin data. |
| `validation` | Zod request schemas. |
| `middleware` | Auth, role authorization, validation, errors, and request guards. |
| `helpers` | Shared response, pagination, text, auth, date, and roadmap helpers. |
| `config` | Database, mailer, and Cloudinary setup. |
| `docs` | Swagger/OpenAPI generation. |
| `test` | Node test files. |

Important frontend folders:

| Folder | Purpose |
| --- | --- |
| `routes` | User, admin, and common page components. |
| `components` | UI, auth, dashboard, roadmap, profile, contact, admin, and model components. |
| `hooks` | Page hooks, query hooks, and user-flow helpers. |
| `libs` | API clients, React Query config, i18n setup, motion helpers. |
| `stores` | Zustand stores for UI/session/dashboard/chat state. |
| `context` | Language and theme providers. |
| `utils` | Fetch wrapper, route utilities, graph builder, lazy loading, browser helpers. |
| `locales` | English and Arabic translation JSON. |
| `style` | Global styles. |

## 5. Tech Stack

Frontend:

- React 19 for component UI.
- TypeScript for safer frontend code.
- Vite for development and production builds.
- React Router for nested routes, language routes, loaders, and protected navigation.
- TanStack React Query for server state, caching, and refetching.
- Zustand for lightweight shared UI/session state.
- Tailwind CSS for styling.
- i18next and react-i18next for English/Arabic localization.
- React Hook Form and Zod for forms and validation.
- Framer Motion for animations.
- `@xyflow/react` for roadmap graph visualization.
- Three.js for 3D visual elements.
- Sonner and Hugeicons for feedback and interface icons.

Backend:

- Node.js and Express 5 for the REST API.
- MongoDB and Mongoose for persistence.
- JWT, cookies, bcryptjs, and role middleware for authentication and authorization.
- Zod for API request validation.
- Nodemailer for transactional email.
- Cloudinary for media/avatar storage.
- Google OAuth library for Google login/signup.
- Google GenAI and OpenAI SDKs for AI provider access.
- Winston and Morgan for logging.
- Swagger JSDoc and Swagger UI for API documentation.
- express-rate-limit for sensitive and AI endpoint protection.

## 6. Core Feature Areas

### Authentication

The auth system supports signup, login, logout, refresh tokens, email verification, password reset, Google OAuth, password update, profile checks, account deactivation, and deletion/undo workflows.

Key ideas:

- Passwords are hashed.
- Refresh tokens are stored/validated securely.
- Protected routes check authentication and account status.
- Role checks separate student and admin access.
- Frontend loaders redirect users when auth, verification, or preferences are missing.

### Profile and Preferences

Students can manage identity, avatar, profile details, and learning preferences. Preferences include interests, goals, languages, skill level, learning pace, categories, difficulty, weekly study hours, and reminders.

These preferences feed dashboard personalization and AI recommendation logic.

### Dashboard

The student dashboard summarizes learning activity, roadmaps, courses, progress, streaks, and recommendations. It depends on backend aggregation plus frontend query/cache behavior.

### Roadmaps

Roadmaps are split into reusable templates and user-specific progress:

- `RoadmapTemplate` stores the reusable learning path.
- `UserRoadmap` stores a student's assigned roadmap.
- `UserRoadmapStepProgress` stores completion/progress per step.

Roadmap templates can be searched, assigned, published/unpublished, edited by admins, and generated through AI. The frontend renders roadmap graphs with `@xyflow/react`.

### Courses

Courses are catalog items with sections and lessons. Students can browse published courses, enroll, track lesson progress, complete courses, rate them, or abandon enrollment.

Course progress is stored separately from course content so many students can share the same course while keeping their own state.

### AI Features

AI is routed through the backend, not called directly from the frontend. This protects API keys and allows validation, rate limiting, usage tracking, parsing, and persistence.

AI capabilities:

- Personalized recommendations.
- AI roadmap draft generation.
- Saving AI-generated roadmaps.
- Topic explanation.
- AI chat with saved conversations.
- Admin roadmap draft generation.

Provider strategy:

- Gemini is the primary provider family.
- OpenAI-compatible calls are available as fallback.
- JSON outputs are parsed and normalized before becoming product data.
- AI usage is counted by feature and plan.

Known AI limits:

- Requests are synchronous.
- No queue/worker layer is visible.
- No prompt versioning UI or AI evaluation dashboard is visible.

### Admin

The admin area supports:

- Admin authentication.
- Overview counts and platform monitoring.
- User list, detail, updates, and deletion.
- Roadmap template CRUD and publish controls.
- Course CRUD and publication state.
- Contact message inbox and replies.
- Admin action logging.

### Contact and Support

Visitors or students can submit support messages. The backend stores the message, sends email notifications, and lets admins reply. Replies are stored and emailed back to the user.

## 7. API Surface

Main route groups:

| Prefix | Responsibility |
| --- | --- |
| `/api/health` | API health check. |
| `/api/docs` | Swagger/OpenAPI documentation. |
| `/api/auth` | User auth, profile, preferences, dashboard, account lifecycle. |
| `/api/roadmaps` | Public templates, search, assignment, progress, template management. |
| `/api/courses` | Published courses, enrollment, progress, completion, rating. |
| `/api/ai` | Recommendations, AI chat, roadmap drafts, topic explanation, AI access. |
| `/api/pro-access` | Student pro access request flow. |
| `/api/contact` | Public support/contact form. |
| `/api/admin` | Admin auth, users, roadmaps, courses, contact messages, logs. |
| `/api/system` | System/version information. |

The API uses a consistent JSON response style with success/failure status, messages, data, and validation errors where needed.

## 8. Data Model

Main model groups:

| Domain | Models |
| --- | --- |
| User | `User`, `UserProfile`, `UserPreference`, `UserActivity`. |
| Learning | `RoadmapTemplate`, `UserRoadmap`, `UserRoadmapStepProgress`, `Course`, `UserCourseProgress`. |
| AI | `UserAiUsage`, `UserAiConversation`, `UserAiMessage`. |
| Admin | `AdminActionLog`. |
| Support | `ContactMessage`. |
| Pro access | `ProAccessRequest`. |

Important modeling decision:

Reusable content is separated from learner state. For example, many learners can use the same roadmap template or course, but each learner has independent progress records.

## 9. Security and Reliability

Implemented protections and reliability choices:

- JWT authentication with cookie support.
- Password hashing with bcrypt.
- Role-based authorization.
- Zod validation before business logic.
- CORS restricted by configured origins.
- Rate limiting on sensitive/AI routes.
- Centralized error handling.
- Request body size configuration.
- MongoDB reconnect behavior before database-dependent API routes.
- Health endpoint for runtime checks.
- Swagger documentation for API visibility.
- Winston/Morgan logging.

Risks to keep in mind:

- Cookie-based auth should continue to be reviewed for CSRF behavior.
- AI, email, OAuth, MongoDB, and Cloudinary depend on correct environment variables.
- Synchronous AI calls can make requests slow when providers are slow.
- Large dashboards and recommendation queries can become expensive at scale.

## 10. UI and Design Notes

The design docs describe a dark-first "Green Deck" direction:

- Dark background and surface hierarchy.
- Bright green as the primary interactive accent.
- DM Sans for English and Cairo for Arabic.
- Compact cards, inputs, chips, lists, and navigation.
- Strong contrast for readability.

The roadmap graph plan describes a future/proposed roadmap.sh-like layout:

- Core roadmap milestones run down a vertical spine.
- Branch topics spread left and right from core steps.
- The layout uses `dependsOn` and `order` instead of database-stored coordinates.
- Core nodes and branch nodes get different visual weight.
- Edges should be cleaner, with main-path and branch-path styling.

## 11. Main User Flows

Signup flow:

```text
Visitor signs up -> backend validates uniqueness -> account created -> verification email sent -> user verifies -> account becomes active for protected flows
```

Learning flow:

```text
Student opens dashboard -> browses roadmap/course -> assigns roadmap or enrolls in course -> updates progress -> dashboard reflects progress
```

AI roadmap flow:

```text
Student enters goal -> backend checks AI access -> provider generates draft -> backend parses/validates draft -> student saves roadmap -> roadmap becomes user-owned learning content
```

Admin content flow:

```text
Admin logs in -> manages users/courses/roadmaps/messages -> backend validates and persists changes -> admin action log records important operations
```

Support flow:

```text
Visitor/student submits contact form -> backend stores message and emails support -> admin replies -> reply is stored and emailed to user
```

## 12. Development and Deployment

Backend commands from `WEB`:

```bash
npm run dev
npm start
npm test
```

Frontend commands from `WEB/frontend`:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

Production/deployment notes:

- Backend entry is `backend/server.js`.
- `WEB/vercel.json` routes requests to the backend server entry.
- Frontend is a Vite app and should be built before static deployment.
- Required environment variables include MongoDB, JWT, frontend origins, SMTP, Cloudinary, OAuth, and AI provider settings.

## 13. Testing and Documentation

Visible testing/documentation assets:

- Node backend tests for health, roadmap helpers, and AI chat model behavior.
- Swagger/OpenAPI endpoint under `/api/docs`.
- Postman collection for broader backend API testing.
- UML/SWE diagrams for system context, use cases, containers, data model, sequences, states, deployment, and route summary.

The default `WEB/frontend/README.md` is still mostly Vite template text. This project-level documentation should be preferred for explaining ILMA.

## 14. Technical Debt and Improvement Plan

Main improvement priorities from the architecture review:

1. Keep controller/service/helper boundaries clean.
2. Continue splitting large frontend pages/components into smaller feature components.
3. Keep AI code modular: provider, usage, prompts, parsers, chat, recommendations, and roadmap generation.
4. Wrap API calls consistently in React Query hooks.
5. Keep shared utilities in helpers instead of duplicating logic.
6. Add payment provider integration if subscriptions become a real business feature.
7. Add notifications, analytics dashboards, bookmarks/favorites, achievements, and CI/CD if they are product priorities.

Current source already appears more modular than some older docs describe. When there is a conflict, prefer the current `WEB/backend` and `WEB/frontend` source tree over older architecture notes.

## 15. Source Documents Condensed

| Source doc | What it contributed |
| --- | --- |
| `Specs/SPEC.md` | Product status, architecture, API inventory, data model, risks, roadmap. |
| `Specs/FEATURES.md` | Feature-by-feature inventory and missing/partial areas. |
| `Specs/AI_SPEC.md` | AI routes, provider fallback, limits, cache, chat, recommendations, and gaps. |
| `Specs/DOC.md` | Full reverse-engineering notes, business logic, diagrams, API examples, database details. |
| `Specs/UML_DIAGRAMS.md` | Use cases, system diagrams, sequence diagrams, state diagrams, route summary. |
| `Specs/ilma-architecture-review.md` | Refactor priorities, architecture risks, frontend/backend cleanup recommendations. |
| `Specs/green-deck-DESIGN.md` | Dark-first visual system, colors, typography, spacing, components. |
| `Specs/roamdmaps graph builder.md` | Proposed roadmap graph layout improvements. |
| `Specs/TECH_STACK_DOCUMENTATION.md` | Clean tech stack explanation and demo wording. |
| `WEB/frontend/README.md` | Vite, React Compiler, and ESLint template notes. |

## 16. Short Presentation Script

ILMA is a full-stack bilingual learning platform for software engineering students. The frontend is a React and TypeScript SPA built with Vite, React Router, TanStack Query, Zustand, Tailwind CSS, i18next, XYFlow, and Three.js. The backend is an Express API connected to MongoDB through Mongoose. It handles authentication, validation, role authorization, roadmaps, courses, AI features, admin operations, contact support, logging, health checks, and Swagger docs.

The most important architecture idea is that reusable learning content is separate from each learner's personal progress. Roadmap templates and courses can be shared across the platform, while user roadmap progress, course progress, preferences, AI usage, and conversations remain user-specific. AI is safely routed through the backend so the system can validate input, protect provider keys, track usage, parse output, and save generated content as normal platform data.

