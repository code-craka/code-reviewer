# AI Code Reviewer Windsurf Rules

## Package Manager

- Always use pnpm instead of npm for all package management operations
- Use "pnpm add" instead of "npm install" for adding packages
- Use "pnpm run" or directly "pnpm" for running scripts

## Code Structure

- Next.js app router structure with /app directory for routes
- React components in /components directory organized by feature/purpose
- Utility functions in /lib directory
- Types in /types directory
- Server actions in /app/**/actions.ts files
- Client-side hooks in /hooks directory

## TypeScript

- Maintain strict type checking
- Use proper type assertions for enum values
- Avoid using "any" type
- Define interfaces and types in appropriate files
- Ensure all components have proper prop types defined

## Component Patterns

- Use "use client" directive for client components
- Use named exports for components
- Follow atomic design principles (atoms, molecules, organisms)
- UI components in /components/ui
- Feature components in feature-specific directories

## File Naming

- Use PascalCase for component files (e.g., Button.tsx)
- Use kebab-case for utility files (e.g., review-service.ts)
- Use camelCase for hook files (e.g., useReview.ts)
- Add .server.ts suffix for server-only code when needed

## Imports

- Group imports: React, Next.js, third-party, internal
- Use absolute imports with @ alias for project imports
- Destructure imports when appropriate

## API Integration

- Ensure proper error handling for all API calls
- Create appropriate service classes for API interactions
- Use proper typing for API responses

## Supabase Integration

- Always await createSupabaseServerClient() before accessing its properties
- Use proper type casting for enum fields from database
- Follow the pattern of database field -> enum conversion in service classes

## UI Components

- Use shadcn/ui component patterns and styling
- Consistent use of Tailwind CSS for styling
- Use proper UI component composition

## Testing

- Add unit tests for utility functions
- Add integration tests for components
- Add E2E tests for critical user flows

## Security

- Validate user permissions for all database operations
- Properly sanitize user input
- Use environment variables for sensitive information
- Never expose API keys in client-side code
