# Family Ledger API

The Express API verifies the signed-in Supabase user and requires an approved
`public.access_requests` row before writing ledger entries, ingredient stock,
or purchase records using that user's JWT. The administrator
`ramosraf278@gmail.com` is allowed without an approval row. Supabase row-level
security remains enabled; do not add a service-role key to this application.

## Configure

Copy the project's Supabase URL and publishable key from `frontend/.env.local`
into `backend/.env` as `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. The
publishable key is used with the user's access token and does not bypass RLS.
Keep `backend/.env` private; it is ignored by Git.

The frontend defaults to `http://localhost:3001`. To use a different API origin,
set `VITE_API_BASE_URL` in the frontend environment.

## Run

From this directory:

```sh
npm install
npm run dev
```

Check `GET /api/health` for server and Supabase configuration status. The sync
route is `POST /api/ledger/sync`; it requires a valid Supabase session and
approved workspace access.
