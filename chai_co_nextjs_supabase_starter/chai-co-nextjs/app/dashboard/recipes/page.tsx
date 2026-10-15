import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteProduct, saveProductRecipe } from "./actions";
import { ConfirmDeleteForm } from "../confirm-delete-form";

const inr = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
type PageProps = { searchParams: Promise<{ saved?: string; deleted?: string; error?: string }> };

export default async function RecipesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: products, error }, { data: recipes }] = await Promise.all([
    supabase.from("products").select("id,name,category,selling_price,is_active").eq("is_active", true).order("name"),
    supabase.from("recipes").select("product_id,quantity_per_serving,ingredients(name,base_unit,unit_cost)"),
  ]);
  if (error) return <div className="notice error">Could not load menu items. Check the Supabase configuration.</div>;
  const productRows = products ?? [];
  const recipeRows = recipes ?? [];
  const costByProduct = (productId: string) => recipeRows.filter(r => r.product_id === productId).reduce((sum, r) => {
    const ing = Array.isArray(r.ingredients) ? r.ingredients[0] : r.ingredients;
    return sum + Number(r.quantity_per_serving) * Number(ing?.unit_cost ?? 0);
  }, 0);
  const countWithRecipes = productRows.filter(p => recipeRows.some(r => r.product_id === p.id)).length;
  const avgFoodCost = productRows.length ? productRows.reduce((sum, p) => sum + (Number(p.selling_price) ? costByProduct(p.id) / Number(p.selling_price) * 100 : 0), 0) / productRows.length : 0;

  const errorText: Record<string, string> = {
    permission: "Only an Admin or Manager can edit menu items and recipes.",
    validation: "Check the menu item name and selling price.",
    quantity: "Recipe quantities must be positive numbers.",
    save: "Could not save the menu item. Check that the catalogue migration has been applied and all selected ingredients are active.",
    delete: "Could not delete the menu item. Confirm the catalogue migration has been applied.",
  };

  return <>
    <div className="page-head"><div><div className="eyebrow">CHAI &amp; CO. / MENU</div><h2>Recipes &amp; costing</h2><p>Manage selling prices and recipe quantities; cost and food-cost percentage are calculated from ingredient unit costs.</p></div></div>
    {params.saved && <p className="success">Menu item created. Add its ingredients on the recipe editor page.</p>}
    {params.deleted && <p className="success">Menu item deleted from the active menu. Historical records were kept.</p> }
    {params.error && <p className="error">{errorText[params.error] ?? "Something went wrong. Please try again."}</p>}
    <div className="stats">
      <div className="stat"><div className="stat-label">Menu items</div><div className="stat-value">{productRows.length}</div></div>
      <div className="stat"><div className="stat-label">Recipes configured</div><div className="stat-value">{countWithRecipes}</div></div>
      <div className="stat"><div className="stat-label">Average food cost</div><div className="stat-value">{avgFoodCost.toFixed(1)}%</div></div>
      <div className="stat"><div className="stat-label">Needs recipe</div><div className="stat-value">{productRows.length - countWithRecipes}</div></div>
    </div>
    <section className="panel">
      <div className="panel-head"><div><h3>Add menu item</h3><p>Create a product, then map its ingredients per serving.</p></div></div>
      <div className="panel-body"><form action={saveProductRecipe} className="form-grid">
        <div className="field"><label htmlFor="product-name">Menu item name</label><input id="product-name" name="name" required maxLength={120} /></div>
        <div className="field"><label htmlFor="product-category">Category</label><input id="product-category" name="category" defaultValue="Other" maxLength={80} /></div>
        <div className="field"><label htmlFor="product-price">Selling price (₹)</label><input id="product-price" name="selling_price" type="number" min="0" step="0.01" required /></div>
        <div className="full"><p className="footnote">GST invoicing is not included in this module. Product creation is restricted to Admin and Manager roles.</p><button className="btn primary" type="submit">＋ Create menu item</button></div>
      </form></div>
    </section>
    <section className="panel">
      <div className="panel-head"><div><h3>Menu and recipe costs</h3><p>Historical sale cost snapshots are not changed when a recipe is edited.</p></div></div>
      <div className="table-wrap"><table><thead><tr><th>Menu item</th><th>Category</th><th>Selling price</th><th>Recipe cost</th><th>Gross profit / item</th><th>Food cost</th><th>Recipe lines</th><th>Actions</th></tr></thead><tbody>
        {productRows.map(p => {
          const lines = recipeRows.filter(r => r.product_id === p.id);
          const cost = costByProduct(p.id);
          const price = Number(p.selling_price);
          const pct = price ? cost / price * 100 : 0;
          return <tr key={p.id}><td><strong>{p.name}</strong></td><td>{p.category}</td><td>{inr(price)}</td><td>{lines.length ? inr(cost) : <span className="tag amber">Not costed</span>}</td><td>{inr(price - cost)}</td><td>{lines.length ? `${pct.toFixed(1)}%` : "—"}</td><td>{lines.length}</td><td><div className="actions"><Link className="btn" href={`/dashboard/recipes/${p.id}`}>Edit recipe</Link><ConfirmDeleteForm action={deleteProduct} id={p.id} label="Delete" confirmMessage={`Delete menu item “${p.name}”? It will be removed from the active menu, while historical records remain.`} /></div></td></tr>;
        })}
        {!productRows.length && <tr><td colSpan={8} className="empty">No menu items yet. Add your first item above.</td></tr>}
      </tbody></table></div>
    </section>
  </>;
}
