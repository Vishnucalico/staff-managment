"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const allowedPayments = new Set(["cash", "upi", "card", "mixed", "bank_transfer", "other"]);

export async function recordSale(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login?error=inactive");

  const items: { product_id: string; quantity: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("qty_")) continue;
    const quantity = Number(value);
    if (!Number.isInteger(quantity) || quantity < 0) redirect("/dashboard/sales?error=quantity");
    if (quantity > 0) items.push({ product_id: key.slice(4), quantity });
  }
  if (!items.length) redirect("/dashboard/sales?error=empty");

  const payment = String(formData.get("payment_method") ?? "cash");
  if (!allowedPayments.has(payment)) redirect("/dashboard/sales?error=payment");

  const discount = Number(formData.get("discount") ?? 0);
  if (!Number.isFinite(discount) || discount < 0) redirect("/dashboard/sales?error=discount");

  const { error } = await supabase.rpc("record_sale", {
    p_sale_date: String(formData.get("sale_date") || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })),
    p_reference: String(formData.get("reference") ?? "").trim() || null,
    p_payment_method: payment,
    p_discount: discount,
    p_notes: String(formData.get("notes") ?? "").trim() || null,
    p_items: items,
  });

  if (error) redirect("/dashboard/sales?error=save");
  redirect("/dashboard/sales?saved=1");
}
