# ILMA AI Specification

This document covers all AI-related routes, files, flow control, limits, provider behavior, and integration points visible in the current repository.

## 1. AI Scope in This Repository

AI in ILMA currently serves three product functions:

- Personalized recommendations.
- AI roadmap draft generation and saving.
- Topic explanation.
- General AI chat with saved conversation history.

The implementation is concentrated in the backend AI service and exposed through the frontend AI roadmap page, AI chat page, upgrade page, course detail page, and dashboard surfaces.

## 2. AI-Related Files

| File                                                                                                               | Role                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| [backend/routes/ai.route.js](backend/routes/ai.route.js)                                                           | AI API routes and Zod validation for AI requests.                                                                  |
| [backend/services/ai.service.js](backend/services/ai.service.js)                                                   | Core provider orchestration, draft generation, explanation, recommendation scoring, usage limits, and persistence. |
| [backend/models/user/userAiUsageModel.js](backend/models/user/userAiUsageModel.js)                                 | Monthly AI draft usage tracking.                                                                                   |
| [backend/models/user/userAiConversationModel.js](backend/models/user/userAiConversationModel.js)                   | Saved user AI chat conversations and optional chat context.                                                         |
| [backend/models/user/userAiMessageModel.js](backend/models/user/userAiMessageModel.js)                             | Saved AI chat messages, provider metadata, token counts, and structured roadmap/course links.                       |
| [backend/models/user/userActivityModel.js](backend/models/user/userActivityModel.js)                               | Records AI-related events.                                                                                         |
| [backend/models/user/userPreferenceModel.js](backend/models/user/userPreferenceModel.js)                           | Supplies personalization signals.                                                                                  |
| [backend/models/user/userCourseProgressModel.js](backend/models/user/userCourseProgressModel.js)                   | Supplies course progress signals for recommendations.                                                              |
| [backend/models/user/userRoadmapModel.js](backend/models/user/userRoadmapModel.js)                                 | Supplies roadmap progress signals for recommendations.                                                             |
| [backend/models/user/userRoadmapStepProgressModel.js](backend/models/user/userRoadmapStepProgressModel.js)         | Supplies next-step signals.                                                                                        |
| [backend/models/course/courseModel.js](backend/models/course/courseModel.js)                                       | Supplies course metadata for scoring and recommendations.                                                          |
| [backend/models/roadmap/roadmapTemplateModel.js](backend/models/roadmap/roadmapTemplateModel.js)                   | Supplies roadmap metadata for scoring and AI save workflows.                                                       |
| [frontend/src/routes/user/AiRoadmapPage.tsx](frontend/src/routes/user/AiRoadmapPage.tsx)                           | Main AI UI for users.                                                                                              |
| [frontend/src/routes/user/AiChatPage.tsx](frontend/src/routes/user/AiChatPage.tsx)                                 | General AI chat workspace with saved conversations.                                                                |
| [frontend/src/routes/user/CoursePage.tsx](frontend/src/routes/user/CoursePage.tsx)                                 | Public course detail page used by AI course links.                                                                 |
| [frontend/src/libs/ai-api.ts](frontend/src/libs/ai-api.ts)                                                         | Frontend API adapter for AI endpoints.                                                                             |
| [frontend/src/libs/courses-api.ts](frontend/src/libs/courses-api.ts)                                               | Frontend API adapter for public course listing/detail endpoints.                                                    |
| [frontend/src/libs/user-api.ts](frontend/src/libs/user-api.ts)                                                     | Fetches AI recommendations and dashboard data.                                                                     |
| [frontend/src/components/dashboard/DashboardSections.tsx](frontend/src/components/dashboard/DashboardSections.tsx) | Hosts AI recommendation UI sections.                                                                               |

## 3. AI Routes

| Route                         | Method | Purpose                                            | Status  |
| ----------------------------- | ------ | -------------------------------------------------- | ------- |
| `/api/ai/recommendations`     | GET    | Student-only personalized recommendations.         | Working |
| `/api/ai/features/access`     | GET    | Returns subscription/usage/capability information. | Working |
| `/api/ai/roadmaps/user-draft` | POST   | Generates a user roadmap draft from a prompt.      | Working |
| `/api/ai/roadmaps/save`       | POST   | Saves an AI-generated roadmap draft.               | Working |
| `/api/ai/topics/explain`      | POST   | Explains a roadmap topic.                          | Working |
| `/api/ai/roadmaps/draft`      | POST   | Admin-only roadmap draft generation.               | Working |
| `/api/ai/chat/conversations`  | GET    | Lists the current user's non-deleted conversations. | Working |
| `/api/ai/chat/conversations`  | POST   | Creates a chat, optionally from a first message.    | Working |
| `/api/ai/chat/conversations/:conversationId/messages` | GET | Lists messages for an owned conversation. | Working |
| `/api/ai/chat/conversations/:conversationId/messages` | POST | Sends a user message and stores the assistant reply. | Working |
| `/api/ai/chat/conversations/:conversationId` | PATCH | Renames an owned conversation. | Working |
| `/api/ai/chat/conversations/:conversationId` | DELETE | Soft-deletes an owned conversation. | Working |
| `/api/courses/published/:slug` | GET | Returns a published, non-deleted public course by slug. | Working |

All AI routes require authentication. Most routes require `student` role; the admin draft route requires `admin` role.

## 4. AI Request Validation

`backend/routes/ai.route.js` defines local Zod schemas for:

- roadmap draft requests,
- user roadmap prompt requests,
- save draft payloads,
- topic explanation requests.
- AI chat conversation create/update requests,
- AI chat message requests.

Validation behavior:

- Request bodies are parsed with `safeParse`.
- Invalid requests return `400` with `Validation failed.` and a field-level error array.
- The route handlers receive normalized body payloads after validation.
- Chat message content is trimmed and limited to 1-2000 characters.
- Chat titles are trimmed and limited to 1-30 characters.
- Chat routes are student-only and return `404` for missing, deleted, or non-owned conversations.

## 5. OpenAI Flow

`backend/services/ai.service.js` uses OpenAI as a fallback provider.

### Flow

1. `getOpenAiConfig()` resolves `OPENAI_API_KEY` and optional base URL/model overrides.
2. `createOpenAiClient()` initializes the client.
3. `callOpenAiJson()` sends a system message and a user message via `chat.completions.create()`.
4. Response format is forced to JSON object mode.
5. The response content is parsed into JSON.
6. `callOpenAiText()` is used for general chat responses without JSON mode.
7. Errors are sanitized and converted to structured provider errors.

### Relevant Environment Inputs

- `OPENAI_API_KEY`
- `AI_OPENAI_API_KEY`
- `AI_API_KEY`
- `OPENAI_BASE_URL`
- `AI_BASE_URL`
- `OPENAI_MODEL`
- `AI_MODEL`

### Status

Working as a fallback path.

## 6. Gemini Flow

`backend/services/ai.service.js` uses Gemini as the primary provider family.

### Flow

1. `getGeminiConfig()` resolves the API key, base URL, and ordered model list.
2. The service attempts the primary Gemini model first.
3. If a model fails, fallback models are attempted in order.
4. `callGeminiJson()` invokes `generateContent` with a system instruction and a user prompt.
5. Responses are expected to contain JSON and are parsed defensively.
6. `callGeminiText()` is used for general chat responses with text output.
7. The service extracts candidate content and rejects empty or blocked responses.

### Relevant Environment Inputs

- `GEMINI_API_KEY`
- `GOOGLE_API_KEY`
- `GEMINI_BASE_URL`
- `GEMINI_MODEL`
- `AI_GEMINI_MODEL`
- `GEMINI_FALLBACK_MODELS`
- `GEMINI_THINKING_LEVEL`

### Default Models

- `gemini-3.5-flash`
- fallback models include `gemini-3.1-flash-lite` and `gemini-3-flash-preview` unless overridden.

### Status

Working as the primary provider family.

## 7. Provider Fallback Logic

The fallback strategy is explicit and sequential.

### Order

1. Gemini primary model.
2. Gemini fallback models in order.
3. OpenAI fallback model.

### Behavior

- Provider errors are sanitized before logging or user exposure.
- Auth failures and temporary provider failures are detected differently.
- If no API key is configured for either provider family, the request fails with a 503-level error.
- If all providers fail, the last error is returned.
- Roadmaps and topic explanations use the JSON provider helpers.
- AI chat uses the text provider helpers with the same Gemini-first, OpenAI-fallback order.

### Risk Notes

- AI requests are synchronous and provider-bound.
- A missing or invalid secret can break all AI features.
- Provider-specific format changes can break JSON extraction.

## 8. Prompt Handling

There is no standalone prompt registry file in the repository.

### Current Pattern

- Prompts are built inside `backend/services/ai.service.js` as strings passed to provider calls.
- JSON responses are expected and extracted from provider output.
- Prompt content is not versioned separately.
- Prompt text is not surfaced in a dedicated frontend or configuration layer.

### What This Means

- Prompt changes require code changes in the service file.
- There is no prompt catalog, prompt A/B system, or prompt metadata layer.
- This is acceptable for an MVP, but it is a scaling and maintainability risk.

## 9. AI Usage Limits

`backend/services/ai.service.js` enforces monthly AI roadmap draft and AI chat message limits.

### Limits

- Free plan default: 3 roadmap drafts/month.
- Pro plan default: 10 roadmap drafts/month.
- Free plan default: 30 AI chat messages/month.
- Pro plan default: 150 AI chat messages/month.
- Limits are configurable via `AI_FREE_ROADMAP_DRAFT_LIMIT` and `AI_PRO_ROADMAP_DRAFT_LIMIT`.
- Chat limits are configurable via `AI_FREE_CHAT_MESSAGE_LIMIT` and `AI_PRO_CHAT_MESSAGE_LIMIT`.

### Tracking

- `UserAiUsage` stores per-month draft counts.
- `UserAiUsage` also stores per-month `ai_chat` counts and assistant token totals.
- `UserActivity` is also consulted to reconcile usage.
- One chat usage unit is counted for each successful user message that receives an assistant response.
- If the provider call fails after reservation, the reserved chat usage is released.

### Capability Exposure

`GET /api/ai/features/access` reports:

- subscription plan/status,
- usage counts,
- remaining drafts,
- remaining chat messages,
- whether the user can generate a draft,
- whether the user can use AI chat,
- whether the user can save or explain topics.

## 10. AI Cache Behavior

The backend keeps a small process-local TTL cache to reduce repeated synchronous work. It does not add Redis or a job queue.

| Cache | Key Shape | TTL | Invalidated |
| ----- | --------- | --- | ----------- |
| Feature access | user/subscription state | 25 seconds | after AI usage reservation/release/token updates |
| Recommendations | user + limit | 60 seconds | after AI usage changes for the user |
| Chat catalog search | normalized chat search terms | 5 minutes | expires naturally |
| Topic explanation | normalized request payload | 10 minutes | expires naturally |

Normal chat completions are not cached because they depend on conversation history.

## 11. Roadmap Generation Flow

### User Draft Flow

1. User enters a prompt/goal on the AI roadmap page.
2. Backend validates the request.
3. Backend checks subscription plan and monthly usage.
4. Backend attempts provider generation.
5. JSON draft is parsed and returned.

### Admin Draft Flow

1. Admin submits goal, role, level, template type, duration, and weekly study hours.
2. Backend validates the payload.
3. Backend generates a draft for admin review.
4. Draft may later be turned into a roadmap template.

### Save Flow

1. AI draft payload is validated.
2. Draft is normalized and persisted as a roadmap template.
3. The saved object can later be published or edited via roadmap/admin flows.

### Status

Working.

## 12. Topic Explanation Flow

### Request Shape

The route accepts a roadmap title, roadmap goal, step title, and optional step description.

### Behavior

- The backend validates the input with Zod.
- The explanation is produced by the AI service.
- The feature is gated behind student access and AI limits/eligibility checks.

### Status

Working.

## 13. AI Chat Flow

### Route Surface

AI chat lives under `/api/ai/chat` and is exposed in the frontend at `/:language/ai/chat`.

### Conversation Behavior

1. The user creates a conversation or sends a message in an existing owned conversation.
2. The backend reserves one `ai_chat` usage unit.
3. The backend loads the last 12 user/assistant messages.
4. The backend searches the public learning catalog for matching active roadmaps and published courses.
5. The chat system prompt includes the ILMA assistant instruction, optional page/course/roadmap context, and compact matching catalog links.
6. The provider response is stored as an assistant message with provider/model/token metadata.
7. Structured links are persisted on the assistant message.

### Structured Link Shape

Assistant messages may include:

```json
{
  "type": "roadmap",
  "title": "Frontend Developer",
  "description": "Short description",
  "path": "/roadmaps/frontend-developer",
  "slug": "frontend-developer",
  "level": "beginner",
  "category": "roleBased"
}
```

Course links use `type: "course"` and paths like `/courses/react-basics`. The frontend prefixes the active language segment before navigating.

### Chat Retrieval

- Roadmap search targets active public `RoadmapTemplate` records.
- Course search targets published, non-deleted `Course` records.
- Retrieval is intentionally small: up to 3 roadmaps and 3 courses.
- The assistant is instructed to mention retrieved links only when useful and not to invent links.

## 14. Recommendation Flow

### Input Sources

- User interests and goals.
- Preferred categories/languages.
- Skill level and pace.
- Weekly study hours.
- Current roadmap progress.
- Current course progress.
- Recent activity.

### Output Types

- Recommended course.
- Recommended roadmap.
- Recommended next roadmap step.

### Behavior

- The recommendation engine is heuristic and rule-based.
- It scores candidates using match terms, level fit, study load, and progress context.
- It returns a `reason` string and a `nextAction` string for each recommendation.

### Status

Working.

## 15. Public Course Detail Flow

`GET /api/courses/published/:slug` returns one published, non-deleted course by slug. The frontend route `/:language/courses/:slug` renders title, description, level/category, duration, prerequisites, learning outcomes, and sections/lessons when present.

## 16. Synchronous Limitations

AI endpoints remain synchronous in this pass. The TTL cache reduces repeated reads and repeated topic explanations, but provider latency can still block a request until Gemini/OpenAI returns or fails. There is no streaming, background job queue, polling, or Redis-backed shared cache yet.

## 17. What Is Already Working

- AI endpoint routing and role protection.
- Provider fallback between Gemini and OpenAI.
- JSON extraction and sanitization.
- AI usage caps and monthly usage tracking.
- Roadmap draft saving.
- Topic explanation.
- Recommendation generation from current user data.

## 18. What Is Broken or Incomplete

The repository does not show a catastrophic AI subsystem failure, but these gaps are visible:

- No dedicated prompt management system.
- No async queue or background job layer.
- No dedicated AI observability surface.
- No model selection UI for end users.
- No separate cost, safety, or rate analytics surface.
- No explicit LLM evaluation harness in the repository.

## 19. Integration Points for Future AI Work

Best places to extend AI without disturbing stable code:

| Integration Point                                         | Why it fits                                                  |
| --------------------------------------------------------- | ------------------------------------------------------------ |
| `backend/services/ai.service.js`                          | Existing orchestration layer for provider calls and scoring. |
| `backend/routes/ai.route.js`                              | Existing request surface for AI features.                    |
| `backend/models/user/userActivityModel.js`                | Can feed analytics, feedback, and ranking signals.           |
| `backend/models/user/userPreferenceModel.js`              | Can support richer personalization and recommendation logic. |
| `frontend/src/routes/user/AiRoadmapPage.tsx`              | Natural UI surface for new AI actions.                       |
| `frontend/src/routes/user/AiChatPage.tsx`                 | Natural UI surface for conversational AI actions.            |
| `frontend/src/components/dashboard/DashboardSections.tsx` | Natural surface for recommendation and explanation cards.    |

Potential future additions:

- prompt versioning,
- per-feature model selection,
- AI feedback capture,
- background generation jobs,
- AI output caching,
- AI quality dashboards,
- admin review workflows for generated content.

## 20. Environment Variables Used by AI

| Variable                                              | Purpose                           |
| ----------------------------------------------------- | --------------------------------- |
| `GEMINI_API_KEY` / `GOOGLE_API_KEY`                   | Gemini authentication.            |
| `GEMINI_BASE_URL`                                     | Gemini endpoint override.         |
| `GEMINI_MODEL` / `AI_GEMINI_MODEL`                    | Primary Gemini model.             |
| `GEMINI_FALLBACK_MODELS`                              | Fallback Gemini models.           |
| `GEMINI_THINKING_LEVEL`                               | Optional reasoning configuration. |
| `OPENAI_API_KEY` / `AI_OPENAI_API_KEY` / `AI_API_KEY` | OpenAI authentication.            |
| `OPENAI_BASE_URL` / `AI_BASE_URL`                     | OpenAI endpoint override.         |
| `OPENAI_MODEL` / `AI_MODEL`                           | OpenAI model choice.              |
| `AI_FREE_ROADMAP_DRAFT_LIMIT`                         | Monthly free-user draft cap.      |
| `AI_PRO_ROADMAP_DRAFT_LIMIT`                          | Monthly pro-user draft cap.       |
| `AI_FREE_CHAT_MESSAGE_LIMIT`                           | Monthly free-user chat cap.       |
| `AI_PRO_CHAT_MESSAGE_LIMIT`                            | Monthly pro-user chat cap.        |
