# Supabase

Nothing is provisioned. These files describe the database; applying them to a
project is a deliberate step you take when you're ready.

## Files

| File | What it does |
| --- | --- |
| `migrations/0001_schema.sql` | Tables, indexes and the two read-model views (`products_with_fitments`, `orders_with_items`). |
| `migrations/0002_search.sql` | `search_products` — the advanced-search RPC behind Listings and the filter sheet — and `place_order`. |
| `migrations/0003_rls.sql` | Row level security: public catalogue, shop-scoped writes, buyer-private garage and saved searches. |
| `migrations/0004_auth.sql` | Creates a `profiles` row for every new account, and lets an account claim one `sellers` record so it can open a shop. |
| `migrations/0005_trust_columns.sql` | Stops an account writing the columns buyers trust — verification, ratings, counts, review authorship, order totals. |
| `migrations/0006_hardening.sql` | Advisor-driven: function grants, search_path, extension schema. |
| `migrations/0007_split_product_read_policy.sql` | Guests never evaluate `owns_shop()` in a policy. |
| `migrations/0008_beta_features.sql` | Profile prefs and addresses, seller contact and payout method, shop phone, bulk tiers and photo array, delivery fields on orders, payouts and reports tables, the `product-photos` bucket. Drops and recreates both views (a `select *` view cannot be replaced with reordered columns). |
| `migrations/0009_search_returns_new_columns.sql` | `search_products` returns the 0008 columns; a function's return type cannot be altered, so it is dropped and recreated. |
| `seed.sql` | The demo catalogue, mirroring `src/data/fixtures.ts` row for row. |
| `test_accounts.sql` | Beta accounts `buyer@ackses.com` / `seller@ackses.com`. Idempotent. |

## Applying them

With the Supabase CLI against a new project:

```bash
supabase link --project-ref <your-project-ref>
supabase db push          # runs migrations/ in order
psql "$DATABASE_URL" -f supabase/seed.sql
```

Or paste each file into the SQL editor in the dashboard, in filename order,
then `seed.sql` last.

Then copy `.env.example` to `.env.local`, fill in the project URL and the
publishable anon key, and restart Metro. `isSupabaseConfigured` in
`src/lib/supabase.ts` flips to true and every screen switches from fixtures to
live queries — no other code changes.

## Notes on the schema

**Localization.** Every user-visible string is stored as a `*_en` / `*_ar`
pair rather than in a translations table, because this product authors both
languages together and the client always reads both.

**Categories by position.** `products.category_position` is an index into the
app's category list (0 Brakes … 5 Suspension) rather than a foreign key. That
keeps the category names — which are part of the translated UI copy — in the
app's string tables, with the database owning only which product sits where.
If categories ever become user-editable, this is the first thing to promote to
its own table.

**Fitments are a table, not JSON.** `product_fitments` is what makes the "Fits"
badge and the "Fits my car" filter possible in a single query. `search_products`
joins against it; storing ranges as JSON on the product would force the filter
client-side.

**Soft deletes.** Deleting a product sets `deleted_at`. Orders reference
products, so the rows have to survive; every read path filters on
`deleted_at is null`.

**Auth.** Email and password, through Supabase Auth. `0004_auth.sql` adds the
`on_auth_user_created` trigger that copies `full_name` out of the sign-up
metadata into `public.profiles`, and the insert policy that lets an account
claim exactly one `sellers` row — the seller sign-up needs both.

Two dashboard settings matter:

- **Authentication → Providers → Email** — confirmation is on by default. The
  app handles either setting; with it on, sign-up stops on a confirm step.
- **Authentication → URL Configuration** — add `ackses://reset-password` as a
  redirect URL for the password-reset link to work on device. The app does not
  yet have a screen at that route.

Verified locally against Postgres 16: the trigger fires, an account can claim a
seller row and create its own shop, cannot claim a second one or claim one for
another user, cannot touch another shop's products, and sees none of another
buyer's garage, saved searches or orders.

**Platform-owned columns.** RLS decides *which rows* an account may write, not
*which columns*. Letting sellers create their own shop therefore opened a hole:
a brand-new seller could insert themselves with `verified = true`, a 5.0 rating
and any follower count they liked — forging the exact signals buyers use to
decide who to trust. `0005_trust_columns.sql` closes it with BEFORE triggers
that force those columns to their starting values on insert and back to their
previous values on update, unless the writer is `service_role` (or a migration
role). The same migration pins `reviews.author_id` and the displayed author
name to the signed-in profile, stops a shop being reassigned to another seller,
and rejects an order whose stored total is below the sum of its line items.

Triggers rather than column grants, because Supabase re-applies broad table
grants and would silently undo a `revoke ... (column)`.

These guards must **not** be `SECURITY DEFINER`: that reports `current_user` as
the function owner, which the privileged-writer check would then wave straight
through. That bug was live for one revision and is what the local tests caught.

**Keeping the two data paths in step.** `matchesLocally()` in
`src/data/repository.ts` reproduces the filter semantics of `search_products`
so the fixture path behaves identically. Change one, change the other.
