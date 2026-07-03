# ILMA UML and SWE Diagrams

This document extends the `User Journey` in [SPEC.md](SPEC.md) with implementation-aligned SWE diagrams. It is based on the current `WEB/` source tree: Express routes, React router/API clients, and Mongoose models.

## Source Files Reviewed

| Area | Files |
| --- | --- |
| Product journey | `Specs/SPEC.md` section 12, `Specs/DOC.md` |
| Backend composition | `WEB/backend/app.js`, `WEB/backend/routes/*.route.js` |
| Frontend composition | `WEB/frontend/src/router.tsx`, `WEB/frontend/src/libs/*-api.ts`, `WEB/frontend/src/hooks/queries/*.ts`, `WEB/frontend/src/hooks/mutations/*.ts` |
| Domain model | `WEB/backend/models/**/*.js` |

## 1. System Context Diagram

```mermaid
flowchart LR
    Student["Student User"]
    Admin["Admin User"]
    Visitor["Visitor / Guest"]
    Google["Google OAuth"]
    Mail["Email Service"]
    AI["AI Providers<br/>Gemini primary / OpenAI fallback"]
    Cloudinary["Cloudinary"]
    Mongo["MongoDB Atlas"]

    subgraph ILMA["ILMA Learning Platform"]
        SPA["React + TypeScript SPA<br/>Language routes, loaders, React Query"]
        API["Express API<br/>Auth, Roadmaps, Courses, AI, Admin, Contact"]
    end

    Visitor --> SPA
    Student --> SPA
    Admin --> SPA
    SPA -->|HTTPS JSON + cookies/Bearer token| API
    API --> Mongo
    API --> Mail
    API --> Google
    API --> AI
    API --> Cloudinary
```

## 2. Container Diagram

```mermaid
flowchart TB
    Browser["Browser"]

    subgraph Frontend["WEB/frontend"]
        Router["React Router<br/>Root, language, client, admin layouts"]
        Pages["Pages<br/>Home, Auth, Dashboard, Roadmap, Course, AI, Admin"]
        Hooks["React Query hooks + mutations"]
        Clients["API clients<br/>user, roadmaps, courses, ai, admin, contact"]
        Store["Zustand auth/UI stores"]
    end

    subgraph Backend["WEB/backend"]
        App["Express app.js<br/>CORS, JSON, cookies, docs, DB reconnect"]
        Middleware["Middleware<br/>protect, authorizeRoles, validate, rate limit"]
        Routes["Routes<br/>auth, roadmaps, courses, ai, admin, contact, system"]
        Controllers["Controllers"]
        Services["Services<br/>auth/user/account, roadmap, course, AI, admin, contact"]
        Models["Mongoose models"]
    end

    Mongo["MongoDB"]
    External["External providers<br/>Email, OAuth, AI, Cloudinary"]

    Browser --> Router
    Router --> Pages
    Pages --> Hooks
    Hooks --> Clients
    Clients --> Store
    Clients --> App
    App --> Middleware
    Middleware --> Routes
    Routes --> Controllers
    Controllers --> Services
    Services --> Models
    Models --> Mongo
    Services --> External
```

## 3. Backend Component Diagram

```mermaid
flowchart LR
    App["app.js"]

    App --> AuthRoute["/api/auth<br/>auth.route.js"]
    App --> RoadmapRoute["/api/roadmaps<br/>roadmaps.route.js"]
    App --> CourseRoute["/api/courses<br/>courses.route.js"]
    App --> AiRoute["/api/ai<br/>ai.route.js"]
    App --> AdminRoute["/api/admin<br/>admin.route.js"]
    App --> ContactRoute["/api/contact<br/>contact.route.js"]
    App --> SystemRoute["/api/system<br/>system.route.js"]

    AuthRoute --> AuthController["auth.controller.js"]
    RoadmapRoute --> RoadmapController["roadmap.controller.js"]
    CourseRoute --> CourseController["course.controller.js"]
    AiRoute --> AiController["ai.controller.js"]
    AdminRoute --> AdminController["admin.controller.js"]
    ContactRoute --> ContactController["contact.controller.js"]

    AuthController --> AuthServices["auth.service<br/>user.service<br/>account.service<br/>oauth.service"]
    RoadmapController --> RoadmapServices["roadmap.service<br/>roadmap-template.service"]
    CourseController --> CourseService["courses.service"]
    AiController --> AiServices["AI services<br/>recommendations, usage, chat,<br/>roadmap draft, topic explain, provider"]
    AdminController --> AdminServices["Admin services<br/>auth, user, course, roadmap,<br/>contact, log"]
    ContactController --> ContactService["contact.service"]

    AuthRoute -.-> AuthMw["protect / authorizeRoles"]
    RoadmapRoute -.-> RoadmapMw["roadmap validators"]
    CourseRoute -.-> CourseMw["course validators"]
    AiRoute -.-> AiMw["AI limiter + body validation"]
    AdminRoute -.-> AdminMw["admin limiters + admin validators"]
```

## 4. Frontend Routing and API Diagram

```mermaid
flowchart TB
    Router["createBrowserRouter"]
    Root["RootLayout"]
    Language["/:language<br/>LanguageLayout"]
    Client["ClientLayout"]
    AdminLayout["AdminLayout"]

    Router --> Root --> Language
    Language --> Client
    Language --> AdminLayout

    Client --> PublicPages["Public pages<br/>Home, login, signup, reset,<br/>roadmaps/:slug, courses/:slug, contact"]
    Client --> ProtectedPages["Protected student pages<br/>dashboard, profile, preferences,<br/>my-roadmaps, ai, ai/chat"]
    AdminLayout --> AdminPages["Protected admin pages<br/>overview, users, roadmaps,<br/>courses, contact messages, profile"]

    ProtectedPages --> UserApi["user-api.ts"]
    ProtectedPages --> RoadmapsApi["roadmaps-api.ts"]
    ProtectedPages --> CoursesApi["courses-api.ts"]
    ProtectedPages --> AiApi["ai-api.ts"]
    AdminPages --> AdminApi["admin-api.ts"]
    PublicPages --> ContactApi["contact-api.ts"]

    UserApi --> ApiUtil["utils/api.ts<br/>token attach + refresh retry"]
    RoadmapsApi --> ApiUtil
    CoursesApi --> ApiUtil
    AiApi --> ApiUtil
    AdminApi --> ApiUtil
    ContactApi --> ApiUtil
```

## 5. Domain Class Diagram

```mermaid
classDiagram
    class User {
      ObjectId _id
      string username
      string email
      string role
      boolean isVerified
      boolean isActive
      LoginStreak loginStreak
      Subscription subscription
      ObjectId currentRoadmap
    }

    class UserProfile {
      ObjectId user
      string bio
      string avatarUrl
      string visibility
      string location
      string headline
    }

    class UserPreference {
      ObjectId user
      string[] interests
      string[] preferredLanguages
      string[] learningGoals
      string skillLevel
      string learningPace
      number weeklyStudyHours
    }

    class RoadmapTemplate {
      string title
      string slug
      string goal
      string targetRole
      string targetLevel
      string templateType
      string source
      string visibility
      boolean isActive
      RoadmapStep[] steps
    }

    class RoadmapStep {
      string stepKey
      string title
      number order
      number estimatedMinutes
      boolean required
      string[] dependsOn
    }

    class UserRoadmap {
      ObjectId user
      ObjectId template
      string status
      number currentStepIndex
      number progressPercent
      Date targetDate
    }

    class UserRoadmapStepProgress {
      ObjectId user
      ObjectId roadmap
      ObjectId template
      string stepKey
      ObjectId course
      string status
      number score
      number timeSpentMinutes
    }

    class Course {
      string title
      string slug
      string level
      string category
      boolean isPublished
      boolean isFeatured
      CourseSection[] sections
      CourseStats stats
    }

    class CourseSection {
      string sectionKey
      string title
      number order
      Lesson[] lessons
    }

    class UserCourseProgress {
      ObjectId user
      ObjectId course
      ObjectId roadmap
      string status
      string currentLesson
      string[] completedLessonIds
      number progressPercent
      number rating
    }

    class UserActivity {
      ObjectId user
      string type
      ObjectId course
      ObjectId roadmap
      string roadmapStepKey
      mixed metadata
    }

    class UserAiUsage {
      ObjectId user
      string type
      Date periodStart
      number count
      number totalTokens
    }

    class UserAiConversation {
      ObjectId user
      string title
      object context
      Date lastMessageAt
      Date deletedAt
    }

    class UserAiMessage {
      ObjectId conversation
      ObjectId user
      string role
      string content
      string provider
      string model
      AiChatLink[] links
    }

    class ContactMessage {
      string name
      string email
      string message
      string status
      ContactReply[] replies
    }

    class AdminActionLog {
      ObjectId admin
      string action
      string targetType
      ObjectId targetId
      mixed metadata
    }

    User "1" --> "0..1" UserProfile
    User "1" --> "0..1" UserPreference
    User "1" --> "0..*" UserRoadmap
    User "1" --> "0..*" UserCourseProgress
    User "1" --> "0..*" UserActivity
    User "1" --> "0..*" UserAiUsage
    User "1" --> "0..*" UserAiConversation
    User "1" --> "0..*" AdminActionLog : admin
    RoadmapTemplate "1" *-- "1..*" RoadmapStep
    RoadmapTemplate "1" --> "0..*" UserRoadmap
    UserRoadmap "1" --> "0..*" UserRoadmapStepProgress
    Course "1" *-- "0..*" CourseSection
    Course "1" --> "0..*" UserCourseProgress
    Course "0..1" --> "0..*" UserRoadmapStepProgress
    UserAiConversation "1" --> "0..*" UserAiMessage
    ContactMessage "1" --> "0..*" ContactReply
```

## 6. ER Diagram

```mermaid
erDiagram
    USER ||--o| USER_PROFILE : owns
    USER ||--o| USER_PREFERENCE : owns
    USER ||--o{ USER_ROADMAP : assigns
    USER ||--o{ USER_COURSE_PROGRESS : enrolls
    USER ||--o{ USER_ROADMAP_STEP_PROGRESS : tracks
    USER ||--o{ USER_ACTIVITY : emits
    USER ||--o{ USER_AI_USAGE : consumes
    USER ||--o{ USER_AI_CONVERSATION : starts
    USER ||--o{ ADMIN_ACTION_LOG : performs

    ROADMAP_TEMPLATE ||--o{ USER_ROADMAP : instantiates
    ROADMAP_TEMPLATE ||--o{ USER_ROADMAP_STEP_PROGRESS : defines
    ROADMAP_TEMPLATE ||--o{ COURSE : links
    COURSE ||--o{ USER_COURSE_PROGRESS : has
    COURSE ||--o{ USER_ROADMAP_STEP_PROGRESS : supports
    USER_ROADMAP ||--o{ USER_ROADMAP_STEP_PROGRESS : contains
    USER_ROADMAP ||--o{ USER_COURSE_PROGRESS : contextualizes
    USER_AI_CONVERSATION ||--o{ USER_AI_MESSAGE : contains
    CONTACT_MESSAGE ||--o{ CONTACT_REPLY : receives
```

## 7. Authentication Sequence

```mermaid
sequenceDiagram
    actor User
    participant LoginPage
    participant Api as utils/api.ts
    participant AuthRoute as POST /api/auth/login
    participant AuthService
    participant UserModel as User
    participant Store as AuthSessionStore

    User->>LoginPage: Submit identifier + password
    LoginPage->>Api: apiPost('/auth/login')
    Api->>AuthRoute: JSON request
    AuthRoute->>AuthService: login()
    AuthService->>UserModel: find by email/username + compare password
    UserModel-->>AuthService: authenticated user
    AuthService-->>AuthRoute: access token + refresh cookie + public user
    AuthRoute-->>Api: 200 response
    Api->>Store: setAccessToken()
    LoginPage-->>User: Redirect via route loader
```

## 8. Protected Request and Token Refresh Sequence

```mermaid
sequenceDiagram
    participant Page as Protected page / loader
    participant Api as utils/api.ts
    participant ProtectedRoute as Protected API route
    participant Refresh as POST /api/auth/refresh
    participant Store as AuthSessionStore

    Page->>Api: apiGet('/auth/dashboard-summary')
    Api->>ProtectedRoute: Bearer access token + cookies
    alt Access token valid
        ProtectedRoute-->>Api: 200 data
        Api-->>Page: data
    else Access token expired
        ProtectedRoute-->>Api: 401
        Api->>Refresh: refresh cookie
        Refresh-->>Api: new access token
        Api->>Store: setAccessToken(new token)
        Api->>ProtectedRoute: retry original request
        ProtectedRoute-->>Api: 200 data
        Api-->>Page: data
    else Refresh rejected
        Refresh-->>Api: 401 refresh error code
        Api->>Store: clearAccessToken()
        Api-->>Page: unauthenticated
    end
```

## 9. Roadmap Assignment and Step Progress Sequence

```mermaid
sequenceDiagram
    actor Student
    participant RoadmapPage
    participant Mutations as useRoadmapMutations
    participant RoadmapApi as roadmaps-api.ts
    participant Routes as /api/roadmaps
    participant Service as roadmap.service
    participant Template as RoadmapTemplate
    participant UserRoadmap
    participant StepProgress as UserRoadmapStepProgress
    participant QueryCache as React Query cache

    Student->>RoadmapPage: Start roadmap
    RoadmapPage->>Mutations: useAssignRoadmap(templateId)
    Mutations->>RoadmapApi: POST /roadmaps/assign
    RoadmapApi->>Routes: request
    Routes->>Template: validateTemplateExists
    Routes->>Service: assignRoadmapToUser
    Service->>UserRoadmap: create unique user/template assignment
    Service-->>Routes: assigned roadmap
    Routes-->>RoadmapApi: 201/200 data
    Mutations->>QueryCache: invalidate my-roadmaps + dashboard

    Student->>RoadmapPage: Mark step completed
    RoadmapPage->>Mutations: useUpdateRoadmapStep()
    Mutations->>RoadmapApi: PUT /roadmaps/:roadmapId/steps/:stepKey/progress
    RoadmapApi->>Routes: status payload
    Routes->>Service: updateStepProgress
    Service->>StepProgress: upsert step progress
    Service->>UserRoadmap: recalculate progressPercent/status
    Service-->>Routes: updated step
    Routes-->>RoadmapApi: data
    Mutations->>QueryCache: invalidate progress + my-roadmaps + dashboard
```

## 10. Course Browse and Progress Sequence

```mermaid
sequenceDiagram
    actor Student
    participant Home as Home/CoursePage
    participant CourseApi as courses-api.ts
    participant CourseRoutes as /api/courses
    participant CourseService as courses.service
    participant Course
    participant Progress as UserCourseProgress

    Student->>Home: Browse courses
    Home->>CourseApi: GET /courses/published?limit=n
    CourseApi->>CourseRoutes: public request
    CourseRoutes->>CourseService: listPublishedCourses
    CourseService->>Course: find published, not deleted
    Course-->>CourseApi: course cards

    Student->>Home: Open course detail
    Home->>CourseApi: GET /courses/published/:slug
    CourseApi->>CourseRoutes: public request
    CourseRoutes->>CourseService: getPublishedCourseBySlug
    CourseService->>Course: load sections/lessons
    Course-->>Home: detail

    Student->>Home: Enroll / update lesson progress
    Home->>CourseRoutes: POST /courses/enroll or PUT /courses/:courseId/progress
    CourseRoutes->>CourseService: enrollCourse / updateCourseProgress
    CourseService->>Progress: create or update progress
    CourseService->>Course: update stats when completed/rated
    CourseRoutes-->>Home: progress response
```

## 11. AI Roadmap Generation Sequence

```mermaid
sequenceDiagram
    actor Student
    participant AiPage as AiRoadmapPage
    participant AiMutation as useAiMutations
    participant AiApi as ai-api.ts
    participant AiRoute as /api/ai
    participant Usage as UserAiUsage
    participant DraftSvc as roadmap-draft service
    participant Provider as AI provider
    participant Template as RoadmapTemplate
    participant Roadmap as UserRoadmap

    Student->>AiPage: Enter prompt + level + study plan
    AiPage->>AiMutation: useGenerateAiRoadmapDraft()
    AiMutation->>AiApi: POST /ai/roadmaps/user-draft
    AiApi->>AiRoute: protected student request
    AiRoute->>Usage: check draft limit
    AiRoute->>DraftSvc: generateUserAiRoadmapDraft
    DraftSvc->>Provider: structured prompt
    Provider-->>DraftSvc: roadmap JSON/markdown
    DraftSvc-->>AiRoute: sanitized draft + access state
    AiRoute-->>AiApi: draft payload
    AiApi-->>AiPage: preview draft

    Student->>AiPage: Save roadmap
    AiPage->>AiMutation: useSaveAiRoadmap()
    AiMutation->>AiApi: POST /ai/roadmaps/save
    AiApi->>AiRoute: draft payload
    AiRoute->>Template: create user-ai template
    AiRoute->>Roadmap: assign saved template to user
    AiRoute->>Usage: record ai_roadmap_save activity/usage
    AiRoute-->>AiApi: template + user roadmap
```

## 12. AI Chat Sequence

```mermaid
sequenceDiagram
    actor Student
    participant ChatPage as AiChatPage
    participant AiApi as ai-api.ts
    participant AiRoute as /api/ai/chat
    participant Conversation as UserAiConversation
    participant Message as UserAiMessage
    participant Provider as AI provider
    participant Search as Course/Roadmap search
    participant Usage as UserAiUsage

    Student->>ChatPage: Start or open chat
    ChatPage->>AiApi: GET /ai/chat/conversations
    AiApi->>Conversation: list non-deleted conversations
    Conversation-->>ChatPage: conversations

    Student->>ChatPage: Send message
    ChatPage->>AiApi: POST /ai/chat/conversations/:id/messages
    AiApi->>AiRoute: message + context
    AiRoute->>Message: persist user message
    AiRoute->>Search: collect relevant course/roadmap links
    AiRoute->>Provider: send prompt + context
    Provider-->>AiRoute: assistant answer
    AiRoute->>Message: persist assistant message + links/tokens
    AiRoute->>Usage: increment ai_chat usage
    AiRoute-->>ChatPage: conversation + messages + access state
```

## 13. Admin Content Management Sequence

```mermaid
sequenceDiagram
    actor Admin
    participant AdminPage as Admin pages
    participant AdminApi as admin-api.ts
    participant AdminRoute as /api/admin
    participant Protect as protect + authorizeRoles(admin)
    participant AdminService as admin services
    participant Model as Course/RoadmapTemplate/User
    participant Log as AdminActionLog

    Admin->>AdminPage: Open admin dashboard/list
    AdminPage->>AdminApi: GET /admin/overview or list endpoint
    AdminApi->>AdminRoute: protected request
    AdminRoute->>Protect: validate token + role
    Protect-->>AdminRoute: admin allowed
    AdminRoute->>AdminService: fetch data
    AdminService->>Model: query aggregates/list
    Model-->>AdminPage: data

    Admin->>AdminPage: Create/update/delete/publish content
    AdminPage->>AdminApi: POST/PATCH/DELETE admin endpoint
    AdminApi->>AdminRoute: payload
    AdminRoute->>Protect: validate admin role
    AdminRoute->>AdminService: mutate target
    AdminService->>Model: write target entity
    AdminService->>Log: record action
    AdminService-->>AdminPage: mutation result
```

## 14. Contact Support Sequence

```mermaid
sequenceDiagram
    actor Visitor
    participant ContactPage
    participant ContactApi as contact-api.ts
    participant ContactRoute as POST /api/contact
    participant AdminRoute as /api/admin/contact-messages
    participant ContactService
    participant ContactMessage
    participant Mailer
    participant AdminPage as AdminContactMessagesPage

    Visitor->>ContactPage: Submit contact form
    ContactPage->>ContactApi: POST /contact
    ContactApi->>ContactRoute: public request
    ContactRoute->>ContactService: sendContactMessage
    ContactService->>ContactMessage: create unread message
    ContactService->>Mailer: notify admins
    ContactService-->>ContactPage: success

    AdminPage->>AdminRoute: GET /api/admin/contact-messages
    AdminRoute-->>AdminPage: message list
    AdminPage->>AdminRoute: POST /api/admin/contact-messages/:id/reply
    AdminRoute->>ContactMessage: append reply + mark replied
    AdminRoute->>Mailer: send reply to visitor
```

## 15. State Diagram: User Roadmap

```mermaid
stateDiagram-v2
    [*] --> assigned: POST /roadmaps/assign
    assigned --> inProgress: first step started/completed
    inProgress --> paused: user/admin pause workflow
    paused --> inProgress: resume
    inProgress --> completed: progressPercent = 100
    assigned --> archived: archive status
    inProgress --> archived: archive status
    completed --> archived: archive status
    assigned --> [*]: DELETE /roadmaps/:roadmapId
    inProgress --> [*]: DELETE /roadmaps/:roadmapId
    completed --> [*]: DELETE /roadmaps/:roadmapId
```

## 16. State Diagram: Course Progress

```mermaid
stateDiagram-v2
    [*] --> notStarted: POST /courses/enroll
    notStarted --> inProgress: PUT /courses/:courseId/progress
    inProgress --> completed: POST /courses/:courseId/complete or all lessons done
    inProgress --> abandoned: POST /courses/:courseId/abandon
    abandoned --> inProgress: re-enroll/update progress
```

## 17. Deployment Runtime View

```mermaid
flowchart LR
    UserBrowser["User browser"]
    FrontendHost["Frontend host<br/>Vite build / Vercel-compatible"]
    BackendHost["Backend host<br/>Express server / serverless-compatible"]
    Mongo["MongoDB Atlas"]
    Providers["Providers<br/>Email, OAuth, AI, Cloudinary"]

    UserBrowser --> FrontendHost
    FrontendHost -->|static assets| UserBrowser
    UserBrowser -->|VITE_API_BASE_URL / local API base| BackendHost
    BackendHost --> Mongo
    BackendHost --> Providers
```

## 18. Route Surface Summary

| Route group | Public endpoints | Protected student endpoints | Protected admin endpoints |
| --- | --- | --- | --- |
| `/api/auth` | signup, login, verify email, password reset, Google OAuth, token refresh | logout, check-auth, preferences, dashboard summary, profile/avatar/password, account lifecycle | N/A |
| `/api/roadmaps` | search, list templates, template by ID/slug, topic by step | my templates by slug, assign, list assigned roadmaps, progress, step progress, delete assignment | template CRUD/publish/unpublish/steps through role-protected route |
| `/api/courses` | published list, published detail by slug | enroll, list my courses, progress, complete, rate, abandon | N/A |
| `/api/ai` | N/A | recommendations, feature access, chat, user roadmap draft/save/visibility, topic explanation | admin roadmap draft |
| `/api/admin` | admin auth login/verify/reset | N/A | overview, users, roadmaps, courses, contact messages, logs, auth check/logout |
| `/api/contact` | submit contact message | N/A | admin replies through `/api/admin/contact-messages/:id/reply` |
