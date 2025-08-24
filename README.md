# Barclays Banking Demo (Next.js + Prisma + NextAuth)

A production-ready **demo** banking app that clones the look-and-feel and key flows
of Barclays UK consumer banking. It uses the App Router (Next.js 14), Tailwind CSS,
Prisma + SQLite (easy local dev), and NextAuth (Credentials).

> **Legal note**: This is an educational demo, not affiliated with Barclays.
  Branding and copy are adapted; replace logos and images. Do **not** deploy as a
  real banking service. Use your own brand identity.

## Features
- Public marketing pages (Home, Current Accounts) styled with Barclays-like palette
  (`#00AEEF` primary, `#00395D` navy).
- Auth: Sign up, Log in (Credentials + hashed passwords with bcrypt).
- Protected Dashboard with account cards, balances, and recent transactions.
- Payments: Internal transfer between your demo accounts.
- Admin panel (role-based) to list users, toggle status, and credit demo funds.
- API routes for accounts, transactions, transfers.
- Middleware to protect `/app` and `/admin` routes.
- Seed script to generate demo users, accounts, and transactions.

## Quick Start
```bash
# 1) Install deps
npm i

# 2) Create DB & generate Prisma client
npx prisma migrate dev --name init

# 3) Seed demo data (creates 2 users and accounts)
npm run seed

# 4) Run dev server
npm run dev
# http://localhost:3000
```

## Environment
Copy `.env.example` to `.env` and fill values.

```dotenv
# Required
DATABASE_URL="file:./dev.db"   # default SQLite; switch to Postgres in production
NEXTAUTH_SECRET="(generate a strong secret)"
NEXTAUTH_URL="http://localhost:3000"

# Optional: demo email from address (if you wire a real sender later)
EMAIL_FROM="demo@example.com"
```

## Images & Placeholders
Put hero and promo images in `public/images/`:
- `public/images/hero.jpg` — Homepage hero (recommended 1600×800)
- `public/images/app-promo.jpg` — Accounts page banner (1400×700)
- `public/images/card-1.jpg`, `card-2.jpg` — small tiles

If you don't have images yet, the UI renders with neutral blocks and alt text.
When you have the assets, just drop them in the folder keeping the same names.

## Production
- Switch to Postgres: set `DATABASE_URL` to your connection string and update
  `prisma/schema.prisma` provider to `"postgresql"`.
- Set `NEXTAUTH_URL` to your production URL and generate a strong `NEXTAUTH_SECRET`.
- Consider enabling HTTPS and a reverse proxy (Vercel handles this for you).
- Run `npm run build` and `npm start` (or deploy to Vercel).

## Credits
- Next.js, Tailwind CSS, Prisma, NextAuth.
- Design cues inspired by Barclays UK public site.


## New in this build
- **Payees**: Add/remove saved payees (sort code + account number + reference).
- **External payments**: Two-step flow (initiate + OTP confirm). OTP is displayed for demo.
- **Internal transfers**: Now produce a **receipt** page you can bookmark or print.
- **Audit log**: Admin view at `/admin/audit` to see key actions.
- **Validation**: Zod schemas on server for robust input checks.


## Advanced Features (in this archive)
- **Security:** Change password with server-side bcrypt verify.
- **Notifications:** Prefs stored in DB; GET/POST API.
- **Devices:** Activity table fed by AuditLog.
- **Statements:** CSV export via `/api/accounts/[id]/statement.csv`.
- **Standing orders:** Full CRUD + UI with schedules (demo strings).
- **Cards:** Lock/Unlock/Reissue simulation with audit trail.
- **Notifications center:** Recent actions (audit log) as in-app feed.
- **Admin users:** Search, reset password (sim) page.
- **Error boundary & loading skeletons.**

### Routes map
- App: `/app`, `/app/accounts/[id]`, `/app/payments/new`, `/app/payees`, `/app/standing-orders`, `/app/cards`, `/app/notifications`, `/app/settings/*`
- Admin: `/admin`, `/admin/users`, `/admin/audit`
- Public: `/`, `/accounts`, `/cards`, `/loans`, `/mortgages`, `/faq`
