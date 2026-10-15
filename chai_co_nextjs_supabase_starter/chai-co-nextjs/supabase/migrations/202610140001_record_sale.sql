-- Chai & Co. Phase 2: atomic sale posting.
-- Apply AFTER supabase_phase1.sql, in Supabase SQL Editor.
-- The function validates the caller, prices products from the database, locks stock rows,
-- writes sale + line snapshots + stock movements, and rolls back all changes on any error.

begin;

create or replace function public.record_sale(
  p_sale_date date,
  p_reference text,
  p_payment_method public.payment_method,
  p_discount numeric,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_sale_id uuid;
  v_subtotal numeric(12,2) := 0;
  v_total numeric(12,2);
  v_discount numeric(12,2) := coalesce(p_discount, 0);
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_product public.products%rowtype;
  v_unit_cost numeric(14,5);
  v_req record;
  v_stock numeric(14,3);
  v_unit_cost_stock numeric(14,5);
begin
  if v_user_id is null or not public.is_active_user() then
    raise exception 'An active signed-in user is required';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one sale item is required';
  end if;
  if v_discount < 0 then
    raise exception 'Discount cannot be negative';
  end if;

  -- Validate all products and calculate subtotal using trusted database prices.
  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Each quantity must be a positive integer';
    end if;

    select * into v_product
    from public.products
    where id = v_product_id and is_active = true;
    if not found then
      raise exception 'Product is missing or inactive';
    end if;

    v_subtotal := v_subtotal + (v_product.selling_price * v_quantity);
  end loop;

  if v_discount > v_subtotal then
    raise exception 'Discount cannot exceed subtotal';
  end if;
  v_total := v_subtotal - v_discount;

  -- Lock each required ingredient in deterministic order and check availability.
  for v_req in
    select r.ingredient_id,
           sum(r.quantity_per_serving * (item.value->>'quantity')::integer)::numeric(14,3) as required_qty
    from jsonb_array_elements(p_items) as item(value)
    join public.recipes r on r.product_id = (item.value->>'product_id')::uuid
    group by r.ingredient_id
    order by r.ingredient_id
  loop
    select i.current_stock, i.unit_cost
      into v_stock, v_unit_cost_stock
    from public.ingredients i
    where i.id = v_req.ingredient_id and i.is_active = true
    for update;

    if not found then
      raise exception 'A recipe ingredient is missing or inactive';
    end if;
    if v_stock < v_req.required_qty then
      raise exception 'Insufficient stock for ingredient %: need %, have %',
        v_req.ingredient_id, v_req.required_qty, v_stock;
    end if;
  end loop;

  insert into public.sales (
    sale_date, reference, payment_method, subtotal, discount, total, notes, created_by
  ) values (
    coalesce(p_sale_date, current_date),
    nullif(trim(coalesce(p_reference, '')), ''),
    coalesce(p_payment_method, 'cash'::public.payment_method),
    v_subtotal, v_discount, v_total,
    nullif(trim(coalesce(p_notes, '')), ''),
    v_user_id
  ) returning id into v_sale_id;

  -- Insert immutable item snapshots and recipe cost snapshots.
  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    select * into v_product from public.products
    where id = v_product_id and is_active = true;

    select coalesce(sum(r.quantity_per_serving * i.unit_cost), 0)
      into v_unit_cost
    from public.recipes r
    join public.ingredients i on i.id = r.ingredient_id
    where r.product_id = v_product_id and i.is_active = true;

    insert into public.sale_items (
      sale_id, product_id, product_name_snapshot, quantity, unit_price, unit_cost_snapshot
    ) values (
      v_sale_id, v_product.id, v_product.name, v_quantity,
      v_product.selling_price, coalesce(v_unit_cost, 0)
    );
  end loop;

  -- Deduct aggregated recipe quantities and append immutable stock ledger entries.
  for v_req in
    select r.ingredient_id,
           sum(r.quantity_per_serving * (item.value->>'quantity')::integer)::numeric(14,3) as required_qty
    from jsonb_array_elements(p_items) as item(value)
    join public.recipes r on r.product_id = (item.value->>'product_id')::uuid
    group by r.ingredient_id
    order by r.ingredient_id
  loop
    update public.ingredients
    set current_stock = current_stock - v_req.required_qty
    where id = v_req.ingredient_id;

    insert into public.stock_movements (
      ingredient_id, movement_type, quantity_delta, unit_cost_snapshot,
      reference_table, reference_id, reason, created_by
    ) values (
      v_req.ingredient_id, 'sale'::public.stock_movement_type, -v_req.required_qty,
      coalesce((select i.unit_cost from public.ingredients i where i.id = v_req.ingredient_id), 0),
      'sales', v_sale_id, 'Recipe deduction from sale', v_user_id
    );
  end loop;

  return v_sale_id;
end;
$$;

revoke all on function public.record_sale(date, text, public.payment_method, numeric, text, jsonb) from public;
grant execute on function public.record_sale(date, text, public.payment_method, numeric, text, jsonb) to authenticated;

commit;
