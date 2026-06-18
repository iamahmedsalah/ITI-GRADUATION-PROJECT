# ILMA Platform — Architecture Review & Refactoring Guide

---

## 1. Current Architecture Overview

### Backend (Express + MongoDB/Mongoose)

```
backend/
├── app.js                          # Express app setup, CORS, route mounting
├── server.js                       # HTTP server entry
├── config/
│   ├── cloudinary.js               # Image upload config
│   ├── database.js                 # MongoDB connection
│   └── mailer.js                   # Nodemailer transport
├── middleware/
│   ├── adminValidators.js          # 14.9 KB — admin input validation
│   ├── authValidators.js           # 13.9 KB — auth input validation
│   ├── contactValidators.js        #  1.5 KB
│   ├── courseValidators.js          #  5.6 KB
│   ├── errorHandler.js             #  1.4 KB — centralized error handler
│   ├── protectsRoutes.js           #  3.5 KB — JWT protect + role auth
│   └── roadmapValidators.js        # 12.9 KB
├── models/
│   ├── admin/adminActionLogModel.js
│   ├── contact/contactMessageModel.js
│   ├── course/courseModel.js
│   ├── roadmap/roadmapTemplateModel.js
│   └── user/ (10 model files)
├── routes/
│   ├── admin.route.js              # 20.7 KB
│   ├── ai.route.js                 #  8.6 KB
│   ├── auth.route.js               #  8.1 KB
│   ├── contact.route.js            #  1.5 KB
│   ├── courses.route.js            #  5.4 KB
│   └── roadmaps.route.js          # 13.3 KB
├── services/
│   ├── admin.service.js            # 52.7 KB — 1,853 lines  ⚠️
│   ├── ai.service.js               # 76.0 KB — 2,561 lines  🚨
│   ├── contact.service.js          #  3.5 KB
│   ├── courses.service.js          # 13.0 KB
│   ├── roadmaps.service.js         # 32.4 KB — 1,168 lines  ⚠️
│   └── users.service.js            # 54.8 KB — 1,824 lines  ⚠️
└── utils/
    ├── emailsTemplate.js           # 22.6 KB — HTML email templates
    ├── generateTokenSetCookie.js
    ├── logger.js
    └── rateLimiter.js
```

### Frontend (React + TypeScript + Vite)

```
frontend/src/
├── App.tsx / main.tsx / router.tsx
├── context/
│   ├── LanguageContext.tsx          # i18n + direction + SEO
│   └── ThemeContext.tsx             # light/dark/system preference
├── hooks/                          # 9 custom hooks (auth pages, forms)
├── libs/
│   ├── admin-api.ts                # 18.0 KB — admin API functions
│   ├── ai-api.ts                   #  8.5 KB — AI feature API
│   ├── contact-api.ts
│   ├── courses-api.ts
│   ├── i18n.ts
│   ├── motionVariants.ts
│   ├── react-query.ts              # QueryClient + auth fetchers
│   ├── roadmaps-api.ts             #  6.4 KB
│   └── user-api.ts                 # 11.1 KB — dashboard/profile/prefs API
├── components/
│   ├── auth/
│   ├── common/
│   ├── contact/
│   ├── dashboard/
│   │   ├── DashboardSections.tsx   # 44.3 KB  🚨
│   │   └── LearningConstellation.tsx # 28.0 KB
│   ├── landing/
│   ├── models/
│   ├── profile/
│   └── ui/ (26 component files)
├── routes/
│   ├── admin/
│   ├── common/
│   └── user/
├── types/
│   ├── roadmap.ts
│   └── validationSchemas.ts
├── utils/
│   ├── api.ts                      # Fetch wrapper, token management
│   ├── backendResponseMessage.ts
│   ├── route-utils.ts              # Route loaders/guards
│   └── routes.lazy.ts              # Lazy-loaded route components
├── locales/
└── style/
```

---

## 2. Architectural Problems Identified

### 2.1 Backend: Giant "Service" Files Are Actually Controllers

> [!CAUTION]
> **The #1 structural problem.** Every service file exports functions with the signature `(req, res) => { ... }` — they receive Express request/response objects, parse query params, format JSON responses, and handle HTTP status codes. These are **controllers**, not services.

| File | Lines | Responsibilities Mixed In |
|------|------:|---------------------------|
| [ai.service.js](file:///d:/Ahmed-Salah/ITI/ITI-GRAD-PROJECT/WEB/backend/services/ai.service.js) | 2,561 | AI provider clients (Gemini/OpenAI), prompt templates, JSON parsing, recommendation scoring engine, usage metering, TTL cache, chat conversation CRUD, HTTP response formatting |
| [users.service.js](file:///d:/Ahmed-Salah/ITI/ITI-GRAD-PROJECT/WEB/backend/services/users.service.js) | 1,824 | OAuth flow (Google), JWT/cookie management, email sending, signup/login/reset/verify, profile CRUD, preferences, dashboard aggregation, account deletion lifecycle, HTTP response formatting |
| [admin.service.js](file:///d:/Ahmed-Salah/ITI/ITI-GRAD-PROJECT/WEB/backend/services/admin.service.js) | 1,853 | Admin auth (duplicate login/reset flow), user management CRUD, course CRUD, roadmap management, contact message management, admin action logging, HTTP response formatting |
| [roadmaps.service.js](file:///d:/Ahmed-Salah/ITI/ITI-GRAD-PROJECT/WEB/backend/services/roadmaps.service.js) | 1,168 | Template CRUD, user assignment, step progress, markdown parsing, search/filter, HTTP response formatting |

**Why this is dangerous:**
- Cannot unit-test business logic without mocking `req`/`res`
- Cannot reuse service logic across controllers (e.g., admin needs to call user service logic)
- AI agents editing one feature risk breaking unrelated features in the same file
- A single merge conflict in `ai.service.js` could block the entire AI domain

### 2.2 Backend: Duplicated Logic Across Services

| Pattern | Where |
|---------|-------|
| `escapeRegex()` helper | Defined identically in `ai.service.js`, `admin.service.js`, `roadmaps.service.js` |
| Login flow (password check, lockout, streak, token issue) | `users.service.js` L762–880 AND `admin.service.js` L107–198 |
| `normalizePagination()` | `admin.service.js` only, but needed in `roadmaps.service.js` and `courses.service.js` too |
| `toPublicUser()` / `toPublicAdmin()` | Nearly identical serializers in two files |
| Error response shape `{ success, message, error }` | Repeated in every handler — no shared response builder |
| `slugifyStepKey()` | `roadmaps.service.js` L7–12 AND `ai.service.js` L161–165 (as `slugify`) |
| `REFRESH_TOKEN_MAX_AGE_MS` | Defined in both `users.service.js` and `admin.service.js` |

### 2.3 Backend: AI Code Is a Monolith

[ai.service.js](file:///d:/Ahmed-Salah/ITI/ITI-GRAD-PROJECT/WEB/backend/services/ai.service.js) contains **7 completely distinct subsystems** in a single file:

1. **AI Provider Abstraction** (L476–909) — Gemini & OpenAI config, client creation, fallback chain, JSON/text call wrappers
2. **Usage Metering & Limits** (L15–466) — Monthly usage tracking, reservation/release pattern, subscription checks
3. **Recommendation Scoring Engine** (L911–1411) — Term matching, course/roadmap scoring, signal extraction, next-step logic
4. **Roadmap Draft Generation** (L1500–1667) — Prompt building, AI call, step sanitization, draft construction
5. **Topic Explanation** (L1881–1961) — Prompt building, AI call, response sanitization
6. **Chat System** (L1963–2540) — Conversation CRUD, message history, catalog search, context injection, system prompts
7. **TTL Cache Infrastructure** (L92–138) — Generic in-memory TTL cache

### 2.4 Backend: No Controller Layer

Routes import directly from services and pass functions as route handlers:

```js
// ai.route.js
import { getAiRecommendations, ... } from "../services/ai.service.js";
router.get("/recommendations", authorizeRoles("student"), getAiRecommendations);
```

The route file also contains Zod validation schemas (`roadmapDraftSchema`, etc.) and a `validateBody()` middleware factory — mixing validation concern with routing.

### 2.5 Frontend: Oversized Component Files

| File | Size | Problem |
|------|------|---------|
| [DashboardSections.tsx](file:///d:/Ahmed-Salah/ITI/ITI-GRAD-PROJECT/WEB/frontend/src/components/dashboard/DashboardSections.tsx) | 44.3 KB | Likely contains multiple dashboard sections (activity, courses, roadmaps, recommendations) in a single component |
| [LearningConstellation.tsx](file:///d:/Ahmed-Salah/ITI/ITI-GRAD-PROJECT/WEB/frontend/src/components/dashboard/LearningConstellation.tsx) | 28.0 KB | Large visualization component |
| [navbar.tsx](file:///d:/Ahmed-Salah/ITI/ITI-GRAD-PROJECT/WEB/frontend/src/components/ui/navbar.tsx) | 21.4 KB | Navbar with inline auth logic, mobile menu, language switching |

### 2.6 Frontend: Unclear State Boundaries

Currently the app uses:
- **React Query** — for auth check (`fetchCurrentUser`), but API calls are plain functions not wrapped in `useQuery`/`useMutation` hooks at the lib layer
- **Context** — Language and Theme only
- **Module-level variable** — `accessToken` stored in `api.ts` as a closure variable (not reactive)

**Missing state management for:**
- Current user session (scattered between route loaders, React Query cache, and module-level token)
- UI state like sidebar open/close, modal visibility, toast notifications
- AI chat active conversation selection
- Dashboard filter/tab state

### 2.7 Frontend: Route Loaders Duplicate Auth Logic

[route-utils.ts](file:///d:/Ahmed-Salah/ITI/ITI-GRAD-PROJECT/WEB/frontend/src/utils/route-utils.ts) has 5 nearly identical loader functions (`dashboardLoader`, `preferencesLoader`, `profileLoader`, `authPageLoader`, `adminProtectedLoader`) that all:
1. Normalize language
2. Redirect if language param is wrong
3. Fetch user from React Query
4. Check verified/preferences status
5. Redirect to login on failure

---

## 3. Frontend Recommendations

### 3.1 State Management: React Query + Zustand + Context

#### What Stays in React Query (Server/Cache State)

Everything that comes from the API and benefits from caching, background refetch, and stale-while-revalidate:

| Query Key | Data | Currently |
|-----------|------|-----------|
| `['auth', 'me']` | Current user object | ✅ Already in RQ |
| `['dashboard', 'summary']` | Dashboard aggregation | ❌ Direct fetch |
| `['ai', 'recommendations']` | Personalized recommendations | ❌ Direct fetch |
| `['ai', 'access']` | AI feature access/limits | ❌ Direct fetch |
| `['ai', 'chat', 'conversations']` | Chat conversation list | ❌ Direct fetch |
| `['ai', 'chat', conversationId, 'messages']` | Chat messages | ❌ Direct fetch |
| `['roadmaps', 'templates']` | Public roadmap templates | ❌ Direct fetch |
| `['roadmaps', 'my']` | User's assigned roadmaps | ❌ Direct fetch |
| `['courses', slug]` | Course detail | ❌ Direct fetch |
| `['preferences']` | User preferences | ❌ Direct fetch |
| `['admin', 'overview']` | Admin dashboard stats | ❌ Direct fetch |

**Action:** Create custom hook files that wrap API calls in `useQuery`/`useMutation`:

```
hooks/
├── queries/
│   ├── useAuth.ts              # useCurrentUser, useAdminUser
│   ├── useDashboard.ts         # useDashboardSummary
│   ├── useAiAccess.ts          # useAiFeatureAccess
│   ├── useAiRecommendations.ts
│   ├── useAiChat.ts            # useConversations, useMessages
│   ├── useRoadmaps.ts          # useTemplates, useMyRoadmaps
│   ├── useCourses.ts
│   └── usePreferences.ts
├── mutations/
│   ├── useAuthMutations.ts     # useLogin, useSignup, useLogout
│   ├── useProfileMutations.ts
│   ├── useAiMutations.ts       # useGenerateDraft, useSaveDraft, useSendMessage
│   └── useRoadmapMutations.ts  # useAssignRoadmap, useUpdateStep
```

#### What Moves to Zustand (Client/UI/Session State)

Zustand is valuable here specifically for **non-server, non-persistent UI state** that is shared across multiple components but doesn't belong in React Query or Context:

```ts
// stores/useUiStore.ts
interface UiStore {
  sidebarOpen: boolean
  toggleSidebar: () => void

  activeModal: string | null
  openModal: (id: string) => void
  closeModal: () => void

  toasts: Toast[]
  addToast: (toast: Toast) => void
  removeToast: (id: string) => void
}

// stores/useAiChatStore.ts
interface AiChatStore {
  activeConversationId: string | null
  setActiveConversation: (id: string | null) => void

  draftMessage: string
  setDraftMessage: (msg: string) => void

  isSending: boolean
  setIsSending: (v: boolean) => void
}

// stores/useDashboardStore.ts
interface DashboardStore {
  activeTab: 'overview' | 'roadmaps' | 'courses' | 'activity'
  setActiveTab: (tab: string) => void

  roadmapFilter: RoadmapFilterState
  setRoadmapFilter: (f: Partial<RoadmapFilterState>) => void
}
```

**Why Zustand over Context for these?**
- Context re-renders every consumer on any state change. For a sidebar toggle or toast list, this causes unnecessary re-renders across the whole tree.
- Zustand gives selector-based subscriptions: `const sidebarOpen = useUiStore(s => s.sidebarOpen)` — only components reading `sidebarOpen` re-render when it changes.
- No need for provider nesting. The store is importable anywhere.

#### What Stays in Context

| Context | Reason |
|---------|--------|
| `LanguageContext` | ✅ Keep — Drives i18n, document direction, SEO meta. Needs Provider for `useEffect` lifecycle + overlay. |
| `ThemeContext` | ✅ Keep — Drives document `data-theme` attribute + favicon. Needs Provider for `matchMedia` listener lifecycle. |

These are **app-wide configuration** that legitimately need React tree integration. Don't move to Zustand.

### 3.2 Recommended Frontend Folder Structure

```
frontend/src/
├── app/
│   ├── App.tsx
│   ├── main.tsx
│   └── router.tsx
├── components/
│   ├── ui/                     # Reusable primitives (Button, Input, Modal, Toast)
│   ├── layout/                 # Navbar, Sidebar, Footer, PageHeader
│   ├── auth/                   # LoginForm, SignupForm, VerifyEmail
│   ├── dashboard/
│   │   ├── DashboardOverview.tsx
│   │   ├── DashboardRoadmaps.tsx
│   │   ├── DashboardCourses.tsx
│   │   ├── DashboardActivity.tsx
│   │   └── DashboardRecommendations.tsx
│   ├── ai/
│   │   ├── AiRoadmapGenerator.tsx
│   │   ├── AiDraftPreview.tsx
│   │   ├── AiChat.tsx
│   │   ├── AiChatSidebar.tsx
│   │   └── AiTopicExplanation.tsx
│   ├── roadmaps/               # RoadmapGraph, StepDetail, RoadmapCard
│   ├── courses/                # CourseCard, CourseSections
│   ├── profile/                # ProfileForm, AvatarUpload, AccountSettings
│   └── admin/                  # Admin-specific components
├── pages/                      # Route-level page components (thin wrappers)
│   ├── user/
│   │   ├── DashboardPage.tsx
│   │   ├── AiRoadmapPage.tsx
│   │   ├── AiChatPage.tsx
│   │   ├── RoadmapPage.tsx
│   │   ├── CoursePage.tsx
│   │   └── ProfilePage.tsx
│   ├── admin/
│   └── common/
├── hooks/
│   ├── queries/                # useQuery wrappers
│   └── mutations/              # useMutation wrappers
├── stores/                     # Zustand stores
│   ├── useUiStore.ts
│   ├── useAiChatStore.ts
│   └── useDashboardStore.ts
├── api/                        # API client functions (renamed from libs/*-api.ts)
│   ├── client.ts               # Fetch wrapper (current api.ts)
│   ├── auth.ts
│   ├── ai.ts
│   ├── roadmaps.ts
│   ├── courses.ts
│   ├── admin.ts
│   └── contact.ts
├── context/                    # Only Language + Theme
├── types/                      # Shared TypeScript types
├── utils/                      # Pure utility functions
├── locales/
└── styles/
```

### 3.3 Key Frontend Refactors

**Split `DashboardSections.tsx` (44 KB)** into 4–5 focused components by section type. Each section gets its own file, its own `useQuery` hook, and its own loading/error state.

**Create a `useProtectedRoute` hook** to eliminate the 5 duplicated loader functions in `route-utils.ts`:

```ts
// hooks/useProtectedRoute.ts
function useProtectedRoute(options?: { requireVerified?: boolean; requirePreferences?: boolean }) {
  // Shared auth check + redirect logic
}
```

**Move `accessToken` from module variable to Zustand auth store** — makes it reactive and inspectable by DevTools.

---

## 4. Backend Recommendations

### 4.1 Target Architecture: Controller → Service → Repository

```
backend/
├── app.js
├── server.js
├── config/
├── controllers/                # NEW — Handle req/res, call services
│   ├── auth.controller.js
│   ├── ai.controller.js
│   ├── roadmap.controller.js
│   ├── course.controller.js
│   ├── admin.controller.js
│   └── contact.controller.js
├── services/                   # REFACTORED — Pure business logic (no req/res)
│   ├── auth.service.js         # signup, login, verify, reset
│   ├── user.service.js         # profile, preferences, dashboard
│   ├── ai/                     # SPLIT — see Section 5
│   │   ├── provider.js
│   │   ├── usage.js
│   │   ├── recommendations.js
│   │   ├── roadmap-draft.js
│   │   ├── topic-explain.js
│   │   └── chat.js
│   ├── roadmap.service.js
│   ├── course.service.js
│   ├── admin.service.js        # admin-specific business logic
│   └── contact.service.js
├── repositories/               # NEW — Database access layer
│   ├── user.repository.js
│   ├── roadmap.repository.js
│   ├── course.repository.js
│   └── activity.repository.js
├── middleware/
│   ├── validate.js             # Generic Zod validator factory
│   ├── auth.js                 # protect + authorizeRoles
│   └── errorHandler.js
├── validation/                 # NEW — Zod schemas organized by domain
│   ├── auth.schemas.js
│   ├── ai.schemas.js
│   ├── roadmap.schemas.js
│   ├── course.schemas.js
│   └── admin.schemas.js
├── helpers/                    # NEW — Shared pure utilities
│   ├── response.js             # buildSuccess(), buildError()
│   ├── pagination.js           # normalizePagination()
│   ├── text.js                 # escapeRegex(), slugify(), normalizeText()
│   └── date.js                 # getMonthlyUsageStart(), getStreakDateKey()
├── models/
├── routes/
├── mails/
└── utils/
```

### 4.2 Layer Responsibilities

| Layer | Knows About | Does NOT Know About |
|-------|-------------|---------------------|
| **Route** | Express router, middleware chain | Business logic, DB |
| **Controller** | `req`/`res`, calls service, formats HTTP response | Mongoose models, DB queries |
| **Service** | Business rules, calls repository, throws typed errors | Express, `req`/`res`, HTTP status codes |
| **Repository** | Mongoose model queries, projections, pagination | Business rules, HTTP |
| **Helper** | Nothing (pure functions) | Everything else |

### 4.3 Shared Response Builder

Replace the repeated `{ success, message, data }` pattern:

```js
// helpers/response.js
export const ok = (res, data, message = 'Success', status = 200) =>
  res.status(status).json({ success: true, message, data })

export const created = (res, data, message = 'Created') =>
  ok(res, data, message, 201)

export const fail = (res, status, message, errors = null) =>
  res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) })

export const serverError = (res, error, fallbackMessage = 'Internal server error.') =>
  res.status(error.status || 500).json({
    success: false,
    message: error.status ? error.message : fallbackMessage,
    ...(process.env.NODE_ENV !== 'production' ? { error: error.message } : {}),
  })
```

### 4.4 Typed Service Errors

Replace ad-hoc `error.status = 402; throw error;` with typed errors:

```js
// helpers/errors.js
export class AppError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
    this.isOperational = true
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found.') { super(404, message) }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden.') { super(403, message) }
}

export class PaymentRequiredError extends AppError {
  constructor(message = 'Requires Pro subscription.') { super(402, message) }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed.', errors = []) {
    super(400, message)
    this.errors = errors
  }
}
```

---

## 5. AI-Specific Structure

### Current: 1 file, 2,561 lines, 7 subsystems

### Recommended: Domain module with clear boundaries

```
backend/services/ai/
├── index.js                    # Re-exports public API
├── provider.js                 # AI provider abstraction
│   ├── getGeminiConfig()
│   ├── getOpenAiConfig()
│   ├── callAiJson()            # Multi-provider JSON with fallback chain
│   ├── callAiText()            # Multi-provider text with fallback chain
│   ├── extractJsonObject()     # JSON extraction from AI responses
│   └── sanitizeAiProviderMessage()
│
├── usage.js                    # Usage metering & subscription checks
│   ├── getAiSubscription()
│   ├── getAiUsage()
│   ├── buildAiAccessPayload()
│   ├── reserveAiRoadmapDraftUsage()
│   ├── reserveAiChatUsage()
│   ├── releaseAiUsage()
│   └── ensureAiSubscriber()
│
├── recommendations.js          # Scoring engine (pure logic, no AI calls)
│   ├── buildSignals()
│   ├── scoreCourse()
│   ├── scoreRoadmap()
│   ├── buildNextStepRecommendations()
│   └── generateRecommendations()   # Orchestrator
│
├── prompts/                    # Prompt templates (isolated for easy editing)
│   ├── roadmap-draft.prompt.js
│   ├── topic-explain.prompt.js
│   └── chat-system.prompt.js
│
├── parsers/                    # AI response parsing & sanitization
│   ├── roadmap-draft.parser.js # sanitizeAiSteps(), sanitizeAiResource()
│   └── topic-explain.parser.js
│
├── roadmap-draft.js            # Roadmap draft generation service
│   ├── createAiRoadmapDraft()
│   └── createPrivateAiSlug()
│
├── topic-explain.js            # Topic explanation service
│   └── explainTopic()
│
├── chat.js                     # Chat conversation + message service
│   ├── listConversations()
│   ├── createConversation()
│   ├── getMessages()
│   ├── sendMessage()
│   ├── updateConversation()
│   ├── deleteConversation()
│   └── searchLearningCatalog()
│
└── cache.js                    # TTL cache (extracted, reusable)
    ├── createTtlCache()
    └── aiCache (singleton instance)
```

**Key principle:** Each file in `services/ai/` is a pure service — no `req`/`res`, no HTTP status codes. Controllers in `controllers/ai.controller.js` orchestrate these services and handle HTTP concerns.

### Prompt Isolation Example

```js
// services/ai/prompts/roadmap-draft.prompt.js
export const buildRoadmapDraftPrompt = ({ goal, targetRole, targetLevel, ... }) => ({
  system: "You generate practical software learning roadmap drafts...",
  user: JSON.stringify({ task: "Create a roadmap template draft.", ... }),
})
```

This isolation lets you:
- Edit prompts without touching business logic
- Version/A-B test prompts independently
- Let non-developers review prompt text

---

## 6. Concrete Refactor Examples by Domain

### 6.1 Auth Domain

**Before:** [users.service.js](file:///d:/Ahmed-Salah/ITI/ITI-GRAD-PROJECT/WEB/backend/services/users.service.js) — 1,824 lines containing signup, login, verify, reset, OAuth, profile, preferences, dashboard, account deletion, all mixed with `(req, res)`.

**After:**

```
controllers/auth.controller.js        # Thin — extract req.body, call service, format response
services/auth.service.js              # signup(), login(), verify(), resetPassword()
services/user.service.js              # updateProfile(), updateAvatar(), getDashboardSummary()
services/oauth.service.js             # startSocialAuth(), handleCallback(), createOrLinkUser()
services/account.service.js           # deactivate(), requestDeletion(), confirmDeletion(), undo()
helpers/auth.helpers.js               # toPublicUser(), updateLoginStreak(), generateVerificationToken()
validation/auth.schemas.js            # Zod schemas (moved from middleware/authValidators.js)
```

**Example controller:**

```js
// controllers/auth.controller.js
import * as authService from '../services/auth.service.js'
import { ok, fail, serverError } from '../helpers/response.js'

export const signup = async (req, res) => {
  try {
    const { user, accessToken } = await authService.signup(req.body)
    return ok(res, { user, accessToken }, 'User created successfully', 201)
  } catch (error) {
    return serverError(res, error, 'Registration failed.')
  }
}
```

**Example service (no req/res):**

```js
// services/auth.service.js
import { AppError } from '../helpers/errors.js'
import { toPublicUser, updateLoginStreak } from '../helpers/auth.helpers.js'

export const signup = async ({ username, Fname, Lname, email, password }) => {
  const existing = await User.findOne({ $or: [{ email }, { username }] })
  if (existing) throw new AppError(409, 'Email or username already taken.')

  const user = await User.create({ username, Fname, Lname, email, password })
  // ... token logic
  return { user: toPublicUser(user), accessToken }
}
```

### 6.2 AI Domain

**Before:** [ai.service.js](file:///d:/Ahmed-Salah/ITI/ITI-GRAD-PROJECT/WEB/backend/services/ai.service.js) — 2,561 lines, 12 exported handler functions, all with `(req, res)`.

**After:** See Section 5 structure. Example split:

```js
// controllers/ai.controller.js
import * as aiRecommendations from '../services/ai/recommendations.js'
import * as aiDraft from '../services/ai/roadmap-draft.js'
import * as aiUsage from '../services/ai/usage.js'
import { ok, serverError } from '../helpers/response.js'

export const getRecommendations = async (req, res) => {
  try {
    const payload = await aiRecommendations.generateRecommendations(
      req.user._id,
      parseInt(req.query.limit) || 6,
    )
    return ok(res, payload, 'AI recommendations generated.')
  } catch (error) {
    return serverError(res, error, 'Failed to generate recommendations.')
  }
}
```

### 6.3 Roadmaps Domain

**Before:** [roadmaps.service.js](file:///d:/Ahmed-Salah/ITI/ITI-GRAD-PROJECT/WEB/backend/services/roadmaps.service.js) — 1,168 lines mixing template CRUD, user assignment, step progress, markdown parsing.

**After:**

```
controllers/roadmap.controller.js
services/roadmap.service.js            # assignRoadmap(), updateStepProgress(), deleteRoadmap()
services/roadmap-template.service.js   # createTemplate(), updateTemplate(), publishTemplate()
helpers/roadmap.helpers.js             # slugifyStepKey(), ensureUniqueStepKeys(), parseMarkdownToSteps()
validation/roadmap.schemas.js
```

### 6.4 Courses Domain

**Before:** [courses.service.js](file:///d:/Ahmed-Salah/ITI/ITI-GRAD-PROJECT/WEB/backend/services/courses.service.js) — 13 KB. Already reasonably sized.

**After:** Extract controller layer, move Zod schemas from route to `validation/`.

### 6.5 Admin Domain

**Before:** [admin.service.js](file:///d:/Ahmed-Salah/ITI/ITI-GRAD-PROJECT/WEB/backend/services/admin.service.js) — 1,853 lines. Duplicates auth login, contains user/course/roadmap/contact management.

**After:**

```
controllers/admin.controller.js
services/admin/
├── admin-auth.service.js        # Admin login, verify, reset (reuse auth.service.js helpers)
├── admin-user.service.js        # getUsers, getUserById, toggleActive, changeRole
├── admin-course.service.js      # createCourse, updateCourse, deleteCourse
├── admin-roadmap.service.js     # Calls roadmap-template.service core functions
├── admin-contact.service.js     # getMessages, reply
└── admin-log.service.js         # logAdminAction()
```

**Key insight:** Admin auth should reuse `auth.service.js` with an `{ adminOnly: true }` flag, not duplicate the entire login/reset flow.

### 6.6 Contact Domain

Already clean at 3.5 KB. Just add a controller wrapper.

---

## 7. Step-by-Step Refactor Plan

### Phase 1: Foundation (Low Risk, High Value)

> [!IMPORTANT]
> Do these first. They create shared infrastructure without breaking existing code.

| # | Task | Risk | Effort |
|---|------|------|--------|
| 1.1 | Create `helpers/` directory with `response.js`, `errors.js`, `text.js`, `pagination.js`, `date.js` — extract duplicated utilities | 🟢 None | Small |
| 1.2 | Create `validation/` directory — move Zod schemas from route files to dedicated schema files | 🟢 None | Small |
| 1.3 | Create a generic `middleware/validate.js` that replaces the per-route `validateBody()` copies | 🟢 None | Small |
| 1.4 | Install Zustand in frontend, create `useUiStore.ts` and `useAiChatStore.ts` | 🟢 None | Small |

### Phase 2: AI Extraction (Medium Risk, Highest Value)

> [!WARNING]
> This is the most impactful refactor. The 2,561-line `ai.service.js` is the single biggest risk file.

| # | Task | Risk | Effort |
|---|------|------|--------|
| 2.1 | Extract `services/ai/cache.js` — move `createTtlCache` and cache constants | 🟢 Low | Small |
| 2.2 | Extract `services/ai/provider.js` — move Gemini/OpenAI client code, `callAiJson`, `callAiText` | 🟡 Med | Medium |
| 2.3 | Extract `services/ai/usage.js` — move usage metering, subscription checks, reserve/release | 🟡 Med | Medium |
| 2.4 | Extract `services/ai/prompts/` — move prompt builders | 🟢 Low | Small |
| 2.5 | Extract `services/ai/parsers/` — move response sanitization | 🟢 Low | Small |
| 2.6 | Extract `services/ai/recommendations.js` — move scoring engine | 🟡 Med | Medium |
| 2.7 | Extract `services/ai/chat.js` — move chat conversation logic | 🟡 Med | Medium |
| 2.8 | Create `controllers/ai.controller.js` — move `(req, res)` wrappers | 🟡 Med | Medium |

### Phase 3: Auth/User Separation (Medium Risk)

| # | Task | Risk | Effort |
|---|------|------|--------|
| 3.1 | Extract `helpers/auth.helpers.js` — `toPublicUser`, `updateLoginStreak`, token generation | 🟢 Low | Small |
| 3.2 | Extract `services/oauth.service.js` from `users.service.js` | 🟡 Med | Medium |
| 3.3 | Extract `services/account.service.js` — deletion lifecycle | 🟡 Med | Medium |
| 3.4 | Create `controllers/auth.controller.js` — move `(req, res)` wrappers | 🟡 Med | Medium |
| 3.5 | Refactor admin login to reuse auth service helpers | 🟡 Med | Small |

### Phase 4: Roadmaps & Admin (Medium Risk)

| # | Task | Risk | Effort |
|---|------|------|--------|
| 4.1 | Split `roadmaps.service.js` into template and user-roadmap services | 🟡 Med | Medium |
| 4.2 | Create `controllers/roadmap.controller.js` | 🟡 Med | Medium |
| 4.3 | Split `admin.service.js` into sub-services | 🟡 Med | Large |
| 4.4 | Create `controllers/admin.controller.js` | 🟡 Med | Medium |

### Phase 5: Frontend React Query Hooks (Low Risk)

| # | Task | Risk | Effort |
|---|------|------|--------|
| 5.1 | Create `hooks/queries/` — wrap each API module in `useQuery` hooks | 🟢 Low | Medium |
| 5.2 | Create `hooks/mutations/` — wrap mutations in `useMutation` hooks | 🟢 Low | Medium |
| 5.3 | Refactor `route-utils.ts` loaders to use shared `useProtectedRoute` pattern | 🟢 Low | Small |
| 5.4 | Split `DashboardSections.tsx` into per-section components | 🟢 Low | Medium |
| 5.5 | Move `accessToken` into an auth Zustand store | 🟡 Med | Small |

---

## 8. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Breaking existing API contracts during refactor | 🔴 High | Extract into new files, keep old exports as re-exports during transition. Only remove old file when all imports are updated. |
| AI provider fallback chain breaks during split | 🔴 High | Write integration tests for `callAiJson` and `callAiText` before splitting. Run against real provider in CI. |
| OAuth redirect flow breaks | 🟡 Med | Test Google OAuth end-to-end after extracting `oauth.service.js`. The redirect chain is stateful and fragile. |
| Frontend route loaders break during auth refactor | 🟡 Med | Keep `route-utils.ts` working, add new shared hook alongside, migrate one loader at a time. |
| Admin service split breaks admin panel | 🟡 Med | Admin is the largest service — split sub-services one at a time (users → courses → roadmaps → contact). |
| Zustand migration introduces subtle re-render bugs | 🟢 Low | Use Zustand selectors from day one. Don't subscribe to entire store. |

### Priority Order

```
1. helpers/ + validation/ + validate middleware     ← Unblocks everything
2. ai.service.js decomposition                      ← Highest risk reduction
3. Auth/User separation                             ← Second largest service
4. Frontend React Query hooks                       ← Best DX improvement
5. Admin service split                              ← Largest but lowest risk
6. Zustand stores                                   ← Nice-to-have
```

---

## 9. Summary

The ILMA codebase has strong domain coverage and a working product, but the "service" layer is really a "controller+service+repository" monolith per domain. The AI file at 2,561 lines is the highest-risk file in the codebase.

**Three changes would deliver the most value:**

1. **Create a real controller layer** so services become testable, reusable, and smaller
2. **Split `ai.service.js` into 7+ focused modules** so AI features can evolve independently
3. **Wrap frontend API calls in React Query hooks** so server state has consistent caching, loading, and error handling everywhere

The refactor can be done incrementally, one domain at a time, without rewriting the app.
