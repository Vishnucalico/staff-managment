"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveIngredient(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login?error=inactive");
  if (profile.role !== "admin" && profile.role !== "manager") {
    redirect("/dashboard/inventory?error=permission");
  }

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "Other").trim() || "Other";
  const baseUnit = String(formData.get("base_unit") ?? "");
  const openingStockRaw = String(formData.get("opening_stock") ?? "").trim();
  const minimumStockRaw = String(formData.get("minimum_stock") ?? "").trim();
  const unitCostRaw = String(formData.get("unit_cost") ?? "").trim();
  const openingStock = Number(openingStockRaw);
  const minimumStock = Number(minimumStockRaw);
  const unitCost = Number(unitCostRaw);
  const supplierRaw = String(formData.get("supplier_id") ?? "").trim();
  const ingredientRaw = String(formData.get("ingredient_id") ?? "").trim();

  if (!name || !["g", "ml", "pcs", "portion"].includes(baseUnit)
    || !openingStockRaw || !minimumStockRaw || !unitCostRaw
    || ![openingStock, minimumStock, unitCost].every(n => Number.isFinite(n) && n >= 0)) {
    redirect("/dashboard/inventory?error=validation");
  }

  const { error } = await supabase.rpc("save_ingredient", {
    p_ingredient_id: ingredientRaw || null,
    p_name: name,
    p_category: category,
    p_base_unit: baseUnit,
    p_opening_stock: openingStock,
    p_minimum_stock: minimumStock,
    p_unit_cost: unitCost,
    p_supplier_id: supplierRaw || null,
  });

  if (error) redirect("/dashboard/inventory?error=save");
  redirect("/dashboard/inventory?saved=1");
}
