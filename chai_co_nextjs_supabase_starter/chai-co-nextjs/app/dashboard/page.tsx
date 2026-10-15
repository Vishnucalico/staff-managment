import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const inr = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  const [{ data: sales }, { data: ingredients }, { data: products }, { data: expenses }] = await Promise.all([
    supabase.from("sales").select("id,total,subtotal,discount").eq("sale_date", today).is("voided_at", null),
    supabase.from("ingredients").select("id,current_stock,minimum_stock,unit_cost,name,base_unit").eq("is_active", true),
    supabase.from("products").select("id,name,selling_price").eq("is_active", true),
    supabase.from("expenses").select("amount").eq("expense_date", today),
  ]);

  const revenue = (sales ?? []).reduce((sum, row) => sum + Number(row.total), 0);
  const expenseTotal = (expenses ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
  const lowStock = (ingredients ?? []).filter(i => Number(i.current_stock) <= Number(i.minimum_stock)).length;
  const stockValue = (ingredients ?? []).reduce((sum, i) => sum + Number(i.current_stock) * Number(i.unit_cost), 0);

  return <>
    <div className="page-head"><div><div className="eyebrow">CHAI &amp; CO. / OPERATIONS</div><h2>Shop overview</h2><p>Live data from your Supabase database.</p></div><div className="actions"><Link className="btn primary" href="/dashboard/sales">＋ Daily sales entry</Link></div></div>
    <div className="stats">
      <div className="stat"><div className="stat-label">Today's recorded sales</div><div className="stat-value">{inr(revenue)}</div><div className="stat-foot">{sales?.length ?? 0} sale records</div></div>
      <div className="stat"><div className="stat-label">Operating expenses today</div><div className="stat-value">{inr(expenseTotal)}</div><div className="stat-foot">Recorded expenses</div></div>
      <div className="stat"><div className="stat-label">Low-stock ingredients</div><div className="stat-value">{lowStock}</div><div className="stat-foot">{lowStock ? "Review stock levels" : "No low-stock alerts"}</div></div>
      <div className="stat"><div className="stat-label">Inventory value</div><div className="stat-value">{inr(stockValue)}</div><div className="stat-foot">On-hand quantity × unit cost</div></div>
    </div>
    <section className="panel"><div className="panel-head"><div><h3>Quick access</h3><p>Core shop management screens</p></div></div><div className="panel-body actions">
      <Link className="btn" href="/dashboard/sales">Daily sales</Link><Link className="btn" href="/dashboard/inventory">Inventory</Link><Link className="btn" href="/dashboard/recipes">Recipes &amp; costing</Link><Link className="btn" href="/dashboard/purchases">Purchases</Link><Link className="btn" href="/dashboard/expenses">Expenses</Link>
    </div></section>
    <section className="panel"><div className="panel-head"><div><h3>Low-stock watch</h3><p>Ingredients at or below their minimum stock</p></div><Link className="btn" href="/dashboard/inventory">Open inventory</Link></div><div className="table-wrap"><table><thead><tr><th>Ingredient</th><th>On hand</th><th>Minimum</th><th>Unit cost</th><th>Status</th></tr></thead><tbody>{(ingredients ?? []).filter(i => Number(i.current_stock) <= Number(i.minimum_stock)).slice(0, 8).map(i => <tr key={i.id}><td><strong>{i.name}</strong></td><td>{i.current_stock} {i.base_unit}</td><td>{i.minimum_stock} {i.base_unit}</td><td>{inr(Number(i.unit_cost))}</td><td><span className="tag red">Low stock</span></td></tr>)}{lowStock === 0 && <tr><td colSpan={5} className="empty">No low-stock ingredients currently.</td></tr>}</tbody></table></div></section>
    <p className="footnote">Menu items available: {products?.length ?? 0}. Revenue shown here is recorded sales, not a substitute for a reconciled financial report.</p>
  </>;
}
