
# AI Code Reviewer - Next.js Edition

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An advanced AI-powered code review application built with Next.js (App Router), Supabase for backend services (Auth, Database), Prisma as the ORM, ShadCN UI for components, and Tailwind CSS for styling. It allows users to get code reviews from Gemini API (and simulates other models).

## Table of Contents

1.  [Features](#features)
2.  [Tech Stack](#tech-stack)
3.  [Project Structure Overview](#project-structure-overview)
4.  [Getting Started](#getting-started)
    *   [Prerequisites](#prerequisites)
    *   [Setup](#setup)
    *   [Environment Variables](#environment-variables)
    *   [Database Setup](#database-setup)
    *   [Running the Application](#running-the-application)
5.  [Key Functionalities](#key-functionalities)
6.  [Database Migrations & Seeding](#database-migrations--seeding)
7.  [Available Scripts](#available-scripts)
8.  [Contributing](#contributing)
9.  [License](#license)

## Features

*   **User Authentication:** Secure signup, login (email/password, Google, GitHub, Magic Link) via Supabase Auth.
*   **Project Management:** Users can create, read, update, and delete their code projects, stored securely in a Supabase PostgreSQL database via Prisma.
*   **AI Code Review:**
    *   Integrates with Google's Gemini API for code analysis.
    *   Simulates reviews from other models (ChatGPT, Claude, DeepSeek) for demonstration.
    *   Displays feedback, potential bugs, performance issues, and security flaws.
*   **Modern UI/UX:**
    *   Built with Next.js 14 App Router.
    *   Styled with Tailwind CSS and ShadCN UI components.
    *   Includes a sleek landing page and an intuitive application interface.
    *   Dark mode friendly.
    *   Animations with Framer Motion.
*   **Profile Management:** Users can view and update their profile information (username, profile picture).
*   **Server-Side Logic:** Uses Next.js Server Actions for mutations and API calls, enhancing security and performance.

## Tech Stack

*   **Framework:** Next.js 14 (App Router)
*   **Language:** TypeScript
*   **Backend-as-a-Service (BaaS):** Supabase
    *   Authentication
    *   PostgreSQL Database
*   **ORM:** Prisma
*   **UI Components:** ShadCN UI
*   **Styling:** Tailwind CSS
*   **AI Model:** Google Gemini API
*   **Animations:** Framer Motion
*   **Icons:** Lucide React
*   **Package Manager:** pnpm

## Project Structure Overview

(For a more detailed breakdown, see `PROJECT_STRUCTURE.md`)

*   `app/`: Next.js App Router directory. Contains layouts, pages, route handlers, and server components.
    *   `app/actions/`: Server Actions for mutations (e.g., project CRUD, Gemini API calls).
    *   `app/auth/`: Authentication related routes (e.g., callback).
    *   `app/(landing_pages)/`: Root `page.tsx` is the landing page. Other static pages like `terms`, `privacy`.
    *   `app/(app_pages)/`: Routes for the core application (`reviewer`, `projects`, `profile`, `login`).
*   `components/`: Shared React components.
    *   `components/ui/`: ShadCN UI components (and custom wrappers like `CustomAlert.tsx`).
    *   `components/auth/`: Authentication specific components.
    *   `components/review/`: Components for the AI reviewer interface.
    *   `components/landing/`: Components specific to the landing page.
*   `lib/`: Utility functions, constants, Supabase/Prisma client initializations.
*   `prisma/`: Prisma schema, migrations, and seed script.
*   `public/`: Static assets.
*   `services/`: Client-side service simulations (e.g., `mockAIService.ts`).
*   `types/`: TypeScript type definitions.

## Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   pnpm (package manager): `npm install -g pnpm`
*   A Supabase account and project.
*   A Google Gemini API Key.

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

### Environment Variables

Create a `.env.local` file in the root of your project by copying `.env.local.example` (if provided, otherwise create it from scratch). Fill in the necessary environment variables:

```env
# Supabase - Get these from your Supabase project settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key # For admin tasks like seeding auth users
SUPABASE_JWT_SECRET=your-supabase-jwt-secret # From Supabase project settings > API > JWT Settings

# Prisma - Use the connection string from Supabase project settings > Database > Connection pooling (with pgbouncer)
# Replace [YOUR-PASSWORD] with your actual database password.
DATABASE_URL="postgresql://postgres.project_ref:[YOUR-PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
# DIRECT_URL is used for migrations. Replace [YOUR-PASSWORD].
DIRECT_URL="postgresql://postgres.project_ref:[YOUR-PASSWORD]@aws-0-region.pooler.supabase.com:5432/postgres"

# Gemini API Key
GEMINI_API_KEY=your-google-gemini-api-key

# Application URL (important for OAuth redirects and email links)
NEXT_PUBLIC_SITE_URL=http://localhost:3000 # For local development
# For production, set to your deployed site URL, e.g., https://yourapp.com
```

**Important:**
*   Get your Supabase URL, Anon Key, Service Role Key, and JWT Secret from your Supabase project's API settings.
*   Get your Database Connection Strings (DATABASE_URL and DIRECT_URL) from your Supabase project's Database settings. **Remember to replace `[YOUR-PASSWORD]` with the actual password you set for your Supabase database.**
*   Generate a Gemini API Key from Google AI Studio.

### Database Setup

1.  **Ensure your `DATABASE_URL` and `DIRECT_URL` in `.env.local` are correct.**
2.  **Run Prisma migrations** to create the database schema based on `prisma/schema.prisma`:
    ```bash
    pnpm prisma:migrate:dev --name init_tables
    ```
    This will create the `profiles` and `projects` tables (and any others defined in your schema) in your Supabase PostgreSQL database. It will also create a `migrations` folder in `prisma/`.

3.  **(Optional) Seed the database** with initial data (test users, sample projects):
    ```bash
    pnpm prisma:seed
    ```
    This executes the script in `prisma/seed.ts`. You might need to adjust the seed script or Supabase user creation based on your testing needs.

### Running the Application

1.  **Start the development server:**
    ```bash
    pnpm dev
    ```
    This command will also attempt to apply any pending database migrations (`prisma migrate deploy`) and regenerate Prisma client before starting the Next.js server.
    The application should now be running on `http://localhost:3000`.

2.  **Open Prisma Studio (Optional):**
    To view and manage your database data directly:
    ```bash
    pnpm prisma:studio
    ```

## Key Functionalities

(For more details, see `CODE_IMPLEMENTATION.md`)

*   **Authentication:** Handled by Supabase Auth. OAuth (Google, GitHub), email/password, and magic links are supported. User profiles are stored in a `profiles` table linked to `auth.users`.
*   **Project CRUD:** Server Actions in `app/actions/projectActions.ts` use Prisma to manage user projects.
*   **AI Review:** `app/actions/geminiActions.ts` makes calls to the Gemini API. Simulated models are handled by `services/mockAIService.ts`.
*   **UI:** Built with ShadCN UI components and Tailwind CSS, organized within the `components/` directory.

## Database Migrations & Seeding

*   **Schema:** Defined in `prisma/schema.prisma`.
*   **Migrations:**
    *   Generate a new migration: `pnpm prisma:migrate:dev --name <migration_name>`
    *   Apply migrations (e.g., in production): `pnpm prisma:migrate:deploy`
    *   Reset database (dev only!): `pnpm prisma migrate reset`
    *   See `prisma/migrations/MIGRATION_README.md` for more details.
*   **Seeding:**
    *   Run seed script: `pnpm prisma:seed`
    *   Seed script location: `prisma/seed.ts` (configurable in `package.json`).

## Available Scripts

*   `pnpm dev`: Starts the development server with automatic migration deployment.
*   `pnpm build`: Builds the application for production.
*   `pnpm start`: Starts the production server.
*   `pnpm lint`: Lints the codebase.
*   `pnpm prisma:generate`: Generates Prisma Client.
*   `pnpm prisma:migrate:dev`: Creates and applies a new migration in development.
*   `pnpm prisma:migrate:deploy`: Applies pending migrations (for production).
*   `pnpm prisma:studio`: Opens Prisma Studio.
*   `pnpm prisma:seed`: Seeds the database.

## Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

Please ensure your code adheres to the existing style and that all tests pass.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details (assuming you'll add one).
If no LICENSE file is present, it's typically considered proprietary unless otherwise stated.
