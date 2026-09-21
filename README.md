# Keeper Application Setup

## Guest and Account Notes

Keeper opens directly into a guest workspace. Guest notes are stored in
`localStorage` under a versioned key and retained for 30 days from their last
update. The guest workspace has a configurable limit of 100 notes, and note
title/content limits are enforced in both the client and server API.

After OAuth sign-in, the account is the source of truth. Account notes are
stored in PostgreSQL through Prisma and are isolated by the authenticated user
ID. If guest notes exist, Keeper offers an explicit import action. Import
creates new server IDs for every guest note and never overwrites existing
account notes. Temporary local data is removed only after the import and
account refresh both succeed.

Run the database migration before using account note persistence:

```bash
npx prisma migrate deploy
```

The current migration creates the NextAuth tables and the `Note` table. Set
`DATABASE_URL`, `NEXTAUTH_SECRET`, and the configured OAuth credentials in the
environment used by the application.

Use `.env.example` as the configuration template. Never commit real OAuth,
database, or Stripe secrets.

## Billing and subscriptions

Keeper uses Stripe Checkout and the Stripe Customer Portal for optional Pro
subscriptions. Permanent note storage remains available on the Free plan.
The current Pro entitlement unlocks CSV note export and raises the account note
limit.

Configure these server-only variables:

```text
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Point Stripe's webhook endpoint at `/api/stripe/webhook` and subscribe to
`checkout.session.completed`, `customer.subscription.created`,
`customer.subscription.updated`, `customer.subscription.deleted`, and
`invoice.payment_failed`. Subscription status is updated only from verified
Stripe webhooks; checkout redirects alone never grant Pro access.

## Hydration warning

The attributes `data-new-gr-c-s-check-loaded` and `data-gr-ext-installed` are
added by Grammarly/the browser grammar extension before React hydration. They
are not rendered by Keeper. The application does not suppress hydration
warnings or add those attributes; verify hydration in a private window or with
extensions disabled when diagnosing this warning.

This document outlines the changes made to integrate authentication using NextAuth.js with Google and GitHub providers, and to set up Prisma for database interaction (with a PostgreSQL backend in mind).

## Overview

Authentication has been added to the Keeper application. Users can now sign in using their Google or GitHub accounts. The backend integration uses Prisma as an ORM, designed to work with PostgreSQL. Client-side route protection has also been implemented for the main application page.

## Prerequisites

Before running the application with authentication, you will need:

1.  **PostgreSQL Database**: An active PostgreSQL database instance. Ensure it is running and accessible.
2.  **OAuth Credentials**:
    *   **Google OAuth Credentials**: `GOOGLE_ID` and `GOOGLE_SECRET` from the Google Cloud Console.
    *   **GitHub OAuth Credentials**: `GITHUB_ID` and `GITHUB_SECRET` from GitHub Developer settings (OAuth Apps).
3.  **NEXTAUTH_SECRET**: A strong secret string for NextAuth.js. You can generate one using `openssl rand -base64 32`.

## Setup Steps Performed

The following changes and installations have been made to the project:

### 1. Prisma Setup

*   **Installation**: `prisma` and `@prisma/client` packages were installed.
*   **Initialization**: `npx prisma init` was run, creating the `prisma/` directory, `schema.prisma`, and `prisma.config.ts`.
*   **Schema Definition**: `prisma/schema.prisma` was updated with the NextAuth.js compatible schema for `User`, `Account`, `Session`, and `VerificationToken` models, configured for a `postgresql` provider.
*   **Configuration**: The `datasource url` was removed from `schema.prisma` as it is now handled by `prisma.config.ts`.
*   **Prisma Client**: A `lib/prisma.ts` file was created to export a singleton instance of `PrismaClient` for consistent database connections across the application.

### 2. NextAuth.js Setup

*   **Installation**: `next-auth` and `@next-auth/prisma-adapter` packages were installed.
*   **API Route**: `app/api/auth/[...nextauth]/route.ts` was created to handle authentication. This route configures NextAuth.js with:
    *   `PrismaAdapter` (using the `lib/prisma` client).
    *   `GitHubProvider` (requiring `GITHUB_ID` and `GITHUB_SECRET`).
    *   `GoogleProvider` (requiring `GOOGLE_ID` and `GOOGLE_SECRET`).
    *   A `NEXTAUTH_SECRET` for signing tokens.
    *   Session strategy set to `"jwt"`.

### 3. Frontend Integration

*   **SessionProvider**: `app/layout.tsx` was updated to wrap the application's children with `SessionProvider` from `next-auth/react`, making session data available throughout the application.
*   **Auth Buttons Component**: A new client component `app/components/AuthButtons.tsx` was created. This component:
    *   Uses `useSession` to display user information or sign-in buttons.
    *   Provides "Sign in with Google" and "Sign in with GitHub" buttons, along with a "Sign out" button.
*   **Header Integration**: `app/components/Header.tsx` was modified to include the `AuthButtons` component, allowing users to easily sign in and out from the header. Basic flexbox styling was added to the header.
*   **Route Protection**: `app/page.tsx` (the Home page) was updated to implement client-side protection. It now:
    *   Displays a loading message while authentication status is being determined.
    *   Prompts unauthenticated users to sign in.
    *   Only displays the main application content (notes, create area) to authenticated users.

## Important Next Steps (User Actions Required)

To fully enable authentication and persistence:

1.  **Start your PostgreSQL Database**: Ensure your PostgreSQL server is running and accessible.
2.  **Run Prisma Migrations**: Execute `npx prisma migrate dev --name init` to create the necessary tables in your PostgreSQL database based on the `prisma/schema.prisma` definition.
3.  **Configure Environment Variables**:
    *   Replace the placeholder values in your `.env` file with your actual `GITHUB_ID`, `GITHUB_SECRET`, `GOOGLE_ID`, `GOOGLE_SECRET`, and `NEXTAUTH_SECRET`.
    *   Example `.env` entries:
        ```
        DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
        GITHUB_ID="your_github_client_id"
        GITHUB_SECRET="your_github_client_secret"
        GOOGLE_ID="your_google_client_id"
        GOOGLE_SECRET="your_google_client_secret"
        NEXTAUTH_SECRET="a_very_long_and_random_string_generated_by_openssl_rand_-base64_32"
        ```
    *   Remember to restart your development server after updating `.env` variables.

Once these steps are completed, your application should be able to handle user authentication via Google and GitHub, with session persistence managed by your PostgreSQL database through Prisma.# Keeper
