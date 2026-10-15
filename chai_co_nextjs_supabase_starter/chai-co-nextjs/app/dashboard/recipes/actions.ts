"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveProductRecipe(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login?error=inactive");
  if (profile.role !== "admin" && profile.role !== "manager") {
    redirect("/dashboard/recipes?error=permission");
  }

  const productRaw = String(formData.get("product_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "Other").trim() || "Other";
  const priceRaw = String(formData.get("selling_price") ?? "").trim();
  const price = Number(priceRaw);
  if (!name || !priceRaw || !Number.isFinite(price) || price < 0) {
    redirect(productRaw ? `/dashboard/recipes/${productRaw}?error=validation` : "/dashboard/recipes?error=validation");
  }

  const items: { ingredient_id: string; quantity_per_serving: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("qty_")) continue;
    const raw = String(value).trim();
    if (!raw) continue;
    const quantity = Number(raw);
    if (!Number.isFinite(quantity) || quantity < 0) {
      redirect(productRaw ? `/dashboard/recipes/${productRaw}?error=quantity` : "/dashboard/recipes?error=quantity");
    }
    if (quantity === 0) continue; // A zero quantity removes this ingredient from the saved recipe.
    items.push({ ingredient_id: key.slice(4), quantity_per_serving: quantity });
  }

  const { data: productId, error } = await supabase.rpc("save_product_recipe", {
    p_product_id: productRaw || null,
    p_name: name,
    p_category: category,
    p_selling_price: price,
    p_items: items,
  });

  if (error || !productId) {
    redirect(productRaw ? `/dashboard/recipes/${productRaw}?error=save` : "/dashboard/recipes?error=save");
  }
  redirect(`/dashboard/recipes/${productId}?saved=1`);
}

 
export async function deleteProduct(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login?error=inactive");
  if (profile.role !== "admin" && profile.role !== "manager") {
    redirect("/dashboard/recipes?error=permission");
  }

  const productId = String(formData.get("id") ?? "").trim();
  if (!productId) redirect("/dashboard/recipes?error=delete");

  const { error } = await supabase.rpc("deactivate_product", {
    p_product_id: productId,
  });
  if (error) redirect("/dashboard/recipes?error=delete");
  redirect("/dashboard/recipes?deleted=1");
}
