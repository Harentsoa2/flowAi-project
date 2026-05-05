# flowAi

flowAi is an AI-powered web app builder. Users describe what they want to create, and the platform turns that request into a generated Next.js application inside an isolated E2B sandbox. Each project keeps its conversation history, generated files, live preview URL, and usage status.

The goal of flowAi is to provide a focused workspace for quickly creating and iterating on small web apps, prototypes, dashboards, landing pages, and interactive tools through natural language.

## Features

- AI-assisted project creation from a plain text prompt
- AI-generated project names using OpenAI
- Conversational iteration on existing projects
- Background code generation with Inngest
- Isolated Next.js sandboxes powered by E2B
- Live preview of generated apps
- Generated file explorer with syntax highlighting
- Split workspace with chat, preview, and code views
- Project persistence with Prisma and PostgreSQL
- Authentication with Clerk
- Usage tracking and credit limits
- Pricing page integration through Clerk billing components
- Responsive UI built with Tailwind CSS and Shadcn/Radix primitives

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Shadcn UI and Radix UI
- tRPC
- TanStack Query
- Prisma ORM
- PostgreSQL
- Clerk authentication and billing UI
- Inngest background jobs
- Inngest Agent Kit
- OpenAI models
- E2B Code Interpreter sandboxes
- Lucide React icons

## How It Works

1. A user submits a prompt describing the app they want to build.
2. flowAi generates a short project name with OpenAI.
3. The project and first user message are saved in PostgreSQL.
4. An Inngest event starts the background code-generation workflow.
5. The workflow creates or connects to an E2B sandbox.
6. The coding agent writes and updates files inside the sandbox.
7. The sandbox runs a Next.js development server on port `3000`.
8. flowAi saves the generated files, preview URL, and assistant response.
9. The user can preview the app, inspect files, and continue iterating by sending more messages.

## Prerequisites

Before running the project, install or configure:

- Node.js 20 or newer
- npm
- PostgreSQL database
- OpenAI API key
- Clerk application
- E2B account and API key
- Docker, required for building the E2B template

## Environment Variables

Create a `.env` file at the project root. You can start from `env.example`.

```bash
DATABASE_URL=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY=""

# E2B
E2B_API_KEY=""
E2B_TEMPLATE_NAME="flowai-nextjs-001"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/"
```

## Installation

Install dependencies:

```bash
npm install
```

Generate the Prisma client:

```bash
npm run postinstall
```

Run database migrations:

```bash
npx prisma migrate dev
```

## Build The E2B Template

The AI agent writes files inside an E2B sandbox. That sandbox is based on the template in `sandbox-templates/nextjs`.

Install and authenticate the E2B CLI:

```bash
npm i -g @e2b/cli
e2b auth login
```

Build the template:

```bash
cd sandbox-templates/nextjs
e2b template build --name flowai-nextjs-001 --cmd "/compile_page.sh"
```

Make sure the template name matches your environment variable:

```bash
E2B_TEMPLATE_NAME="flowai-nextjs-001"
```

If you choose a different template name, update `E2B_TEMPLATE_NAME` in `.env`.

## Run Locally

Start the Next.js development server:

```bash
npm run dev
```

In a second terminal, start the Inngest dev server:

```bash
npm run inngest:dev
```

Open the app:

```bash
http://localhost:3000
```

## Useful Scripts

```bash
npm run dev          # Start the local Next.js app
npm run build        # Build the production app
npm run start        # Start the production server
npm run lint         # Run ESLint
npm run inngest:dev  # Start the local Inngest dev server
npm run postinstall  # Generate the Prisma client
```

## Database Commands

```bash
npx prisma migrate dev     # Create and apply a local migration
npx prisma studio          # Open Prisma Studio
npx prisma generate        # Regenerate Prisma client
npx prisma migrate reset   # Reset the database in development
```

## Project Structure

```text
src/app/                 Next.js routes and layouts
src/components/          Shared UI components
src/components/ui/       Shadcn/Radix UI primitives
src/inngest/             Inngest client, functions, sandbox helpers
src/lib/                 Database, usage, project-name, utilities
src/modules/home/        Home page UI and prompt templates
src/modules/messages/    Message API procedures
src/modules/projects/    Project API procedures and workspace UI
src/modules/usage/       Usage API procedures
src/trpc/                tRPC server and client setup
prisma/                  Prisma schema and migrations
public/                  Static assets
sandbox-templates/       E2B sandbox template files
```

## Important Files

- `src/prompt.ts` contains the system prompts used by the coding agent and response generators.
- `src/inngest/functions.ts` contains the main background generation workflow.
- `src/inngest/utils.ts` contains sandbox connection, server readiness, and output parsing helpers.
- `src/lib/project-name.ts` generates project names with OpenAI.
- `src/modules/home/constants.ts` contains the predefined prompt suggestions shown on the home page.
- `sandbox-templates/nextjs/compile_page.sh` starts the Next.js server inside generated sandboxes.

## AI Generation Notes

The generated app runs inside an isolated sandbox, not directly inside this repository. The agent is instructed to:

- Write only relative sandbox paths such as `app/page.tsx`
- Use Tailwind CSS for styling
- Avoid nested interactive elements such as `button > button`
- Avoid plain white or gray-only designs unless requested
- Keep generated apps functional, responsive, and accessible
- Avoid starting or restarting the dev server from inside the agent

## Troubleshooting

### Inngest events are not running

Make sure both servers are running:

```bash
npm run dev
npm run inngest:dev
```

Also confirm that `NEXT_PUBLIC_APP_URL` points to your local app URL.

### E2B preview shows a closed port error

Check that:

- `E2B_API_KEY` is set
- `E2B_TEMPLATE_NAME` matches a built E2B template
- The template was built after changes to `compile_page.sh`
- The sandbox template starts Next.js on `0.0.0.0:3000`

### Project creation fails when generating a name

Check that `OPENAI_API_KEY` is set and valid. Project names are generated with OpenAI before the project is saved.

### Prisma client errors

Regenerate the Prisma client:

```bash
npx prisma generate
```

Then rerun migrations if needed:

```bash
npx prisma migrate dev
```

## License

This project is private by default. Add a license file if you plan to publish or distribute it.
