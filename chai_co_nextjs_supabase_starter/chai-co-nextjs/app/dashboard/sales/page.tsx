import { createClient } from "@/lib/supabase/server";
import { recordSale } from "./actions";

type Props = { searchParams: Promise<{ error?: string; saved?: string }> };
const inr = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export default async function SalesPage({ searchParams }: Props) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const [{ data: products }, { data: sales }] = await Promise.all([
    supabase.from("products").select("id,name,category,selling_price").eq("is_active", true).order("name"),
    supabase.from("sales").select("id,sale_date,reference,payment_method,total,created_at").order("created_at", { ascending: false }).limit(12),
  ]);
  const errors: Record<string, string> = {
    quantity: "Quantities must be whole numbers and cannot be negative.",
    empty: "Enter a quantity for at least one menu item.",
    payment: "Choose a valid payment method.",
    discount: "Discount must be zero or greater.",
    save: "The sale could not be saved. Check stock levels, product recipes and the SQL RPC migration, then try again.",
  };

  return <>
    <div className="page-head"><div><div className="eyebrow">CHAI &amp; CO. / SALES</div><h2>Daily sales entry</h2><p>Enter item-wise quantities. Ingredient deductions run in one database transaction.</p></div></div>
    {error && errors[error] && <div className="notice error" role="alert">{errors[error]}</div>}
    {saved === "1" && <div className="notice success" role="status">Sale saved and recipe-linked stock deductions applied.</div>}
    <section className="panel"><div className="panel-head"><div><h3>New sale</h3><p>Only choose items sold during this entry.</p></div></div><div className="panel-body">
      {!products?.length ? <div className="notice">No active menu items exist yet. Ask an Admin or Manager to add products before recording sales.</div> : <form action={recordSale} className="login-form">
        <div className="form-grid">
          <div className="field"><label htmlFor="sale_date">Sale date</label><input id="sale_date" name="sale_date" type="date" defaultValue={new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })} required /></div>
          <div className="field"><label htmlFor="payment_method">Payment method</label><select id="payment_method" name="payment_method" defaultValue="cash"><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="mixed">Mixed</option><option value="bank_transfer">Bank transfer</option><option value="other">Other</option></select></div>
          <div className="field"><label htmlFor="reference">Reference (optional)</label><input id="reference" name="reference" maxLength={120} /></div>
          <div className="field"><label htmlFor="discount">Discount (₹)</label><input id="discount" name="discount" type="number" min="0" step="0.01" defaultValue="0" /></div>
          <div className="field full"><label htmlFor="notes">Notes (optional)</label><input id="notes" name="notes" maxLength={500} /></div>
        </div>
        <div className="panel" style={{marginBottom:0}}><div className="panel-head"><h3>Menu quantities</h3><span className="muted">{products.length} active items</span></div><div className="table-wrap"><table><thead><tr><th>Menu item</th><th>Category</th><th>Price</th><th>Quantity</th></tr></thead><tbody>{products.map(p => <tr key={p.id}><td><strong>{p.name}</strong></td><td>{p.category}</td><td>{inr(Number(p.selling_price))}</td><td><input className="qty-input" aria-label={`Quantity for ${p.name}`} type="number" min="0" step="1" name={`qty_${p.id}`} defaultValue="0" /></td></tr>)}</tbody></table></div></div>
        <button className="btn primary" type="submit">Save sale &amp; update stock</button>
      </form>}
    </div></section>
    <section className="panel"><div className="panel-head"><div><h3>Recent sales</h3><p>Latest records visible to your account</p></div></div><div className="table-wrap"><table><thead><tr><th>Date</th><th>Reference</th><th>Payment</th><th>Total</th></tr></thead><tbody>{sales?.map(s => <tr key={s.id}><td>{s.sale_date}</td><td>{s.reference || "Daily sales"}</td><td><span className="tag">{s.payment_method}</span></td><td><strong>{inr(Number(s.total))}</strong></td></tr>)}{!sales?.length && <tr><td colSpan={4} className="empty">No sales records visible yet.</td></tr>}</tbody></table></div></section>
  </>;
}
