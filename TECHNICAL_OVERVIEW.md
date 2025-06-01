# Technical Overview: AI Code Reviewer

This document provides a high-level technical overview of the AI Code Reviewer application, detailing its architecture, technology stack, and key data flows.

## 1. Architecture

The application follows a modern full-stack web architecture built upon Next.js and Supabase.

- **Frontend (Client-Side):**

  - **Next.js App Router:** Manages routing, rendering (Server Components, Client Components), and server-side logic execution (Server Actions).
  - **React 19:** Used for building the user interface with components.
  - **ShadCN UI & Tailwind CSS:** Provide the component library and styling utilities for a consistent and modern look and feel.
  - **Framer Motion:** Enhances UI with animations and transitions.
  - Client-side Supabase client interacts with Supabase Auth for user interactions (login, signup) and real-time updates if configured.

- **Backend (Server-Side & BaaS):**

  - **Next.js Server Capabilities:**
    - **Server Components:** Render on the server, allowing direct data fetching (e.g., using Prisma) and reducing client-side JavaScript.
    - **Route Handlers:** Create API endpoints (e.g., for Supabase OAuth callbacks).
    - **Server Actions:** Functions that execute on the server, callable from Client Components, used for all mutations (CRUD operations, API calls like Gemini). This keeps sensitive logic and API keys off the client.
  - **Supabase (Backend-as-a-Service):**
    - **Authentication:** Manages user identities, sessions, and provides various auth methods (email/password, OAuth, Magic Link).
    - **PostgreSQL Database:** Hosts the application's data (user profiles, projects). Supabase provides direct PostgreSQL access with connection pooling.
  - **Prisma (ORM):** Facilitates database interactions (queries, mutations) with type safety, connecting to the Supabase PostgreSQL database.
  - **Google Gemini API:** External AI service used for code review. API calls are made securely from Server Actions.

- **Database:**
  - **Supabase PostgreSQL:** The primary datastore for user profiles, projects, and potentially other application data.
  - **Prisma Schema (`prisma/schema.prisma`):** Defines the database models and relationships.
  - **Prisma Migrate:** Manages database schema migrations.

## 2. Technology Stack Summary

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI Library:** React 19
- **Component Library:** ShadCN UI
- **Styling:** Tailwind CSS
- **State Management:** Primarily React local state (`useState`, `useReducer`), `useTransition` for pending states with Server Actions. Global state for auth is implicitly managed by Supabase and Next.js server/client context.
- **Backend Services:** Supabase (Auth, PostgreSQL DB)
- **ORM:** Prisma
- **AI Service:** Google Gemini API
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Package Manager:** pnpm
- **Deployment Target (Assumed):** Platforms supporting Next.js (e.g., Vercel, Netlify, AWS Amplify, self-hosted Node.js).

## 3. Data Flow Examples

### 3.1. User Authentication (Email/Password Login)

1.  **User Interaction:** User enters credentials in `AuthForm.tsx` (Client Component) and clicks "Log In".
2.  **Client-Side Supabase Call:** `AuthForm` calls `supabase.auth.signInWithPassword()` using the browser Supabase client.
3.  **Supabase Auth Service:** Supabase verifies credentials.
4.  **Session Creation:** Supabase creates a session and returns it to the client (sets cookies).
5.  **Client-Side Redirect:** `AuthForm` redirects the user to the reviewer page (`/reviewer`).
6.  **Middleware & Server Session:**
    - Next.js middleware (`middleware.ts`) uses `updateSession` from `@supabase/ssr` to ensure the session cookie is correctly managed and readable by server components.
    - On subsequent requests, Server Components can access the user's session via `createSupabaseServerClient().auth.getUser()`.

### 3.2. Creating a New Project

1.  **User Interaction:** User fills out the "Create Project" form (e.g., in `ProjectsClientPage.tsx` or `ReviewerClientPage.tsx`) and submits.
2.  **Server Action Call:** The Client Component calls the `createNewProject(formData)` Server Action defined in `app/actions/projectActions.ts`.
3.  **Server Action Execution (Server-Side):**
    - `createNewProject` uses `createSupabaseServerClient()` to get the authenticated user ID.
    - It validates the form data.
    - It uses the `prisma` client to execute `prisma.project.create()` to insert a new project into the database.
    - It calls `revalidatePath()` to invalidate Next.js cache for relevant pages, triggering a data refresh on the client.
    - It returns an `ActionResponse` object (success/error, data, message).
4.  **Client-Side Update:** The Client Component receives the `ActionResponse`, updates its local state (e.g., adds the new project to the list), and displays a success/error message.

### 3.3. Performing an AI Code Review

1.  **User Interaction:** User enters code, selects AI models (e.g., Gemini) in `ReviewerClientPage.tsx`, and clicks "Get Review".
2.  **Server Action Call (for Gemini):** `ReviewerClientPage.tsx` calls the `getGeminiReviewAction(code)` Server Action.
3.  **Server Action Execution (Server-Side):**
    - `getGeminiReviewAction` retrieves the `GEMINI_API_KEY` from server environment variables.
    - It initializes the `@google/genai` client.
    - It sends the code and system instruction to the Gemini API.
    - It processes the API response (text, token usage).
    - It returns an `ActionResponse` with the review data or an error.
4.  **Client-Side Update (for Gemini):** `ReviewerClientPage.tsx` receives the response and updates its `reviews` state for the Gemini model, displaying the feedback or error in the `ReviewOutput.tsx` component.
5.  **Mock Service Call (for simulated models):** If a simulated model is selected, `ReviewerClientPage.tsx` directly calls the client-side `getMockReview()` function from `services/mockAIService.ts`, which returns a promise with simulated data. The state is updated similarly.

## 4. Database Schema

(Refer to `prisma/schema.prisma` for the exact definitions)

- **`Profile` Model:**
  - Mirrors Supabase `auth.users` table `id`.
  - Stores application-specific user information like `username`, `email`, `profilePictureUrl`.
  - Has a one-to-many relationship with `Project` (a user can have many projects).
- **`Project` Model:**
  - Stores code projects.
  - Fields: `id`, `userId` (foreign key to `Profile`), `name`, `code`, `createdAt`, `updatedAt`.

## 5. Key Technical Decisions & Benefits

- **Next.js App Router:** Enables a mix of Server Components (performance, direct data access) and Client Components (interactivity), leading to optimized builds and improved user experience. Server Actions simplify data mutations.
- **Supabase:** Provides a robust and scalable BaaS solution, significantly reducing backend development overhead for auth and database management. Its PostgreSQL offering is powerful.
- **Prisma:** Offers a type-safe ORM, making database interactions easier and less error-prone. Migrations and seeding tools are valuable for development.
- **ShadCN UI:** Provides a set of beautifully designed, accessible, and customizable components built on Tailwind CSS, speeding up UI development.
- **Server Actions for mutations/API calls:** Enhances security by keeping sensitive API keys and business logic on the server, preventing exposure to the client.
- **TypeScript:** Ensures type safety throughout the application, reducing runtime errors and improving code maintainability.

This overview should provide a good understanding of the application's technical foundations.
