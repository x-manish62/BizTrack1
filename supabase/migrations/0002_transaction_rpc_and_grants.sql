-- BizTrack transaction module: table privileges and atomic transaction creation.
-- Run this migration in Supabase SQL Editor after 0001_initial_schema.sql.
grant select on public.profiles to authenticated;
grant select on public.shops, public.shop_members to authenticated;
grant select, insert, update, delete on public.items, public.parties to authenticated;
grant select, insert, update, delete on public.purchases, public.purchase_items, public.sales, public.sale_items, public.payments to authenticated;
grant select on public.audit_logs to authenticated;


create or replace function public.create_shop_transaction(
  p_kind text,
  p_party_name text,
  p_phone text,
  p_email text,
  p_address text,
  p_item_id uuid,
  p_quantity numeric,
  p_unit_price numeric,
  p_paid numeric,
  p_transaction_date date,
  p_payment_method text,
  p_notes text
)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_shop uuid;
  v_party uuid;
  v_item_name text;
  v_total numeric(14,2);
  v_tx_id uuid;
  v_tx_no text;
  v_full_name text;
begin
  if v_user is null then raise exception 'Sign in required'; end if;
  if p_kind not in ('purchase','sale') then raise exception 'Invalid transaction type'; end if;
  if coalesce(trim(p_party_name),'') = '' then raise exception 'Party name is required'; end if;
  if p_quantity is null or p_quantity <= 0 or p_unit_price is null or p_unit_price < 0 then raise exception 'Invalid quantity or unit price'; end if;
  v_total := round(p_quantity * p_unit_price, 2);
  if coalesce(p_paid,0) < 0 or coalesce(p_paid,0) > v_total then raise exception 'Paid amount must be between 0 and total'; end if;

  select active_shop_id, full_name into v_shop, v_full_name from public.profiles where id = v_user;
  if v_shop is null or not public.is_shop_member(v_shop) then raise exception 'Shop is not approved or assigned'; end if;
  select name into v_item_name from public.items where id=p_item_id and shop_id=v_shop and is_archived=false;
  if v_item_name is null then raise exception 'Item not found in your shop'; end if;

  select id into v_party from public.parties where shop_id=v_shop and lower(name)=lower(trim(p_party_name)) order by created_at desc limit 1;
  if v_party is null then
    insert into public.parties(shop_id,name,phone,email,address)
    values(v_shop,trim(p_party_name),nullif(trim(coalesce(p_phone,'')),''),nullif(trim(coalesce(p_email,'')),''),nullif(trim(coalesce(p_address,'')),''))
    returning id into v_party;
  else
    update public.parties set phone=coalesce(nullif(trim(coalesce(p_phone,'')),''),phone), email=coalesce(nullif(trim(coalesce(p_email,'')),''),email), address=coalesce(nullif(trim(coalesce(p_address,'')),''),address) where id=v_party;
  end if;

  v_tx_no := upper(left(p_kind,3)) || '-' || to_char(clock_timestamp(),'YYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text,1,4);
  if p_kind='purchase' then
    insert into public.purchases(shop_id,transaction_no,party_id,seller_name,seller_phone,seller_email,our_representative,receiver_name,total_amount,created_at)
    values(v_shop,v_tx_no,v_party,trim(p_party_name),coalesce(p_phone,''),coalesce(p_email,''),coalesce(v_full_name,'Shop Admin'),coalesce(v_full_name,'Shop Admin'),v_total,coalesce(p_transaction_date,current_date)::timestamp + interval '12 hours') returning id into v_tx_id;
    insert into public.purchase_items(purchase_id,item_id,item_name_snapshot,quantity,unit_price,line_total) values(v_tx_id,p_item_id,v_item_name,p_quantity,p_unit_price,v_total);
    if coalesce(p_paid,0)>0 then insert into public.payments(shop_id,direction,purchase_id,amount,payment_method,note,created_by) values(v_shop,'payable',v_tx_id,p_paid,p_payment_method,p_notes,v_user); end if;
  else
    insert into public.sales(shop_id,transaction_no,party_id,buyer_name,buyer_phone,buyer_email,our_representative,receiver_name,total_amount,created_at)
    values(v_shop,v_tx_no,v_party,trim(p_party_name),coalesce(p_phone,''),coalesce(p_email,''),coalesce(v_full_name,'Shop Admin'),coalesce(v_full_name,'Shop Admin'),v_total,coalesce(p_transaction_date,current_date)::timestamp + interval '12 hours') returning id into v_tx_id;
    insert into public.sale_items(sale_id,item_id,item_name_snapshot,quantity,unit_price,line_total) values(v_tx_id,p_item_id,v_item_name,p_quantity,p_unit_price,v_total);
    if coalesce(p_paid,0)>0 then insert into public.payments(shop_id,direction,sale_id,amount,payment_method,note,created_by) values(v_shop,'receivable',v_tx_id,p_paid,p_payment_method,p_notes,v_user); end if;
  end if;
  return v_tx_no;
end;
$$;
revoke all on function public.create_shop_transaction(text,text,text,text,text,uuid,numeric,numeric,numeric,date,text,text) from public;
grant execute on function public.create_shop_transaction(text,text,text,text,text,uuid,numeric,numeric,numeric,date,text,text) to authenticated;
