
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('student', 'admin', 'primary_admin');

-- Create approval status enum
CREATE TYPE public.approval_status AS ENUM ('approved', 'pending', 'rejected');

-- Create complaint status enum  
CREATE TYPE public.complaint_status AS ENUM ('pending', 'resolved', 'declined');

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  approval_status approval_status NOT NULL DEFAULT 'approved',
  UNIQUE (user_id, role)
);

-- Student details table
CREATE TABLE public.student_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  roll_no TEXT NOT NULL,
  room_no TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Complaints table
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_name TEXT NOT NULL,
  room_no TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  complaint_image_url TEXT,
  resolution_description TEXT,
  resolution_image_url TEXT,
  status complaint_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

-- SOS Alerts table
CREATE TABLE public.sos_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_no TEXT NOT NULL,
  triggered_by UUID REFERENCES auth.users(id),
  triggered_by_name TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable realtime for SOS alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role AND approval_status = 'approved'
  )
$$;

-- Check if user is admin or primary_admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'primary_admin') AND approval_status = 'approved'
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));

-- User roles policies
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Primary admin can update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'primary_admin'));

-- Student details policies
CREATE POLICY "Students can view own details" ON public.student_details FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students can insert own details" ON public.student_details FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students can update own details" ON public.student_details FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all student details" ON public.student_details FOR SELECT USING (public.is_admin(auth.uid()));

-- Complaints policies
CREATE POLICY "Students can view own complaints" ON public.complaints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students can insert own complaints" ON public.complaints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all complaints" ON public.complaints FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update complaints" ON public.complaints FOR UPDATE USING (public.is_admin(auth.uid()));

-- SOS alerts policies
CREATE POLICY "Anyone authenticated can create SOS" ON public.sos_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create anonymous SOS" ON public.sos_alerts FOR INSERT WITH CHECK (triggered_by IS NULL AND is_anonymous = true);
CREATE POLICY "Admins can view SOS alerts" ON public.sos_alerts FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view own SOS" ON public.sos_alerts FOR SELECT USING (auth.uid() = triggered_by);

-- Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage buckets for images
INSERT INTO storage.buckets (id, name, public) VALUES ('complaint-images', 'complaint-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('resolution-images', 'resolution-images', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload complaint images"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'complaint-images' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view complaint images"
ON storage.objects FOR SELECT USING (bucket_id = 'complaint-images');

CREATE POLICY "Authenticated users can upload resolution images"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resolution-images' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view resolution images"
ON storage.objects FOR SELECT USING (bucket_id = 'resolution-images');
