import { createClient } from "@/lib/supabase/server";
const inr = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
export default async function ExpensesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("expenses").select("id,expense_date,category,description,amount,payment_method").order("expense_date", { ascending: false }).limit(100);
  if (error) return <div className="notice error">Expenses are restricted to Admin and Manager accounts, or the query could not load.</div>;
  return <><div className="page-head"><div><div className="eyebrow">CHAI &amp; CO. / FINANCE</div><h2>Expenses</h2><p>Expense history. New expense entry will be enabled in a later step.</p></div></div><section className="panel"><div className="panel-head"><h3>Recent expenses</h3></div><div className="table-wrap"><table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Payment</th><th>Amount</th></tr></thead><tbody>{data?.map(e => <tr key={e.id}><td>{e.expense_date}</td><td>{e.category}</td><td>{e.description}</td><td>{e.payment_method}</td><td>{inr(Number(e.amount))}</td></tr>)}{!data?.length && <tr><td colSpan={5} className="empty">No expenses found.</td></tr>}</tbody></table></div></section></>;
}
