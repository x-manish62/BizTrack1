# BizTrack — Multi-Shop Purchase & Sales Management

A VS Code-ready starter for a multi-shop business management system.

## Important status
This is a **working development scaffold**, not a certified production deployment. It includes:
- React + Vite + TypeScript frontend
- Supabase Auth integration (email/password; phone login can be enabled after configuring Supabase phone auth)
- Shop-scoped data model and PostgreSQL RLS policies
- Custom item CRUD (add, edit, archive, restore, delete where safe)
- Purchase and sales entry screens
- Dashboard and item ledger views
- Dexie offline local-store foundation
- PWA configuration
- Vitest + React Testing Library setup
- Supabase SQL migration and deployment notes

Username/password authentication is **not enabled by default** because Supabase Auth does not natively authenticate arbitrary usernames. Do not implement username lookup by exposing users' email addresses. Add a server-side, rate-limited Edge Function/custom auth flow before enabling username login.

## Requirements
- Node.js LTS (20.19+ or 22.12+ recommended)
- Git
- VS Code
- Supabase account
- Cloudflare account (for deployment)

## 1. Open project
Extract ZIP. In VS Code: File → Open Folder → select `BizTrack`.

Open terminal in VS Code and run:

```bash
cd frontend
npm install
```

## 2. Configure Supabase
1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/migrations/0001_initial_schema.sql`.
4. In Supabase → Authentication → Providers, enable Email.
5. For development, configure the email confirmation setting deliberately. For real users, keep email verification enabled.
6. In Supabase Project Settings → API, copy Project URL and anon/public key.
7. Copy `frontend/.env.example` to `frontend/.env.local` and fill values.

Never put the `service_role` key in frontend code or `.env.local`. Never commit `.env.local`.

## 3. Run locally
```bash
cd frontend
npm run dev
```
Open the local URL printed by Vite (normally http://localhost:5173).

## 4. Create the first Master Admin
The SQL migration creates tables and RLS policies. It does not automatically make the first person a Master Admin.
After registering your account, use Supabase SQL Editor while signed in as project owner and run:

```sql
-- Replace with the auth.users UUID from Authentication → Users.
update public.profiles
set platform_role = 'master_admin', registration_status = 'approved'
where id = 'YOUR_AUTH_USER_UUID';
```

Do not share your database password or service-role key.

## 5. Shop onboarding
- New registrations create a profile and a pending shop request.
- A Master Admin must approve the shop and add the owner as an active shop member.
- The SQL migration includes an approval function that must be called only by Master Admin.
- A minimal admin approvals screen can be added after the first Master Admin is configured.

## 6. Item management (your latest requirement)
The Items page supports:
- Add any custom item (no fixed/preloaded product catalogue)
- Edit item name and default price
- Archive an item (recommended; preserves old transaction references)
- Restore an archived item
- Permanently delete only when it has no transaction history
- Search items
- View item records

**Important:** deleting an item with purchase/sales history is blocked by the database foreign-key design. Archive it instead so historical financial records remain accurate.

## 7. Production checklist — do not skip
Before real shops use it:
- Configure Supabase Auth email templates and SMTP. Supabase default email limits are not intended for unrestricted production email delivery.
- Add phone OTP provider only if needed; SMS usually has a cost and free unlimited SMS is not guaranteed.
- Implement and test username login through a secure server-side flow; do not expose user emails.
- Complete Master Admin approval UI and invite flow.
- Test RLS using at least two different shop accounts.
- Add a verified scheduled backup process and perform a restore test. GitHub repository/migrations are not a database backup.
- Configure production domain, HTTPS, security headers, rate limits and monitoring.
- Test offline sync conflict handling and duplicate prevention before enabling it for financial transactions.
- Review privacy, retention and applicable legal requirements.

## 8. Build and test
```bash
cd frontend
npm run typecheck
npm run test
npm run build
```

## 9. Cloudflare Pages
Connect GitHub repository to Cloudflare Pages:
- Root directory: `frontend`
- Build command: `npm run build`
- Build output directory: `dist`
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as build environment variables.

For React Router SPA fallback, Cloudflare Pages normally serves `index.html` for client routes; verify direct navigation after deployment.

## Folder map
- `frontend/src/features/*`: separate feature modules
- `frontend/src/lib`: Supabase and shared libraries
- `frontend/src/offline`: Dexie local database foundation
- `supabase/migrations`: version-controlled database schema
- `docs`: architecture and setup guidance

## Windows 11 one-click setup
See `README_WINDOWS_FIRST_RUN.md`. The included `START_BIZTRACK_WINDOWS.bat` and `SETUP_BIZTRACK_WINDOWS.ps1` automate environment-file creation and dependency installation so you do not need to create setup files manually. Supabase project credentials must still be supplied by you; never place a service-role/secret key in frontend configuration.
