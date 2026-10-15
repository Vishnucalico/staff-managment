# Chai & Co. — Next.js + Supabase starter

This is a **starter implementation**, not a finished or independently audited production system. It connects to your existing Supabase project and provides:
- Supabase email/password sign-in and sign-out
- Active-profile checks and role-aware navigation
- Live dashboard, inventory, recipe cost summary, sales history, purchases and expenses read views
- Atomic sales posting through a PostgreSQL RPC (SQL migration included)

## 1. Prerequisites
- Node.js 20.9+ (Node.js 22 LTS recommended)
- A GitHub account
- Vercel account
- Access to the Chai & Co. Supabase project

## 2. Install locally
Extract the ZIP, open a terminal in this folder, then run:

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, copy the env file with:

```powershell
Copy-Item .env.example .env.local
```

Open `http://localhost:3000`.

## 3. Set environment variables
In `.env.local`, set:
- `NEXT_PUBLIC_SUPABASE_URL=https://gcidzlvdtekccrzqgnda.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=` the project's **publishable key** or legacy `anon` key from Supabase Dashboard → Project Settings → API Keys.

Never put a `service_role` or secret key in a `NEXT_PUBLIC_` variable or in browser code.

## 4. Apply the atomic sales migration
Before using the sales page:
1. Open Supabase Dashboard → SQL Editor.
2. Open `supabase/migrations/202610140001_record_sale.sql`.
3. Review it, then run it once.
4. Do not repeatedly rerun if an error occurs; send the exact error text with secrets removed.

This function uses trusted product prices from the database, checks available recipe stock, locks ingredient rows, writes sale snapshots and stock movements, and deducts ingredients within one PostgreSQL transaction. Items with no recipe deduct no ingredients. A product should have its recipe configured before it is used for real sales.

## 5. Prepare data
The Phase 1 migration created empty tables; it did not seed the sample products/ingredients from the old browser demo. Add initial suppliers, ingredients, products and recipe rows through a trusted Admin/Manager setup workflow before entering sales. This starter does not yet include those write forms.

For each recipe, `quantity_per_serving` must use the ingredient's `base_unit`: grams (`g`), millilitres (`ml`), pieces (`pcs`) or portion. Example: 115 g fries is `quantity_per_serving = 115` when the ingredient's base unit is `g`.

## 6. Local test checklist
- Sign in with the existing Admin Auth account.
- Confirm `/dashboard` loads.
- Confirm the role badge shows `ADMIN`.
- Add test products and recipes before attempting a sale.
- Try a sale with an ingredient stock quantity below the recipe requirement; the entire sale should fail and stock should remain unchanged.
- Try a sale with sufficient stock; verify the sale, sale_items and stock_movements rows and reduced ingredient stock.
- Create separate Manager and Staff accounts only through your controlled admin workflow; verify that staff cannot read management-only purchases/expenses.
- Do not use real business data until these checks pass.

## 7. Deploy to Vercel
1. Create a private GitHub repository and push these files.
2. In Vercel, import that repository as a new project.
3. Add the same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables in Vercel project settings.
4. Deploy.
5. In Supabase → Authentication → URL Configuration, set the Site URL to the deployed Vercel URL and add local/deployed URLs to Redirect URLs as appropriate.
6. Test login and logout on the deployed URL.

## Current limitations
- No create/edit forms yet for products, ingredients, recipes, suppliers, purchases, expenses, team or shifts.
- No invitation-only Admin UI, account role assignment UI, audit triggers, purchase-posting RPC, void-sale/refund workflow or full reporting.
- Role-aware navigation is for usability only. The database RLS policies are the actual security boundary.
- The Phase 1 SQL and this starter have not been run against your live project by this package generator. Test before production use.
