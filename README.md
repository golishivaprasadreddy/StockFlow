# StockFlow

StockFlow is a small inventory app for keeping a product list and stock levels in one place. It’s built for a straightforward owner-run workflow: sign in, add products, and see what needs restocking.

## What’s here

- Email and password sign-up and sign-in through Supabase Auth
- A workspace for each owner, with database policies that keep product data scoped to that workspace
- Product details, SKU, quantity, prices, and optional per-product stock thresholds
- A dashboard with product totals and low-stock items
- Product search, stock adjustments, and CSV import/export
- A workspace-wide default low-stock threshold

## Run it locally

You’ll need Node.js, npm, and a Supabase project.

1. Install the packages:

   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and add your Supabase project URL and publishable key. Set `NEXT_PUBLIC_SITE_URL` to `http://localhost:3000` for local work. Keep service-role keys out of this app.
3. Apply [`supabase/migrations/schema.sql`](./supabase/migrations/schema.sql) to the Supabase project. This creates the organization and product tables, the signup trigger, and the row-level security policies.
4. Start the app:



1. ```bash
   npm run dev
   ```

   Then open [http://localhost:3000](http://localhost:3000).

## Product CSV

From **Products**, choose a CSV file to import or download the current workspace’s catalog. The header row is:

```text
name,sku,quantity_on_hand,description,cost_price,selling_price,low_stock_threshold
```

Name, SKU, and quantity are required. Leave optional cells empty when they don’t apply. Imports accept up to 5,000 rows and 2 MB per file; invalid rows or duplicate SKUs reject the import rather than partially adding the file.

## Useful commands

```bash
npm run dev
npm run lint
npm test
npm run build
npm start
```

## Project layout

```text
src/
  app/          Routes and pages
  components/   Shared layout and product UI
  lib/          Supabase clients, actions, and CSV helpers
  proxy.js      Session refresh and route protection
supabase/
  migrations/   Database schema and policies
tests/          CSV import/export tests
```

The app uses JavaScript and JSX. Authentication sessions are managed by Supabase Auth and `@supabase/ssr` in server cookies.
