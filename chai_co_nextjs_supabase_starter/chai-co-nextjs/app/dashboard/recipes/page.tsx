import { createClient } from "@/lib/supabase/server";
const inr = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export default async function RecipesPage() {
  const supabase = await createClient();
  const [{ data: products, error }, { data: recipes }] = await Promise.all([
    supabase.from("products").select("id,name,category,selling_price,is_active").eq("is_active", true).order("name"),
    supabase.from("recipes").select("product_id,quantity_per_serving,ingredients(name,base_unit,unit_cost)"),
  ]);
  if (error) return <div className="notice error">Could not load menu items. Check the Supabase configuration.</div>;
  const recipeRows = recipes ?? [];
  return <>
    <div className="page-head"><div><div className="eyebrow">CHAI &amp; CO. / MENU</div><h2>Recipes &amp; costing</h2><p>Current recipe cost based on ingredient unit costs.</p></div></div>
    <div className="notice"><strong>Read-only starter screen.</strong> Recipe editing will be added with validated server actions and database permissions. Add products and recipes through a trusted Admin/Manager workflow before recording live sales.</div>
    <section className="panel"><div className="panel-head"><div><h3>Menu cost summary</h3><p>Products without recipe lines are marked as not costed.</p></div></div><div className="table-wrap"><table><thead><tr><th>Menu item</th><th>Category</th><th>Selling price</th><th>Recipe cost</th><th>Gross profit estimate</th><th>Food cost</th><th>Recipe lines</th></tr></thead><tbody>{(products ?? []).map(p => {
      const lines = recipeRows.filter(r => r.product_id === p.id);
      const cost = lines.reduce((sum, r) => {
        const ing = Array.isArray(r.ingredients) ? r.ingredients[0] : r.ingredients;
        return sum + Number(r.quantity_per_serving) * Number(ing?.unit_cost ?? 0);
      }, 0);
      const price = Number(p.selling_price);
      const pct = price ? cost / price * 100 : 0;
      return <tr key={p.id}><td><strong>{p.name}</strong></td><td>{p.category}</td><td>{inr(price)}</td><td>{lines.length ? inr(cost) : <span className="tag amber">Not costed</span>}</td><td>{inr(price - cost)}</td><td>{lines.length ? `${pct.toFixed(1)}%` : "—"}</td><td>{lines.length}</td></tr>;
    })}{!products?.length && <tr><td colSpan={7} className="empty">No menu items yet.</td></tr>}</tbody></table></div></section>
  </>;
}
