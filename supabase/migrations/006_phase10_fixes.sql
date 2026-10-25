-- Migration 006: Phase 10 Fixes

-- 1. Add user_id to orders and bookings
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Add RLS policies for customers
CREATE POLICY "Customers can view own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Customers can view own bookings" ON public.bookings FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Customers can update own pending bookings" ON public.bookings FOR UPDATE TO authenticated USING (user_id = auth.uid() AND status = 'pending');

-- 3. Add hold_expires_at to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMP WITH TIME ZONE;

-- 4. Add booking_hold_minutes to restaurant_settings
INSERT INTO public.restaurant_settings (restaurant_id, key, value)
VALUES ('a1b2c3d4-0000-0000-0000-000000000001', 'booking_hold_minutes', '5'::jsonb)
ON CONFLICT (restaurant_id, key) DO NOTHING;

-- 5. Fix confirm_booking and cancel_booking logic
-- Remove the update to public.tables status
CREATE OR REPLACE FUNCTION public.confirm_booking(
  p_booking_id uuid,
  p_payment_method text,
  p_reference text default null
)
RETURNS jsonb AS $$
DECLARE
  v_booking public.bookings%rowtype;
  v_table_id uuid;
  v_payment_id uuid;
BEGIN
  -- Get booking with lock
  SELECT * INTO v_booking FROM public.bookings
  WHERE id = p_booking_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Booking not found');
  END IF;
  
  IF v_booking.status != 'pending' THEN
    RETURN jsonb_build_object('error', 'Booking is not in pending state');
  END IF;
  
  -- Find available table for date+time+capacity
  SELECT t.id INTO v_table_id
  FROM public.tables t
  WHERE t.restaurant_id = v_booking.restaurant_id
    AND t.capacity >= v_booking.guests
    AND t.status = 'available'
    AND t.id NOT IN (
      SELECT b2.table_id FROM public.bookings b2
      WHERE b2.table_id IS NOT NULL
        AND b2.status = 'confirmed'
        AND b2.booking_date = v_booking.booking_date
        AND abs(extract(epoch from (b2.booking_time::time - v_booking.booking_time::time))) < 7200
        AND b2.id != p_booking_id
    )
  ORDER BY t.capacity ASC
  LIMIT 1;
  
  -- Update booking
  UPDATE public.bookings SET
    status = 'confirmed',
    payment_status = 'paid',
    table_id = v_table_id,
    updated_at = now()
  WHERE id = p_booking_id;
  
  -- Insert payment record
  INSERT INTO public.payments (booking_id, payment_method, amount_paise, tip_paise, status, reference)
  VALUES (p_booking_id, p_payment_method, v_booking.advance_amount_paise, 0, 'paid', p_reference)
  RETURNING id INTO v_payment_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tableId', v_table_id,
    'paymentId', v_payment_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.cancel_booking(
  p_booking_id uuid,
  p_cancelled_by text,
  p_reason text default null
)
RETURNS jsonb AS $$
DECLARE
  v_booking public.bookings%rowtype;
BEGIN
  SELECT * INTO v_booking FROM public.bookings
  WHERE id = p_booking_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Booking not found');
  END IF;
  
  IF v_booking.status = 'cancelled' THEN
    RETURN jsonb_build_object('error', 'Booking is already cancelled');
  END IF;
  
  -- Cancel booking
  UPDATE public.bookings SET
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_by = p_cancelled_by,
    cancellation_reason = p_reason,
    updated_at = now()
  WHERE id = p_booking_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
