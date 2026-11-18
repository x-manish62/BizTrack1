# BizTrack — Windows 11 Quick Start

## You do not need to create any project files manually.

1. Extract this ZIP to a folder you can find (e.g. Desktop\BizTrack).
2. Install **Node.js LTS** from https://nodejs.org if it is not already installed.
3. Create a Supabase project at https://supabase.com/dashboard.
4. In Supabase, open the project's API settings and copy the Project URL and publishable/anon key. **Never use or paste a service-role/secret key in the frontend.**
5. Double-click `START_BIZTRACK_WINDOWS.bat`. On first run, it will ask for the Supabase URL and key, create `frontend/.env.local` for you, and install dependencies. (It does not add any source-code files manually.)
6. If setup completes, run `START_BIZTRACK_WINDOWS.bat` again. Open the local URL printed in the terminal, usually http://localhost:5173.


## Database setup
Run the SQL migration in Supabase SQL Editor:
`supabase/migrations/0001_initial_schema.sql`

This starter is not yet a finished production system. Purchases/sales, full offline sync, reports, staff roles, and production security testing still require development. Do not use real business data until these are implemented and tested.
