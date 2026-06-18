# AI Performance, Retrieval Links, Chat Modals, And Upgrade Plan

## Summary
Improve the existing synchronous AI flow without changing API style by adding lightweight caching, tighter context retrieval, and better chat UX. ILMA AI chat will retrieve matching public roadmaps/courses before answering and return structured internal links. Pro chat quota becomes `150`.

## Backend Changes
- Keep AI endpoints synchronous, but add a small process-local TTL cache helper with explicit invalidation after AI usage writes.
- Add cache layers:
  - AI feature access per user: 15-30s.
  - AI recommendations per user/limit: 60s.
  - Public learning catalog searches for chat context: 5 minutes.
  - Topic explanation cache by normalized payload: 10 minutes.
  - Do not cache normal chat completions because they depend on conversation history.
- Change Pro chat quota default from `300` to `150` via `AI_PRO_CHAT_MESSAGE_LIMIT` fallback and update access payload/docs accordingly.
- Add chat retrieval before provider calls:
  - Extract search terms from the user message.
  - Query active public `RoadmapTemplate` and published `Course` in parallel using existing text/searchable fields.
  - Limit returned context to a small set, for example 3 roadmaps and 3 courses.
  - Include titles, slugs, descriptions, level/category/tags, and generated app paths in the system/context prompt.
- Extend assistant chat response persistence with structured `links` on assistant messages:
  - Roadmap links use `/{language}/roadmaps/:slug` on frontend, backend returns canonical path data like `/roadmaps/:slug`.
  - Course links use new public course route `/courses/:slug`.
  - Link item shape: `type`, `title`, `description`, `path`, optional `slug`, `level`, `category`.
- Add public course-by-slug backend support:
  - `GET /api/courses/published/:slug`
  - Return only published, non-deleted courses.
- Update `Specs/AI_SPEC.md` to document AI chat, cache behavior, retrieval/context links, sync limitations, and quota defaults.

## Frontend Changes
- Replace `window.confirm` delete with the existing `ConfirmActionModal`.
- Replace `window.prompt` rename with a new app-styled rename modal containing an input, validation, cancel/save buttons, loading state, and i18n strings.
- Render assistant-provided roadmap/course links below assistant messages as compact linked rows/cards.
- Add public course detail route:
  - `/:language/courses/:slug`
  - Shows title, description, level, category, duration, sections/lessons when available, and a back link.
- Upgrade page:
  - Add AI Chat CTA button linking to `/:language/ai/chat` with `AiChat02Icon`.
  - Update plan copy to mention AI chat message quotas.
  - Change Pro chat quota text to 150 messages/month.
  - Replace “future chatbot access” wording with active AI chat availability.
- Update English and Arabic translations for rename/delete modals, chat link cards, course detail page, and upgraded plan text.

## Test Plan
- Backend:
  - Unit/model tests for assistant message `links`.
  - API tests for public course-by-slug success and 404.
  - AI service tests for cache hit/miss behavior and cache invalidation after chat usage.
  - Chat tests verifying roadmap/course retrieval links are included when matching content exists.
  - Run `npm test` in `WEB`.
- Frontend:
  - Lint/build with `npm run lint` and `npm run build` in `WEB/frontend`.
  - Verify `/en/ai/chat`, `/ar/ai/chat`, `/en/courses/:slug`, and `/ar/courses/:slug`.
  - Verify delete modal, rename modal, chat link rendering, upgrade AI chat button, and RTL layout.

## Assumptions
- Keep synchronous AI endpoints for now; no job queue or polling in this pass.
- Use process-local TTL caching only; no Redis/new infrastructure.
- Add a public course detail page so AI course links are real user-facing paths.
- Pro chat quota default is exactly `150` messages/month.
