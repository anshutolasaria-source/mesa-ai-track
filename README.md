# mesa-ai-track: Group Trip Planner

Everyone planning the trip fills in their preferences through one link. Once at least two people
have answered, the app shows the group's top 3 destinations from a fixed list of 10 Indian
places, with how well each option fits each person and why.

- **`/`**: preferences form (name, budget, free dates, trip types, places you won't go). Anyone
  can type their own name. The form always starts blank; submitting again under the same name
  replaces that person's answer.
- **`/results`**: who has answered so far, the dates when everyone is free, and the top 3 options
  with a per-person fit score and reasons. You can also expand the full ranking of all 10 places,
  or press **Start over** to clear every answer and begin again.

There are no live prices and no booking. Costs are rough estimates in [`lib/data.ts`](lib/data.ts).
The ranking rules are explained at the top of [`lib/scoring.ts`](lib/scoring.ts).

## Setup

1. Create a Supabase project. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql).
2. From **Project Settings → API**, copy the Project URL and the `anon` public key.
3. Set them as environment variables (locally in `.env.local`, see `.env.local.example`; on
   Vercel under **Settings → Environment Variables**):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Run locally with `npm install` then `npm run dev`, or deploy the repo on Vercel.
   If you add or change the variables on Vercel after deploying, redeploy so the app picks them up.

There are no logins, so anyone with the link can view, edit and clear answers. That's fine for a
group of friends, but don't use it for anything private.

If your table was created before names were opened up, re-run `schema.sql` (or just its
`drop constraint` line) to remove the old five-name restriction.
