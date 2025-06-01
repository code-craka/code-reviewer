
# Code Implementation Details

This document provides an overview of how key features are implemented in the AI Code Reviewer application.

## 1. Authentication

Authentication is handled by **Supabase Auth**, leveraging its integration with Next.js SSR capabilities.

*   **Supabase Clients:**
    *   `lib/supabase/client.ts`: Creates a Supabase client for use in browser/Client Components.
    *   `lib/supabase/server.ts`: Creates a Supabase client for Server Components, Route Handlers, and Server Actions, handling cookie management.
    *   `lib/supabase/middleware.ts` & `middleware.ts`: Manages user sessions by refreshing them on each request, ensuring server-side components have up-to-date auth state.
*   **Login/Signup UI:**
    *   `app/login/page.tsx`: Server Component that checks if a user is already logged in and redirects. It wraps the `AuthForm`.
    *   `components/auth/AuthForm.tsx`: Client Component providing the UI for email/password, OAuth (Google, GitHub), and Magic Link authentication. It uses the browser Supabase client to call methods like `signInWithPassword`, `signUp`, `signInWithOAuth`, `signInWithOtp`.
*   **OAuth & Magic Link Callback:**
    *   `app/auth/callback/route.ts`: A Route Handler that processes the callback from Supabase after OAuth sign-in or magic link confirmation. It exchanges the authorization code for a session and, importantly, **upserts a user profile** into the `profiles` table in Prisma. This ensures that every authenticated Supabase user has a corresponding entry in our application's profile system.
*   **Profile Creation on Callback:**
    The callback route ensures a local profile is created/updated in the `profiles` (Prisma model) table, linking it to the `auth.users` (Supabase model) `id`. This profile stores application-specific user data like username and profile picture URL if not directly managed by Supabase user metadata.
*   **Session Management:**
    *   The Next.js middleware (`middleware.ts`) ensures the user's session is kept fresh.
    *   Server Components can access user session data via `createSupabaseServerClient().auth.getUser()`.
    *   Client Components can use `createSupabaseBrowserClient().auth.onAuthStateChange()` or `getUser()` to react to auth state.
*   **Navbar:**
    *   `components/Navbar.tsx`: Displays user information and logout functionality. It receives initial user data as props (fetched server-side in layouts/pages) and also listens to client-side auth state changes.

## 2. Project Management (CRUD)

Project data (name, code, user association) is stored in the PostgreSQL database managed by Supabase and accessed via Prisma.

*   **Prisma Schema:**
    *   `prisma/schema.prisma`: Defines the `Project` model, with fields like `id`, `userId` (linking to `Profile` which links to `auth.users.id`), `name`, `code`, `createdAt`, `updatedAt`.
*   **Server Actions:**
    *   `app/actions/projectActions.ts`: Contains all backend logic for Project CRUD operations. These are Server Actions callable from Client Components.
        *   `getUserProjects()`: Fetches projects for the authenticated user.
        *   `createNewProject(formData)`: Creates a new project.
        *   `updateExistingProject(formData)`: Updates an existing project's name or code.
        *   `deleteExistingProject(projectId)`: Deletes a project.
        *   `getProjectById(projectId)`: Fetches a single project by its ID.
    *   These actions use `createSupabaseServerClient()` to get the authenticated user and then use `prisma` client to interact with the database.
    *   `revalidatePath()` from `next/cache` is used to update cached data and refresh UI on relevant pages after mutations.
*   **UI Components:**
    *   `app/projects/page.tsx` & `app/projects/ProjectsClientPage.tsx`: Display the list of user projects and provide UI for creating, renaming, and deleting projects using ShadCN UI `Card`, `Dialog`, `Button`, `Input`.
    *   `app/reviewer/ReviewerClientPage.tsx`: Allows users to select a project from a dropdown (ShadCN `Select`), load its code, save changes, or create a new project from the current code in the editor.
*   **Data Flow:**
    1.  Client Component (e.g., `ProjectsClientPage`) calls a Server Action (e.g., `createNewProject`).
    2.  Server Action authenticates the user, validates input, and uses Prisma to perform the database operation.
    3.  Server Action returns a `ActionResponse` (success/error, data, message).
    4.  Client Component updates its state based on the response and displays feedback.

## 3. AI Code Review

*   **Gemini API Integration:**
    *   `app/actions/geminiActions.ts`: Contains the `getGeminiReviewAction(code)` Server Action.
    *   This action retrieves the `GEMINI_API_KEY` from server-side environment variables.
    *   It uses the `@google/genai` SDK (`GoogleGenAI` class) to make a `generateContent` call to the specified Gemini model (`gemini-2.5-flash-preview-04-17`).
    *   The `CODE_REVIEW_SYSTEM_INSTRUCTION` constant provides context to the AI model.
    *   It extracts the review text and token usage from the API response.
    *   Error handling is included for API key issues or quota limits.
*   **Mock AI Services:**
    *   `services/mockAIService.ts`: Simulates API calls for other AI models (ChatGPT, Claude, DeepSeek). This is a client-side utility that returns a promise with simulated feedback and token usage. This demonstrates how other models *could* be integrated if their Server Actions were built.
*   **Reviewer UI:**
    *   `app/reviewer/ReviewerClientPage.tsx`:
        *   `CodeInput`: For users to paste their code (ShadCN `Textarea`).
        *   `ModelSelector`: Allows users to choose which AI models to use for review (ShadCN `Checkbox`).
        *   Handles the submission logic:
            *   Iterates over selected models.
            *   If Gemini is selected, calls `getGeminiReviewAction`.
            *   If a simulated model is selected, calls `getMockReview`.
        *   Updates the `reviews` state with feedback, loading status, errors, and token counts for each model.
    *   `components/review/ReviewOutput.tsx`: Displays the review from each selected AI model in a ShadCN `Card`, showing feedback, errors, or loading state.
*   **State Management:**
    *   Local component state (`useState`, `useTransition`) in `ReviewerClientPage.tsx` manages the current code, selected models, review results, and UI feedback (errors/info messages).

## 4. UI and Styling

*   **ShadCN UI:** Used extensively for pre-built, accessible, and themeable components like `Button`, `Card`, `Dialog`, `Input`, `Select`, `Accordion`, `Sheet`, etc.
    *   `components.json`: Configures ShadCN UI.
    *   `lib/utils.ts`: Contains the `cn` utility for merging Tailwind classes.
    *   Components are typically added via `pnpm shadcn-ui@latest add <component_name>`.
*   **Tailwind CSS:** Provides utility classes for styling.
    *   `tailwind.config.ts`: Configured for ShadCN UI, including CSS variables for theming and custom animations/colors.
    *   `app/globals.css`: Defines root CSS variables for light/dark themes and base styles.
*   **Framer Motion:** Used for page transitions and micro-interactions to enhance the user experience. Integrated into various Client Components.
*   **Lucide React:** Provides a comprehensive set of SVG icons.

## 5. Profile Management

*   **Prisma Schema:**
    *   `prisma/schema.prisma`: Defines the `Profile` model, linked one-to-one with Supabase's `auth.users` table via the `id` field. Stores `username`, `email`, `profilePictureUrl`.
*   **Server Action:**
    *   `app/profile/actions.ts`: Contains `updateProfileServerAction(formData)` to update user's username or profile picture URL. It validates input (e.g., username uniqueness, URL format) and uses Prisma to update the `profiles` table.
*   **UI:**
    *   `app/profile/page.tsx` & `app/profile/ProfileClientPage.tsx`: Allows users to view their email (from Supabase session), and view/edit their username and profile picture URL. Uses ShadCN UI components for forms and display.
    *   The user's avatar and username are also displayed in the main `Navbar`.

This covers the core implementation strategies. The use of Server Components for data fetching, Client Components for interactivity, and Server Actions for mutations is a key pattern throughout the Next.js application.
