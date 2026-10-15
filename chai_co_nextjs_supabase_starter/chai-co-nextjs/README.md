# Chai & Co. — Next.js + Supabase starter

This is a **starter implementation**, not a finished or independently audited production system. It connects to your Chai & Co. Supabase project and provides:
- Supabase email/password sign-in and sign-out
- Active-profile checks and role-aware navigation
- Live dashboard, inventory, recipe cost summary, sales history, purchases and expenses read views
- Admin/Manager ingredient catalogue forms, including opening stock ledger entries
- Admin/Manager menu item creation and recipe editing with ingredient quantities per serving
- Atomic sales posting through a PostgreSQL RPC

## 1. Prerequisites
- Node.js 20.9+ (Node.js 22 LTS recommended)
- GitHub and Vercel accounts
- Access to the Chai & Co. Supabase project

## 2. Install locally
Open a terminal in this folder, then run:

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env.local
```

Open `http://localhost:3000`.

## 3. Environment variables
Set these in `.env.local` and in Vercel Project Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL=https://gcidzlvdtekccrzqgnda.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=` the project's **publishable key** or legacy `anon` key from Supabase Dashboard → Project Settings → API Keys.

Never put a `service_role` or secret key in a `NEXT_PUBLIC_` variable or browser code.

## 4. Database migration order
The base schema must already exist (from the separately supplied `supabase_phase1.sql` foundation). In Supabase Dashboard → SQL Editor, review and apply the following migrations in order if they have not already been applied:

1. `supabase/migrations/202610140001_record_sale.sql` — atomic sales posting.
2. `supabase/migrations/202610150001_catalogue_management.sql` — trusted ingredient, product and recipe editing.

Do not rerun a migration blindly after an error. Keep a backup and resolve the error before proceeding. These migrations have not been executed against your live Supabase project by this code change.

The sales RPC uses database product prices, checks recipe stock, locks ingredient rows, saves sale and cost snapshots, records stock movements, and deducts stock in one transaction. Products should have complete recipes before they are used for real sales.

## 5. Using the catalogue forms
- Inventory: Admin/Manager can create ingredients with a base unit, opening stock, minimum stock, cost per base unit and optional supplier. Opening stock is recorded in `stock_movements`.
- Editing an ingredient changes its descriptive fields, minimum stock, supplier and unit cost; it does not directly change on-hand quantity. This avoids bypassing the stock ledger. The base unit cannot be changed while a recipe uses the ingredient.
- Recipes & costing: Admin/Manager can create a menu item, then open its recipe editor to map ingredient quantities per serving. Leave a quantity blank or set it to zero to remove that ingredient from the recipe.
- Use consistent base units: grams (`g`), millilitres (`ml`), pieces (`pcs`) or portion. For example, 115 g of fries is `quantity_per_serving = 115` when the ingredient's base unit is `g`.
- Historical sales retain saved cost snapshots when a recipe or ingredient cost changes.

## 6. Test checklist before real data
- Sign in with an active Admin Auth account and confirm `/dashboard` loads.
- Create a test ingredient and verify its opening stock movement.
- Create a test menu item, map its recipe, and verify the recipe cost and food-cost percentage.
- Attempt a sale with insufficient recipe stock; the sale should fail without changing stock.
- Attempt a sale with sufficient stock; verify the sale, sale_items and stock_movements rows and reduced ingredient stock.
- Test the same catalogue screens with Staff; Staff must not be able to save catalogue changes even if they submit a server action directly.
- Test separate Manager and Staff accounts and confirm staff cannot read management-only purchases/expenses.
- Do not use real business data until these checks pass.

## 7. Deploy to Vercel
1. Import this repository into Vercel as a new project (or ensure the existing project points to this app directory).
2. Set the two Supabase environment variables above.
3. Deploy and check the build logs.
4. In Supabase → Authentication → URL Configuration, set the Site URL to the deployed Vercel URL and add the local/deployed URLs to Redirect URLs as appropriate.
5. Test login, logout, role restrictions, recipe editing and sales posting on the deployed URL.

## Current limitations
- Purchase creation/posting, stock-count posting, wastage/adjustment forms, expense creation, team/shift management and full reporting are not yet implemented as secure write workflows.
- No invitation-only Admin UI, account role assignment UI or void-sale/refund workflow.
- Role-aware navigation is for usability only. Database RLS and the role checks inside PostgreSQL functions are the security boundaries.
- The base `supabase_phase1.sql` foundation is currently supplied separately rather than in this app's migration folder.
