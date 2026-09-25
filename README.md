# Keeper

> A full-stack note-taking workspace designed for fast idea capture, persistent personal notes, and a calm, distraction-free writing experience.

<p align="center">
  <a href="https://keeper-neon-seven.vercel.app/">Live Demo</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/udaysinghparihar007/Keeper">Source Code</a>
</p>

<p align="center">
  <img src="./public/screenshots/main.png" alt="Keeper main workspace" width="100%">
</p>

Keeper is a modern note management application built around a simple product principle:

**capture the thought first, organize it later.**

The application combines a frictionless guest workspace with authenticated, database-backed accounts. Users can start writing without signing up, migrate guest notes into their account when they are ready, search their notes, and optionally upgrade to Pro for additional capabilities.

---

## ✨ Why Keeper?

Many productivity applications add complexity before the user can do the simplest thing: write something down.

Keeper takes a different approach:

- Open the application and start writing immediately.
- Use a guest workspace without creating an account.
- Keep guest notes locally on the device.
- Sign in with Google or GitHub when persistent account storage is needed.
- Explicitly import existing guest notes without overwriting account data.
- Search saved notes from the workspace.
- Upgrade to Pro only when advanced capabilities are needed.

The interface is intentionally minimal and focused on writing rather than presenting a large productivity dashboard.

---

## 🚀 Features

### 📝 Note Management

- Create and manage notes
- Title and content support
- Expandable note composer
- Search notes
- Delete notes
- Responsive workspace
- Minimal, distraction-free writing experience

### 👤 Guest Workspace

Keeper supports a guest-first workflow so users can start writing immediately.

- Guest notes are stored in browser `localStorage`
- Storage uses a versioned application key
- Guest data is retained for 30 days from its last update
- Guest workspaces support up to 100 notes
- Note title and content limits are enforced
- No account is required for initial note capture

### 🔐 Authentication

Account authentication is handled through NextAuth.js.

Supported providers:

- Google OAuth
- GitHub OAuth

Once authenticated, the user's account becomes the source of truth for persistent notes.

### 🔄 Guest → Account Migration

Keeper provides an explicit migration path when a user signs in with existing guest notes.

The migration flow:

1. Detects available guest notes.
2. Presents an explicit import action.
3. Creates new server-side records for the imported notes.
4. Generates new server IDs instead of reusing temporary local identifiers.
5. Never overwrites existing account notes.
6. Removes temporary local data only after import and account refresh succeed.

This keeps guest and account data separate while providing a predictable transition between the two.

### 🔎 Note Search

Users can quickly search through their saved notes instead of manually scanning the entire workspace.

### 💳 Pro Subscriptions

Keeper integrates Stripe for optional Pro subscriptions.

The current Pro entitlement provides:

- CSV note export
- Increased account note limits

Permanent note storage remains available on the Free plan.

Subscription access is based on verified Stripe webhook events rather than trusting a client-side checkout redirect.

---

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js |
| UI | React |
| Language | TypeScript |
| Styling | Tailwind CSS + custom CSS |
| Component Library | Material UI |
| Authentication | NextAuth.js |
| ORM | Prisma |
| Database | PostgreSQL |
| Payments | Stripe |
| Guest Persistence | Browser `localStorage` |
| Deployment | Vercel |

---

## 🏗️ Architecture

Keeper uses a hybrid persistence architecture.

```text
                              ┌─────────────────────┐
                              │       Browser       │
                              │                     │
                              │  Guest Workspace    │
                              │    localStorage     │
                              └──────────┬──────────┘
                                         │
                                  Sign in / Import
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │     Next.js App     │
                              │                     │
                              │   App Router        │
                              │   React UI          │
                              │   API Routes        │
                              └───────┬───────┬─────┘
                                      │       │
                             Authentication   Notes
                                      │       │
                                      ▼       ▼
                               ┌──────────┐ ┌─────────────┐
                               │ NextAuth │ │   Prisma    │
                               │          │ │             │
                               │ Google   │ │ PostgreSQL  │
                               │ GitHub   │ │             │
                               └──────────┘ └─────────────┘

                              ┌─────────────────────┐
                              │       Stripe        │
                              │                     │
                              │ Checkout + Portal   │
                              │ Verified Webhooks   │
                              └─────────────────────┘
```

### Data ownership

```text
Guest
  │
  ├── Browser localStorage
  ├── Versioned local key
  └── Temporary device data

Authenticated Account
  │
  ├── PostgreSQL
  ├── Prisma
  └── User-scoped persistent notes

Billing
  │
  ├── Stripe Checkout
  ├── Stripe Customer Portal
  └── Verified webhook events
```

This separation allows Keeper to provide a low-friction guest experience without mixing temporary local data with persistent account data.

---

## 🔐 Authentication Flow

```text
                         ┌──────────────────┐
                         │       User       │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
             Continue as Guest              Sign In
                    │                           │
                    ▼                           ▼
              localStorage                 NextAuth.js
                                                │
                                      ┌─────────┴─────────┐
                                      ▼                   ▼
                                   Google              GitHub
                                      │                   │
                                      └─────────┬─────────┘
                                                ▼
                                         Authenticated
                                                │
                                                ▼
                                      Prisma + PostgreSQL
```

### Production OAuth callbacks

```text
https://keeper-neon-seven.vercel.app/api/auth/callback/google
https://keeper-neon-seven.vercel.app/api/auth/callback/github
```

### Local development

```text
http://localhost:3000
```

---

## 🔄 Guest Note Import Flow

The guest-to-account transition is designed to avoid accidental data loss.

```text
Guest Notes
    │
    ▼
User signs in
    │
    ▼
Keeper detects local notes
    │
    ▼
User explicitly chooses Import
    │
    ▼
Create new server-side note records
    │
    ▼
Refresh account notes
    │
    ▼
Import succeeds
    │
    ▼
Remove temporary local guest data
```

Important behavior:

- Existing account notes are preserved.
- Guest notes receive new server IDs.
- Import is explicit rather than automatic.
- Local guest data is deleted only after successful import and account refresh.

---

## 💳 Billing Architecture

Keeper uses Stripe Checkout and the Stripe Customer Portal for optional Pro subscriptions.

The application treats verified webhook events as the billing source of truth.

```text
User
 │
 ▼
Stripe Checkout
 │
 ▼
Stripe Webhook
 │
 ├── checkout.session.completed
 ├── customer.subscription.created
 ├── customer.subscription.updated
 ├── customer.subscription.deleted
 └── invoice.payment_failed
 │
 ▼
Verified Subscription State
 │
 ▼
Keeper Pro Entitlement
```

### Stripe environment variables

```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Webhook endpoint

```text
/api/stripe/webhook
```

Subscription state should only be updated from verified Stripe webhook events. Checkout redirects alone do not grant Pro access.

---

## 🗄️ Database

Keeper uses PostgreSQL through Prisma.

The authentication layer follows the NextAuth relational model:

```text
User
 ├── Account
 └── Session

VerificationToken
```

Authenticated note data is associated with the authenticated user so account data remains isolated between users.

### Prisma migration

For an existing production database:

```bash
npx prisma migrate deploy
```

For local development, use the Prisma migration workflow configured for the project.

---

## 📁 Project Structure

```text
keeper/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── sign-up/
│   │   └── forgot-password/
│   │
│   ├── api/
│   │   ├── auth/
│   │   └── stripe/
│   │
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── AuthButtons.tsx
│   │   ├── CreateArea.tsx
│   │   ├── Note.tsx
│   │   └── Footer.tsx
│   │
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── lib/
│   └── prisma.ts
│
├── prisma/
│   └── schema.prisma
│
├── public/
│   └── screenshots/
│       ├── main.png
│       ├── login_page.png
│       └── plans.png
│
├── .env.example
├── next.config.ts
├── package.json
├── prisma.config.ts
└── tsconfig.json
```

---

## 🖥️ Product Preview

### Main Workspace

<p align="center">
  <img src="./public/screenshots/main.png" alt="Keeper main workspace" width="100%">
</p>

### Authentication

<p align="center">
  <img src="./public/screenshots/login_page.png" alt="Keeper authentication" width="80%">
</p>

### Pro Plans

<p align="center">
  <img src="./public/screenshots/plans.png" alt="Keeper Pro plans" width="80%">
</p>

> **Screenshot setup:** rename your main Keeper workspace screenshot to `main.png` and place it inside `public/screenshots/`.

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have:

- Node.js installed
- npm installed
- PostgreSQL available
- Google OAuth credentials
- GitHub OAuth credentials
- Stripe credentials if billing is enabled

### 1. Clone the repository

```bash
git clone https://github.com/udaysinghparihar007/Keeper.git
cd Keeper
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file using `.env.example` as the template.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret"

GOOGLE_ID="your-google-client-id"
GOOGLE_SECRET="your-google-client-secret"

GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

Generate a secure NextAuth secret:

```bash
openssl rand -base64 32
```

**Never commit `.env` or any real credentials to Git.**

### 4. Start PostgreSQL

Make sure PostgreSQL is running and the database referenced by `DATABASE_URL` exists.

### 5. Apply database migrations

```bash
npx prisma migrate deploy
```

### 6. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🌐 Production

Live application:

**https://keeper-neon-seven.vercel.app/**

Production environment:

```env
NEXTAUTH_URL="https://keeper-neon-seven.vercel.app"
```

Production OAuth callback URLs:

```text
https://keeper-neon-seven.vercel.app/api/auth/callback/google
https://keeper-neon-seven.vercel.app/api/auth/callback/github
```

Configure Stripe's production webhook endpoint at:

```text
https://keeper-neon-seven.vercel.app/api/stripe/webhook
```

Subscribe the webhook to:

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.payment_failed
```

---

## 🔒 Security

Keeper separates temporary guest data, authenticated data, and billing state.

Key security considerations include:

- OAuth authentication through NextAuth.js
- User-scoped persistent data
- Prisma for database access
- Environment variables for sensitive credentials
- Verified Stripe webhook events
- Explicit guest-to-account import
- No secrets embedded in application source code

For future account-specific features, authorization should always be enforced on the server rather than relying only on client-side visibility.

---

## 🧠 Engineering Decisions

### Why a guest-first workspace?

Note-taking is a low-friction activity. Requiring an account before a user can write adds unnecessary friction.

Keeper therefore allows users to begin writing immediately and introduces authentication when persistent account functionality becomes useful.

### Why localStorage for guests?

Guest notes are temporary device-level data. `localStorage` provides persistence across page refreshes without requiring an account or database record.

### Why PostgreSQL + Prisma?

PostgreSQL provides reliable relational persistence while Prisma provides a typed database access layer and keeps the data model explicit.

### Why OAuth?

Google and GitHub OAuth provide a familiar authentication experience while reducing the need for Keeper to directly manage user passwords.

### Why explicit note import?

Guest data and account data have different lifecycles.

An explicit import action makes the transition understandable to the user and prevents existing account notes from being silently replaced.

### Why verified Stripe webhooks?

A checkout redirect is not sufficient evidence of an active subscription.

Keeper uses verified Stripe webhook events to keep subscription state synchronized with Stripe.

---

## 📊 Product Data Model

At a high level, Keeper separates identity, authentication, notes, and billing concerns.

```text
┌──────────────┐
│     User     │
└──────┬───────┘
       │
       ├───────────────┐
       │               │
       ▼               ▼
┌──────────────┐ ┌──────────────┐
│    Notes     │ │   Accounts   │
│              │ │   Sessions   │
└──────────────┘ └──────────────┘

       │
       ▼
┌──────────────────┐
│ Pro Subscription │
│   / Entitlement  │
└──────────────────┘
```

The important boundary is that authenticated notes belong to the authenticated user rather than being shared globally.

---

## 🎯 What This Project Demonstrates

Keeper was built to demonstrate practical full-stack development concepts rather than simply a static UI.

### Frontend

- React component architecture
- Next.js App Router
- Responsive UI design
- Client-side state management
- Interactive note composition
- Search and workspace interactions

### Backend

- Next.js server-side application architecture
- API route design
- Prisma ORM
- PostgreSQL persistence
- User-scoped data
- Authentication flows

### Authentication

- OAuth provider integration
- NextAuth.js
- Session management
- Google authentication
- GitHub authentication
- Guest-to-account migration

### Payments

- Stripe Checkout
- Stripe Customer Portal
- Subscription lifecycle handling
- Webhook-based entitlement updates

### Product Engineering

- Guest-first UX
- Data ownership boundaries
- Persistent account storage
- Explicit data migration
- Environment-based configuration
- Production deployment considerations

---

## 📌 Product Constraints

Keeper intentionally focuses on note capture and lightweight personal knowledge management rather than trying to become a complete project-management suite.

The product prioritizes:

- Fast capture
- Minimal UI
- Searchability
- Persistent account storage
- Clear guest/account boundaries
- Simple subscription management

---

## 🔮 Future Improvements

Potential next steps include:

- Rich-text / Markdown editing
- Note editing history
- Folders and tags
- Note pinning and archiving
- Drag-and-drop organization
- Full-text database search
- Optimistic UI updates
- Offline-first synchronization
- File and image attachments
- More granular subscription controls
- Automated unit and integration testing
- End-to-end testing
- Improved server-side authorization
- Rate limiting and abuse protection
- Error monitoring and observability

---

## 📸 Screenshots

The repository includes product screenshots under:

```text
public/screenshots/
```

Recommended README screenshots:

| Screenshot | Purpose |
| --- | --- |
| `main.png` | Main note workspace |
| `login_page.png` | Authentication experience |
| `plans.png` | Pro subscription experience |

---

## 📄 Environment Variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection |
| `NEXTAUTH_URL` | Application URL used by NextAuth |
| `NEXTAUTH_SECRET` | Session/authentication secret |
| `GOOGLE_ID` | Google OAuth client ID |
| `GOOGLE_SECRET` | Google OAuth client secret |
| `GITHUB_ID` | GitHub OAuth client ID |
| `GITHUB_SECRET` | GitHub OAuth client secret |
| `STRIPE_SECRET_KEY` | Server-side Stripe API access |
| `STRIPE_PRO_PRICE_ID` | Stripe Pro subscription price |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification |

---

## 🧪 Development

Useful commands:

```bash
# Start development server
npm run dev

# Create a production build
npm run build

# Start production server
npm run start

# Generate Prisma client
npx prisma generate

# Apply existing migrations
npx prisma migrate deploy
```

---

## 🤝 Contributing

Contributions and improvements are welcome.

A typical workflow:

```bash
git checkout -b feature/your-feature
```

Make your changes, verify the application locally, and open a pull request describing:

- What changed
- Why it changed
- How it was tested
- Any database or environment changes required

---

## 👨‍💻 Author

**Uday Singh Parihar**

B.Tech Computer Science & Engineering (AI & ML)

- GitHub: https://github.com/udaysinghparihar007
- Live Project: https://keeper-neon-seven.vercel.app/

---

## 📜 License

This project is available for educational and portfolio purposes.
