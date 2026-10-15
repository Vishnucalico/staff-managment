import { createClient } from "@/lib/supabase/server";
const inr = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
export default async function PurchasesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("purchases").select("id,purchase_date,supplier_name_snapshot,invoice_number,subtotal").order("purchase_date", { ascending: false }).limit(100);
  if (error) return <div className="notice error">Purchases are restricted to Admin and Manager accounts, or the query could not load.</div>;
  return <><div className="page-head"><div><div className="eyebrow">CHAI &amp; CO. / STOCK IN</div><h2>Purchases</h2><p>Purchase history. Purchase entry and weighted-average stock posting are not enabled yet.</p></div></div><section className="panel"><div className="panel-head"><h3>Recent purchase records</h3></div><div className="table-wrap"><table><thead><tr><th>Date</th><th>Supplier</th><th>Invoice</th><th>Subtotal</th></tr></thead><tbody>{data?.map(p => <tr key={p.id}><td>{p.purchase_date}</td><td>{p.supplier_name_snapshot || "—"}</td><td>{p.invoice_number || "—"}</td><td>{inr(Number(p.subtotal))}</td></tr>)}{!data?.length && <tr><td colSpan={4} className="empty">No purchases found.</td></tr>}</tbody></table></div></section></>;
}
