import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveProductRecipe } from "../actions";

const inr = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
const unitCostLabel = (value: number) => "₹" + Number(value).toLocaleString("en-IN", { maximumFractionDigits: 5 });
type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> };

export default async function RecipeEditorPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data: product, error: productError }, { data: ingredients }, { data: recipes }] = await Promise.all([
    supabase.from("products").select("id,name,category,selling_price").eq("id", id).eq("is_active", true).maybeSingle(),
    supabase.from("ingredients").select("id,name,category,base_unit,current_stock,unit_cost").eq("is_active", true).order("name"),
    supabase.from("recipes").select("ingredient_id,quantity_per_serving").eq("product_id", id),
  ]);
  if (productError || !product) notFound();

  const ingredientRows = ingredients ?? [];
  const recipeRows = recipes ?? [];
  const quantities = new Map(recipeRows.map(row => [row.ingredient_id, Number(row.quantity_per_serving)]));
  const currentCost = ingredientRows.reduce((sum, ingredient) => sum + (quantities.get(ingredient.id) ?? 0) * Number(ingredient.unit_cost), 0);
  const price = Number(product.selling_price);
  const errorText: Record<string, string> = {
    permission: "Only an Admin or Manager can edit recipes.",
    validation: "Check the menu item name and selling price.",
    quantity: "Every recipe quantity must be a positive number or left blank.",
    save: "The recipe was not saved. Confirm the catalogue migration is applied and selected ingredients are active.",
  };

  return <>
    <div className="page-head"><div><div className="eyebrow">CHAI &amp; CO. / MENU</div><h2>Edit recipe</h2><p>Set the ingredient quantities required for one serving of {product.name}.</p></div><div className="actions"><Link className="btn" href="/dashboard/recipes">← Back to menu</Link></div></div>
    {query.saved && <p className="success">Menu item and recipe saved successfully.</p>}
    {query.error && <p className="error">{errorText[query.error] ?? "Something went wrong. Please try again."}</p>}
    <div className="stats">
      <div className="stat"><div className="stat-label">Current selling price</div><div className="stat-value">{inr(price)}</div></div>
      <div className="stat"><div className="stat-label">Current recipe cost</div><div className="stat-value">{inr(currentCost)}</div></div>
      <div className="stat"><div className="stat-label">Gross profit estimate</div><div className="stat-value">{inr(price - currentCost)}</div></div>
      <div className="stat"><div className="stat-label">Food cost</div><div className="stat-value">{price ? (currentCost / price * 100).toFixed(1) : "—"}{price ? "%" : ""}</div></div>
    </div>
    <section className="panel">
      <div className="panel-head"><div><h3>Menu item details</h3><p>Costing uses each ingredient's current unit cost.</p></div></div>
      <div className="panel-body">
        <form action={saveProductRecipe}>
          <input type="hidden" name="product_id" value={product.id} />
          <div className="form-grid">
            <div className="field"><label htmlFor="edit-name">Menu item name</label><input id="edit-name" name="name" defaultValue={product.name} required maxLength={120} /></div>
            <div className="field"><label htmlFor="edit-category">Category</label><input id="edit-category" name="category" defaultValue={product.category} maxLength={80} /></div>
            <div className="field"><label htmlFor="edit-price">Selling price (₹)</label><input id="edit-price" name="selling_price" type="number" min="0" step="0.01" defaultValue={product.selling_price} required /></div>
          </div>
          <div className="row" style={{marginTop: 24, marginBottom: 12}}><div><h3 style={{margin:0}}>Ingredients per serving</h3><p className="footnote">Leave unused ingredients blank. Quantities use each ingredient's base unit.</p></div><span className="tag">{ingredientRows.length} available</span></div>
          <div className="table-wrap"><table><thead><tr><th>Ingredient</th><th>Base unit</th><th>On hand</th><th>Unit cost</th><th>Quantity / serving</th><th>Current line cost</th></tr></thead><tbody>
            {ingredientRows.map(ingredient => {
              const qty = quantities.get(ingredient.id) ?? 0;
              return <tr key={ingredient.id}>
                <td><strong>{ingredient.name}</strong><div className="footnote">{ingredient.category}</div></td>
                <td>{ingredient.base_unit}</td>
                <td>{ingredient.current_stock} {ingredient.base_unit}</td>
                <td>{unitCostLabel(Number(ingredient.unit_cost))} / {ingredient.base_unit}</td>
                <td><input className="qty-input" aria-label={`Quantity of ${ingredient.name} per serving`} name={`qty_${ingredient.id}`} type="number" min="0" step="0.001" defaultValue={qty || ""} placeholder="0" /></td>
                <td>{inr(qty * Number(ingredient.unit_cost))}</td>
              </tr>;
            })}
            {!ingredientRows.length && <tr><td colSpan={6} className="empty">Add ingredients in Inventory before building a recipe.</td></tr>}
          </tbody></table></div>
          <div className="notice" style={{marginTop: 16}}><strong>Stock and history:</strong> saving changes the current recipe used for future sales. Past sales retain their saved cost snapshots. The sales database function will reject a sale if the mapped ingredients do not have enough stock.</div>
          <div className="actions"><button className="btn primary" type="submit">Save menu item and recipe</button><Link className="btn" href="/dashboard/recipes">Cancel</Link></div>
        </form>
      </div>
    </section>
  </>;
}
