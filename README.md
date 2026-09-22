# ACKSES

Auto-parts marketplace for Iraq. Expo (React Native) app, Supabase backend.

Buyers find parts that fit their car; sellers run a shop from the same app.
Bilingual English / Arabic with RTL, dark UI, IQD pricing, cash on delivery.

Built from the Claude Design handoff in [`project/`](project) — see
[Design source](#design-source).

## Running it

```bash
npm install
npx expo start
```

The app runs immediately against bundled demo data. To point it at a real
database, apply the migrations in [`supabase/`](supabase/README.md) and set the
two variables in `.env.example`.

```bash
npm run typecheck    # tsc --noEmit
npx expo export --platform ios   # verify the bundle builds
```

## What's built

**Auth** — sign in, buyer sign-up, seller sign-up (account then shop setup),
forgot password. Supabase Auth, email + password.

**Buyer** — onboarding (pick your car), listings with search and fitment
badges, advanced filters, product detail, shop profile, seller profile, buyer
profile (garage, saved searches, orders), cart with COD checkout.

**Seller** — dashboard, shop management with product list, add product
(3-step), orders with status timeline, account with balance and verification.

One app, one build. Buyers switch to selling from their profile; sellers switch
back from their account. The choice persists.

### Search

Everything below works against the database, through the `search_products` RPC:

- text and OEM-number search (matches with or without the dash)
- filter by my car — fitment ranges, not string matching
- category tree with subcategories
- brand, condition, city, price range
- compatibility badge on every listing
- saved searches with alert toggles

### Preview only

**VIN / chassis lookup** and **search by image** are built as UI with no
backend behind them, as requested. Both screens render in full and carry a
Preview ribbon; every control opens a Coming Soon dialog that offers the
working alternative (pick your car by make/model/year, or search by name/OEM).

VIN decoding needs a vehicle database and image search needs a trained model —
neither is wired up. Nothing else in the app is stubbed.

## Layout

```
app/                      expo-router routes
  (auth)/                 sign-in, sign-up, seller sign-up, forgot password
  (buyer)/                buyer tabs: listings, search, cart, profile
  (seller)/               seller tabs: dashboard, shop, orders, account
  product/[id].tsx        product detail
  shop/[id].tsx           shop profile
  seller/[id].tsx         seller profile
  vin.tsx                 preview only
  image-search.tsx        preview only
  filters.tsx             advanced filters, as a sheet
  add-product.tsx         3-step seller sheet
  order-status.tsx        status timeline
  delete-product.tsx      confirm dialog

src/
  theme.ts                design tokens lifted from the prototype
  i18n/                   EN/AR strings and the direction-aware helpers
  components/             primitives, icons, product cards, filter panel
  data/                   domain types, repository, demo fixtures
  hooks/queries.ts        react-query wrappers over the repository
  hooks/useAuthGate.ts    gate an action behind sign-in, with a return route
  state/session.tsx       Supabase Auth: sign in/up, shop creation, sign out
  state/store.tsx         cart, active vehicle, filters, role
  lib/                    Supabase client, formatting

supabase/                 migrations, seed, and notes — nothing provisioned
project/                  the original Claude Design prototype
chats/                    the design conversation that produced it
```

## Data

`src/data/repository.ts` is the only place that talks to a data source. When
`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set it
queries Supabase; otherwise it serves `src/data/fixtures.ts`, which mirrors
`supabase/seed.sql` row for row. That means the app is fully explorable before
a project exists, and switching over is an env-var change rather than a
refactor. A small notice on the listings and dashboard screens says which mode
is active.

The two paths share filter semantics deliberately — `matchesLocally()` in the
repository reproduces what `search_products` does in SQL. If you change one,
change the other.

## Accounts

Supabase Auth with **email and password**. The designs contained no sign-in
screen, so these four are designed from the same tokens as the rest:

| Route | What it does |
| --- | --- |
| `(auth)/sign-in` | Email + password, reveal toggle, forgot-password link. Takes `next` and `reason` params so a gated action resumes afterwards. |
| `(auth)/sign-up` | Buyer: name, email, password, confirm. Lands on onboarding. |
| `(auth)/sell` | Seller: the same account step, then shop setup (name EN/AR, city, address), which creates the `sellers` and `shops` rows. Someone already signed in skips straight to shop setup. |
| `(auth)/forgot-password` | Sends a reset link. The confirmation is identical whether or not the address has an account, so it cannot be used to enumerate emails. |

**Browsing is open; acting is not.** Listings, products, shops and seller
profiles need no account — which is what the RLS policies already allow.
`useAuthGate()` wraps the four actions that do need one (checkout, saving a
search, toggling alerts, opening a shop) and sends the user to sign-in with a
route to return to and a line explaining why.

The seller tabs are guarded: an account without a shop is redirected into shop
setup rather than shown empty screens.

**Why email and password.** It is the one method Supabase serves with no
external provider, so it works the moment you point the app at a project.
Phone OTP is the better long-term fit for Iraq but needs an SMS provider
(Twilio, MessageBird or Vonage) configured and paid for. `src/state/session.tsx`
is the only file that talks to `supabase.auth`, so adding phone is a screen
plus a method there, not a rewrite.

**Trust signals are platform-owned.** Letting sellers create their own shop
means an account can write to `sellers` and `shops` — so `0005_trust_columns.sql`
stops it writing `verified`, ratings, order counts and follower numbers, pins
review authorship to the signed-in account, and rejects an order whose total is
below its line items. Without that, any new seller could mint a verified badge
and a 5.0 rating for themselves.

**Email confirmation.** On by default in Supabase, in which case sign-up
returns no session and both sign-up screens stop on a "confirm your email"
step. Turning confirmation off in the dashboard signs people straight in — the
screens read the actual result rather than assuming either way.

## Known gaps

- **Part photos are placeholders.** The design used striped tiles; so does the
  app. `PhotoPlaceholder` is the single component to replace once real imagery
  and Supabase Storage uploads land.
- **The seller Dashboard tab is composed, not drawn.** The design gives sellers
  four tabs but only draws the Account screen behind them. The dashboard reuses
  patterns that already exist in the design (shop header, stat tiles, order
  rows); it introduces no new ones.
- **Cart lives on the device.** Quantities persist in AsyncStorage and become
  orders at checkout. There is no server-side cart.
- **No password-reset landing screen.** `forgot-password` sends the email; the
  link deep-links to `ackses://reset-password`, which nothing handles yet. Add
  that route, and the matching redirect URL in the Supabase dashboard, before
  shipping.
- **Sign-in is simulated on fixtures.** With no Supabase project configured the
  auth screens accept any well-formed credentials and store a local session, so
  the flows stay walkable. Every auth screen says so on the screen itself.

## Design source

This repository started as a handoff bundle exported from Claude Design.
[`project/ACKSES Marketplace.dc.html`](project) is the interactive prototype —
15 phone screens on one canvas — and [`chats/chat1.md`](chats/chat1.md) is the
conversation that produced it. Both are kept as reference, not built or
shipped; `src/theme.ts` and `src/i18n/strings.ts` are ported directly from
them, so they remain the authority on colour, spacing and copy.
