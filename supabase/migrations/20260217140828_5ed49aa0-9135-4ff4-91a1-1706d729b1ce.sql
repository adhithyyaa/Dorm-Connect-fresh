
-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone authenticated can create SOS" ON public.sos_alerts;
DROP POLICY IF EXISTS "Anyone can create anonymous SOS" ON public.sos_alerts;

-- Replace with tighter policies
CREATE POLICY "Authenticated users can create SOS" ON public.sos_alerts 
FOR INSERT TO authenticated WITH CHECK (triggered_by = auth.uid());

CREATE POLICY "Anonymous SOS via edge function only" ON public.sos_alerts
FOR INSERT TO anon WITH CHECK (is_anonymous = true AND triggered_by IS NULL);
