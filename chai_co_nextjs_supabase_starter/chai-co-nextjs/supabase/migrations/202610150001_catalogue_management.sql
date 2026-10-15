-- Chai & Co. Phase 3: trusted catalogue and recipe editing.
-- Apply after supabase_phase1.sql and the existing record_sale migration.
-- All writes are role-checked and run atomically inside PostgreSQL.

begin;

create or replace function public.save_ingredient(
  p_ingredient_id uuid,
  p_name text,
  p_category text,
  p_base_unit text,
  p_opening_stock numeric,
  p_minimum_stock numeric,
  p_unit_cost numeric,
  p_supplier_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
  v_old_unit text;
  v_stock numeric(14,3);
begin
  if v_user_id is null or not public.is_active_user()
     or not public.has_any_role(array['admin','manager']::public.app_role[]) then
    raise exception 'Only active admins or managers may manage ingredients';
  end if;
  if nullif(trim(coalesce(p_name, '')), '') is null then
    raise exception 'Ingredient name is required';
  end if;
  if p_base_unit not in ('g','ml','pcs','portion') then
    raise exception 'Choose a supported base unit';
  end if;
  if coalesce(p_opening_stock, 0) < 0 or coalesce(p_minimum_stock, 0) < 0
     or coalesce(p_unit_cost, 0) < 0 then
    raise exception 'Stock, minimum stock and unit cost cannot be negative';
  end if;
  if p_supplier_id is not null and not exists (
    select 1 from public.suppliers where id = p_supplier_id and is_active = true
  ) then
    raise exception 'Selected supplier is missing or inactive';
  end if;

  if p_ingredient_id is null then
    v_stock := coalesce(p_opening_stock, 0);
    insert into public.ingredients (
      name, category, base_unit, current_stock, minimum_stock, unit_cost, supplier_id, created_by
    ) values (
      trim(p_name), coalesce(nullif(trim(p_category), ''), 'Other'), p_base_unit,
      v_stock, coalesce(p_minimum_stock, 0), coalesce(p_unit_cost, 0), p_supplier_id, v_user_id
    ) returning id into v_id;

    if v_stock > 0 then
      insert into public.stock_movements (
        ingredient_id, movement_type, quantity_delta, unit_cost_snapshot,
        reason, created_by
      ) values (
        v_id, 'opening_stock'::public.stock_movement_type, v_stock,
        coalesce(p_unit_cost, 0), 'Initial stock on ingredient creation', v_user_id
      );
    end if;
  else
    select base_unit into v_old_unit
    from public.ingredients
    where id = p_ingredient_id and is_active = true
    for update;
    if not found then
      raise exception 'Ingredient not found or inactive';
    end if;
    if v_old_unit is distinct from p_base_unit and exists (
      select 1 from public.recipes where ingredient_id = p_ingredient_id
    ) then
      raise exception 'Base unit cannot be changed while the ingredient is used in a recipe';
    end if;

    update public.ingredients
    set name = trim(p_name),
        category = coalesce(nullif(trim(p_category), ''), 'Other'),
        base_unit = p_base_unit,
        minimum_stock = coalesce(p_minimum_stock, 0),
        unit_cost = coalesce(p_unit_cost, 0),
        supplier_id = p_supplier_id,
        updated_at = now()
    where id = p_ingredient_id;
    v_id := p_ingredient_id;
  end if;

  return v_id;
end;
$$;

create or replace function public.save_product_recipe(
  p_product_id uuid,
  p_name text,
  p_category text,
  p_selling_price numeric,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_product_id uuid := p_product_id;
  v_item jsonb;
  v_ingredient_id uuid;
  v_quantity numeric(14,3);
begin
  if v_user_id is null or not public.is_active_user()
     or not public.has_any_role(array['admin','manager']::public.app_role[]) then
    raise exception 'Only active admins or managers may manage menu items and recipes';
  end if;
  if nullif(trim(coalesce(p_name, '')), '') is null then
    raise exception 'Menu item name is required';
  end if;
  if p_selling_price is null or p_selling_price < 0 then
    raise exception 'Selling price cannot be negative';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Recipe items must be a list';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) as item(value)
    where nullif(item.value->>'ingredient_id', '') is null
       or coalesce((item.value->>'quantity_per_serving')::numeric, 0) <= 0
  ) then
    raise exception 'Every recipe line needs an ingredient and a positive quantity';
  end if;

  if (
    select count(*) from jsonb_array_elements(p_items)
  ) <> (
    select count(distinct (item.value->>'ingredient_id')::uuid)
    from jsonb_array_elements(p_items) as item(value)
  ) then
    raise exception 'Each ingredient may appear only once in a recipe';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_items) as item(value)
    left join public.ingredients i
      on i.id = (item.value->>'ingredient_id')::uuid and i.is_active = true
    where i.id is null
  ) then
    raise exception 'A selected ingredient is missing or inactive';
  end if;

  if v_product_id is null then
    insert into public.products (name, category, selling_price, created_by)
    values (trim(p_name), coalesce(nullif(trim(p_category), ''), 'Other'), p_selling_price, v_user_id)
    returning id into v_product_id;
  else
    update public.products
    set name = trim(p_name),
        category = coalesce(nullif(trim(p_category), ''), 'Other'),
        selling_price = p_selling_price,
        updated_at = now()
    where id = v_product_id and is_active = true;
    if not found then
      raise exception 'Menu item not found or inactive';
    end if;
  end if;

  delete from public.recipes r
  where r.product_id = v_product_id
    and not exists (
      select 1 from jsonb_array_elements(p_items) as item(value)
      where (item.value->>'ingredient_id')::uuid = r.ingredient_id
    );

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_ingredient_id := (v_item->>'ingredient_id')::uuid;
    v_quantity := (v_item->>'quantity_per_serving')::numeric;
    insert into public.recipes (product_id, ingredient_id, quantity_per_serving)
    values (v_product_id, v_ingredient_id, v_quantity)
    on conflict (product_id, ingredient_id)
    do update set quantity_per_serving = excluded.quantity_per_serving, updated_at = now();
  end loop;

  return v_product_id;
end;
$$;


revoke all on function public.save_ingredient(uuid, text, text, text, numeric, numeric, numeric, uuid) from public;
revoke all on function public.save_product_recipe(uuid, text, text, numeric, jsonb) from public;
grant execute on function public.save_ingredient(uuid, text, text, text, numeric, numeric, numeric, uuid) to authenticated;
grant execute on function public.save_product_recipe(uuid, text, text, numeric, jsonb) to authenticated;

commit;
