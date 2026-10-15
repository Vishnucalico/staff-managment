-- Chai & Co. Phase 3 follow-up: safe catalogue deletion.
-- Soft-deletes records so sales, recipes and stock movement history remain intact.
-- Apply after 202610150001_catalogue_management.sql.

begin;

create or replace function public.deactivate_ingredient(p_ingredient_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_active_user()
     or not public.has_any_role(array['admin','manager']::public.app_role[]) then
    raise exception 'Only active admins or managers may delete ingredients';
  end if;

  perform 1 from public.ingredients
  where id = p_ingredient_id and is_active = true
  for update;
  if not found then
    raise exception 'Ingredient not found or already deleted';
  end if;

  if exists (
    select 1
    from public.recipes r
    join public.products p on p.id = r.product_id
    where r.ingredient_id = p_ingredient_id and p.is_active = true
  ) then
    raise exception 'Remove this ingredient from active recipes before deleting it';
  end if;

  update public.ingredients
  set is_active = false, updated_at = now()
  where id = p_ingredient_id;
end;
$$;

create or replace function public.deactivate_product(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_active_user()
     or not public.has_any_role(array['admin','manager']::public.app_role[]) then
    raise exception 'Only active admins or managers may delete menu items';
  end if;

  update public.products
  set is_active = false, updated_at = now()
  where id = p_product_id and is_active = true;

  if not found then
    raise exception 'Menu item not found or already deleted';
  end if;
end;
$$;

revoke all on function public.deactivate_ingredient(uuid) from public;
revoke all on function public.deactivate_product(uuid) from public;
grant execute on function public.deactivate_ingredient(uuid) to authenticated;
grant execute on function public.deactivate_product(uuid) to authenticated;

commit;
