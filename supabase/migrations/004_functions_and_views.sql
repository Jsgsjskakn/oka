-- ============================================================
-- Migration 004: Utility Functions & Analytics Views
-- The Golden Oak — Phase 10.1
-- Run AFTER 001, 002, 003
-- ============================================================

-- ============================================================
-- FUNCTION: audit_log (used by server-side service role only)
-- ============================================================
create or replace function public.insert_audit_log(
  p_restaurant_id uuid,
  p_actor_id uuid,
  p_actor_role text,
  p_actor_name text,
  p_action text,
  p_entity_type text,
  p_entity_id text default null,
  p_old_value jsonb default null,
  p_new_value jsonb default null
)
returns void as $$
begin
  insert into public.audit_logs (
    restaurant_id, actor_id, actor_role, actor_name,
    action, entity_type, entity_id, old_value, new_value
  ) values (
    p_restaurant_id, p_actor_id, p_actor_role, p_actor_name,
    p_action, p_entity_type, p_entity_id, p_old_value, p_new_value
  );
end;
$$ language plpgsql security definer;

-- ============================================================
-- FUNCTION: confirm_booking (atomic: confirm + assign table)
-- ============================================================
create or replace function public.confirm_booking(
  p_booking_id uuid,
  p_payment_method text,
  p_reference text default null
)
returns jsonb as $$
declare
  v_booking public.bookings%rowtype;
  v_table_id uuid;
  v_payment_id uuid;
begin
  -- Get booking with lock
  select * into v_booking from public.bookings
  where id = p_booking_id for update;
  
  if not found then
    return jsonb_build_object('error', 'Booking not found');
  end if;
  
  if v_booking.status != 'pending' then
    return jsonb_build_object('error', 'Booking is not in pending state');
  end if;
  
  -- Find available table for date+time+capacity
  select t.id into v_table_id
  from public.tables t
  where t.restaurant_id = v_booking.restaurant_id
    and t.capacity >= v_booking.guests
    and t.status = 'available'
    and t.id not in (
      select b2.table_id from public.bookings b2
      where b2.table_id is not null
        and b2.status = 'confirmed'
        and b2.booking_date = v_booking.booking_date
        and abs(extract(epoch from (b2.booking_time::time - v_booking.booking_time::time))) < 7200
        and b2.id != p_booking_id
    )
  order by t.capacity asc
  limit 1;
  
  -- Update booking
  update public.bookings set
    status = 'confirmed',
    payment_status = 'paid',
    table_id = v_table_id,
    updated_at = now()
  where id = p_booking_id;
  
  -- Mark table as booked if assigned
  if v_table_id is not null then
    update public.tables set status = 'booked', updated_at = now()
    where id = v_table_id;
  end if;
  
  -- Insert payment record
  insert into public.payments (booking_id, payment_method, amount_paise, tip_paise, status, reference)
  values (p_booking_id, p_payment_method, v_booking.advance_amount_paise, 0, 'paid', p_reference)
  returning id into v_payment_id;
  
  return jsonb_build_object(
    'success', true,
    'tableId', v_table_id,
    'paymentId', v_payment_id
  );
end;
$$ language plpgsql security definer;

-- ============================================================
-- FUNCTION: cancel_booking (atomic: cancel + release table)
-- ============================================================
create or replace function public.cancel_booking(
  p_booking_id uuid,
  p_cancelled_by text,
  p_reason text default null
)
returns jsonb as $$
declare
  v_booking public.bookings%rowtype;
begin
  select * into v_booking from public.bookings
  where id = p_booking_id for update;
  
  if not found then
    return jsonb_build_object('error', 'Booking not found');
  end if;
  
  if v_booking.status = 'cancelled' then
    return jsonb_build_object('error', 'Booking is already cancelled');
  end if;
  
  -- Release table
  if v_booking.table_id is not null then
    update public.tables set status = 'available', updated_at = now()
    where id = v_booking.table_id;
  end if;
  
  -- Cancel booking
  update public.bookings set
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_by = p_cancelled_by,
    cancellation_reason = p_reason,
    updated_at = now()
  where id = p_booking_id;
  
  return jsonb_build_object('success', true);
end;
$$ language plpgsql security definer;

-- ============================================================
-- VIEW: order_analytics_view (for analytics queries)
-- ============================================================
create or replace view public.order_analytics_view as
select
  o.id as order_id,
  o.restaurant_id,
  o.status,
  o.order_type,
  o.payment_method,
  o.subtotal_paise,
  o.tax_paise,
  o.tip_paise,
  o.total_paise,
  o.created_at,
  o.created_at::date as order_date,
  oi.id as item_id,
  oi.dish_id,
  oi.dish_name,
  oi.quantity,
  oi.line_total_paise,
  d.category_id,
  c.name as category_name,
  c.slug as category_slug
from public.orders o
join public.order_items oi on oi.order_id = o.id
left join public.dishes d on d.id = oi.dish_id
left join public.categories c on c.id = d.category_id;

-- Grant analytics view to anon (RLS applies to base tables, not views by default)
-- Analytics view only accessible via service role in analytics service
