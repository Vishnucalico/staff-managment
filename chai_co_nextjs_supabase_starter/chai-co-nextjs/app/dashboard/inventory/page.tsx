import { createClient } from "@/lib/supabase/server";
const inr = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("ingredients").select("id,name,category,base_unit,current_stock,minimum_stock,unit_cost,is_active").eq("is_active", true).order("name");
  if (error) return <div className="notice error">Could not load inventory. Confirm your migration and Supabase environment variables.</div>;
  const rows = data ?? [];
  return <>
    <div className="page-head"><div><div className="eyebrow">CHAI &amp; CO. / STOCK</div><h2>Inventory</h2><p>Live ingredient stock and current unit cost.</p></div></div>
    <div className="stats"><div className="stat"><div className="stat-label">Ingredients</div><div className="stat-value">{rows.length}</div></div><div className="stat"><div className="stat-label">Low stock</div><div className="stat-value">{rows.filter(i => Number(i.current_stock) <= Number(i.minimum_stock)).length}</div></div><div className="stat"><div className="stat-label">Inventory value</div><div className="stat-value">{inr(rows.reduce((sum, i) => sum + Number(i.current_stock) * Number(i.unit_cost), 0))}</div></div><div className="stat"><div className="stat-label">Unit types</div><div className="stat-value">{new Set(rows.map(i => i.base_unit)).size}</div></div></div>
    <section className="panel"><div className="panel-head"><div><h3>Ingredient stock</h3><p>Stock edits and purchases are intentionally not enabled in this starter screen.</p></div></div><div className="table-wrap"><table><thead><tr><th>Ingredient</th><th>Category</th><th>On hand</th><th>Minimum</th><th>Cost / unit</th><th>Stock value</th><th>Status</th></tr></thead><tbody>{rows.map(i => { const low = Number(i.current_stock) <= Number(i.minimum_stock); return <tr key={i.id}><td><strong>{i.name}</strong></td><td>{i.category}</td><td>{i.current_stock} {i.base_unit}</td><td>{i.minimum_stock} {i.base_unit}</td><td>{inr(Number(i.unit_cost))} / {i.base_unit}</td><td>{inr(Number(i.current_stock) * Number(i.unit_cost))}</td><td><span className={`tag ${low ? "red" : "green"}`}>{low ? "Low stock" : "In stock"}</span></td></tr>; })}{!rows.length && <tr><td colSpan={7} className="empty">No ingredients added yet.</td></tr>}</tbody></table></div></section>
  </>;
}
