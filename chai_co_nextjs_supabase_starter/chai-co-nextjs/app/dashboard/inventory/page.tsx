import { createClient } from "@/lib/supabase/server";
import { deleteIngredient, saveIngredient } from "./actions";
import { ConfirmDeleteForm } from "../confirm-delete-form";

const inr = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
const unitCostLabel = (value: number) => "₹" + Number(value).toLocaleString("en-IN", { maximumFractionDigits: 5 });
type PageProps = { searchParams: Promise<{ saved?: string; deleted?: string; error?: string }> };

function feedback(saved?: string, error?: string) {
  if (saved) return <p className="success">Ingredient details saved.</p>;
  if (!error) return null;
  const messages: Record<string, string> = {
    permission: "Only an Admin or Manager can change ingredients.",
    validation: "Check the name, unit, and non-negative numeric values.",
    save: "Could not save the ingredient. Check that the catalogue migration has been applied and the supplier is active.",
    delete: "Could not delete this ingredient. Confirm the catalogue migration has been applied.",
    inuse: "This ingredient is used by an active recipe. Remove it from active recipes before deleting it.",
  };
  return <p className="error">{messages[error] ?? "Something went wrong. Please try again."}</p>;
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data, error }, { data: suppliers }] = await Promise.all([
    supabase.from("ingredients").select("id,name,category,base_unit,current_stock,minimum_stock,unit_cost,supplier_id,is_active").eq("is_active", true).order("name"),
    supabase.from("suppliers").select("id,name").eq("is_active", true).order("name"),
  ]);
  if (error) return <div className="notice error">Could not load inventory. Confirm your Supabase migration and environment variables.</div>;
  const rows = data ?? [];
  const supplierRows = suppliers ?? [];
  const totalValue = rows.reduce((sum, i) => sum + Number(i.current_stock) * Number(i.unit_cost), 0);

  return <>
    <div className="page-head"><div><div className="eyebrow">CHAI &amp; CO. / STOCK</div><h2>Inventory</h2><p>Manage ingredient details, base units, costs and minimum stock levels.</p></div></div>
    {params.deleted && <p className="success">Ingredient deleted from the active catalogue. Historical records were kept.</p>}
    {feedback(params.saved, params.error)}
    <div className="stats">
      <div className="stat"><div className="stat-label">Ingredients</div><div className="stat-value">{rows.length}</div></div>
      <div className="stat"><div className="stat-label">Low stock</div><div className="stat-value">{rows.filter(i => Number(i.current_stock) <= Number(i.minimum_stock)).length}</div></div>
      <div className="stat"><div className="stat-label">Inventory value</div><div className="stat-value">{inr(totalValue)}</div></div>
      <div className="stat"><div className="stat-label">Unit types</div><div className="stat-value">{new Set(rows.map(i => i.base_unit)).size}</div></div>
    </div>
    <section className="panel">
      <div className="panel-head"><div><h3>Add ingredient</h3><p>Choose a consistent base unit for recipe calculations.</p></div></div>
      <div className="panel-body">
        <form action={saveIngredient} className="form-grid">
          <div className="field"><label htmlFor="new-name">Ingredient name</label><input id="new-name" name="name" required maxLength={120} /></div>
          <div className="field"><label htmlFor="new-category">Category</label><input id="new-category" name="category" defaultValue="Other" maxLength={80} /></div>
          <div className="field"><label htmlFor="new-unit">Base unit</label><select id="new-unit" name="base_unit" defaultValue="g" required><option value="g">Grams (g)</option><option value="ml">Millilitres (ml)</option><option value="pcs">Pieces (pcs)</option><option value="portion">Portion</option></select></div>
          <div className="field"><label htmlFor="new-supplier">Supplier (optional)</label><select id="new-supplier" name="supplier_id" defaultValue=""><option value="">No supplier</option>{supplierRows.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select></div>
          <div className="field"><label htmlFor="new-stock">Opening stock</label><input id="new-stock" name="opening_stock" type="number" min="0" step="0.001" defaultValue="0" required /></div>
          <div className="field"><label htmlFor="new-min">Minimum stock</label><input id="new-min" name="minimum_stock" type="number" min="0" step="0.001" defaultValue="0" required /></div>
          <div className="field"><label htmlFor="new-cost">Cost per base unit (₹)</label><input id="new-cost" name="unit_cost" type="number" min="0" step="0.00001" defaultValue="0" required /></div>
          <div className="full"><p className="footnote">Example: ₹270 for 2.5 kg of fries = ₹0.108 per gram. Opening stock is recorded in the stock movement ledger.</p><button className="btn primary" type="submit">＋ Save ingredient</button></div>
        </form>
      </div>
    </section>
    <section className="panel">
      <div className="panel-head"><div><h3>Ingredient stock</h3><p>Current quantity changes should be recorded through a stock or purchase workflow, not a catalogue edit.</p></div></div>
      <div className="table-wrap"><table><thead><tr><th>Ingredient</th><th>Category</th><th>On hand</th><th>Minimum</th><th>Cost / unit</th><th>Stock value</th><th>Status</th><th>Details</th><th>Delete</th></tr></thead><tbody>
        {rows.map(i => {
          const low = Number(i.current_stock) <= Number(i.minimum_stock);
          return <tr key={i.id}>
            <td><strong>{i.name}</strong></td><td>{i.category}</td><td>{i.current_stock} {i.base_unit}</td><td>{i.minimum_stock} {i.base_unit}</td>
            <td>{unitCostLabel(Number(i.unit_cost))} / {i.base_unit}</td><td>{inr(Number(i.current_stock) * Number(i.unit_cost))}</td>
            <td><span className={`tag ${low ? "red" : "green"}`}>{low ? "Low stock" : "In stock"}</span></td>
            <td><details><summary className="muted">Edit details</summary><form action={saveIngredient} className="form-grid" style={{minWidth: 320, paddingTop: 12}}>
              <input type="hidden" name="ingredient_id" value={i.id} />
              <input type="hidden" name="opening_stock" value={i.current_stock} />
              <div className="field"><label>Name</label><input name="name" defaultValue={i.name} required maxLength={120} /></div>
              <div className="field"><label>Category</label><input name="category" defaultValue={i.category} maxLength={80} /></div>
              <div className="field"><label>Base unit</label><select name="base_unit" defaultValue={i.base_unit} required><option value="g">g</option><option value="ml">ml</option><option value="pcs">pcs</option><option value="portion">portion</option></select></div>
              <div className="field"><label>Supplier</label><select name="supplier_id" defaultValue={i.supplier_id ?? ""}><option value="">No supplier</option>{supplierRows.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select></div>
              <div className="field"><label>Minimum stock</label><input name="minimum_stock" type="number" min="0" step="0.001" defaultValue={i.minimum_stock} required /></div>
              <div className="field"><label>Cost per base unit (₹)</label><input name="unit_cost" type="number" min="0" step="0.00001" defaultValue={i.unit_cost} required /></div>
              <div className="full"><p className="footnote">Current stock: {i.current_stock} {i.base_unit}. To protect the ledger, this form does not change on-hand quantity. A base unit cannot be changed while recipes use this ingredient.</p><button className="btn" type="submit">Save details</button></div>
            </form></details></td>
          </tr>;
        })}
        {!rows.length && <tr><td colSpan={9} className="empty">No ingredients added yet. Add the first ingredient above.</td></tr>}
      </tbody></table></div>
    </section>
  </>;
}
