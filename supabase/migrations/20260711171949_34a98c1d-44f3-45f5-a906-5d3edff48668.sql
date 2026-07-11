
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'technician');
CREATE TYPE public.asset_status AS ENUM ('operational','issue_reported','under_inspection','under_maintenance','out_of_service','retired');
CREATE TYPE public.issue_priority AS ENUM ('low','medium','high','critical');
CREATE TYPE public.issue_status AS ENUM ('reported','assigned','inspection_started','maintenance_in_progress','waiting_for_parts','resolved','closed','reopened');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Profiles RLS
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User roles RLS
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role public.app_role;
  _is_first BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);

  -- First user becomes admin; otherwise use requested role from metadata (technician default)
  SELECT NOT EXISTS(SELECT 1 FROM public.user_roles) INTO _is_first;
  IF _is_first THEN
    _role := 'admin';
  ELSE
    _role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role','')::public.app_role, 'technician');
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ ASSETS ============
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  location TEXT,
  condition TEXT,
  status public.asset_status NOT NULL DEFAULT 'operational',
  assigned_technician_id UUID REFERENCES public.profiles(id),
  last_service_date DATE,
  next_service_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT ALL ON public.assets TO service_role;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage assets" ON public.assets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Technicians read all assets" ON public.assets FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'technician'));
CREATE POLICY "Technicians update assigned assets" ON public.assets FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'technician') AND assigned_technician_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'technician') AND assigned_technician_id = auth.uid());

-- Public view (safe columns only)
CREATE OR REPLACE VIEW public.public_assets
WITH (security_invoker = false) AS
SELECT id, asset_code, name, category, location, condition, status, last_service_date, next_service_date
FROM public.assets;
GRANT SELECT ON public.public_assets TO anon, authenticated;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER assets_set_updated_at BEFORE UPDATE ON public.assets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ISSUES ============
CREATE SEQUENCE public.issue_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_issue_number()
RETURNS TEXT LANGUAGE sql AS $$
  SELECT 'ISS-' || LPAD(nextval('public.issue_number_seq')::text, 5, '0');
$$;

CREATE TABLE public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number TEXT NOT NULL UNIQUE DEFAULT public.generate_issue_number(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  priority public.issue_priority NOT NULL DEFAULT 'medium',
  status public.issue_status NOT NULL DEFAULT 'reported',
  reporter_name TEXT,
  reporter_contact TEXT,
  assigned_technician_id UUID REFERENCES public.profiles(id),
  ai_suggested_title TEXT,
  ai_suggested_category TEXT,
  ai_suggested_priority TEXT,
  ai_possible_causes JSONB,
  ai_initial_checks JSONB,
  ai_was_edited BOOLEAN NOT NULL DEFAULT false,
  evidence_urls TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.issues TO authenticated;
GRANT SELECT, INSERT ON public.issues TO anon;
GRANT ALL ON public.issues TO service_role;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Public: can insert (report) an issue, and look up by issue_number
CREATE POLICY "Anyone can report issue" ON public.issues FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can lookup issue" ON public.issues FOR SELECT TO anon USING (true);
-- Note: anon SELECT is broad because we don't have session tracking for reporters.
-- Users lookup by knowing the unique issue_number (like a receipt). Safe columns only via app.

CREATE POLICY "Admins manage all issues" ON public.issues FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Technicians read assigned issues" ON public.issues FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'technician') AND assigned_technician_id = auth.uid());
CREATE POLICY "Technicians update assigned issues" ON public.issues FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'technician') AND assigned_technician_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'technician') AND assigned_technician_id = auth.uid());

-- ============ MAINTENANCE RECORDS ============
CREATE TABLE public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES public.profiles(id),
  inspection_notes TEXT,
  work_performed TEXT,
  parts_used TEXT,
  cost NUMERIC CHECK (cost >= 0),
  evidence_urls TEXT[],
  final_condition TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.maintenance_records TO authenticated;
GRANT ALL ON public.maintenance_records TO service_role;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all maintenance" ON public.maintenance_records FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Technicians read own maintenance" ON public.maintenance_records FOR SELECT TO authenticated
  USING (technician_id = auth.uid());
CREATE POLICY "Assigned tech or admin inserts maintenance" ON public.maintenance_records FOR INSERT TO authenticated
  WITH CHECK (
    technician_id = auth.uid() AND (
      public.has_role(auth.uid(),'admin') OR
      EXISTS (SELECT 1 FROM public.issues i WHERE i.id = issue_id AND i.assigned_technician_id = auth.uid())
    )
  );

-- ============ ASSET HISTORY ============
CREATE TABLE public.asset_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id),
  actor_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.asset_history TO anon, authenticated;
GRANT ALL ON public.asset_history TO service_role;
ALTER TABLE public.asset_history ENABLE ROW LEVEL SECURITY;
-- No INSERT/UPDATE/DELETE policies -> only triggers (SECURITY DEFINER) can write
CREATE POLICY "Anyone reads asset history" ON public.asset_history FOR SELECT TO anon, authenticated USING (true);

-- ============ HISTORY TRIGGERS ============
CREATE OR REPLACE FUNCTION public.log_issue_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.asset_history(asset_id, issue_id, action, actor_id, actor_name)
  VALUES (NEW.asset_id, NEW.id, 'Issue reported: ' || NEW.issue_number, auth.uid(), COALESCE(NEW.reporter_name,'Public reporter'));
  -- flip asset status to issue_reported unless in maintenance already
  UPDATE public.assets SET status = 'issue_reported'
   WHERE id = NEW.asset_id AND status IN ('operational');
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_issue_created AFTER INSERT ON public.issues
FOR EACH ROW EXECUTE FUNCTION public.log_issue_created();

CREATE OR REPLACE FUNCTION public.log_issue_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.asset_history(asset_id, issue_id, action, actor_id)
    VALUES (NEW.asset_id, NEW.id, 'Issue ' || NEW.issue_number || ' status → ' || NEW.status, auth.uid());
    IF NEW.status = 'resolved' AND NEW.resolved_at IS NULL THEN
      NEW.resolved_at = now();
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_issue_status_change BEFORE UPDATE ON public.issues
FOR EACH ROW EXECUTE FUNCTION public.log_issue_status_change();

CREATE OR REPLACE FUNCTION public.log_asset_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.asset_history(asset_id, action, actor_id)
    VALUES (NEW.id, 'Asset status → ' || NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_asset_status_change AFTER UPDATE ON public.assets
FOR EACH ROW EXECUTE FUNCTION public.log_asset_status_change();

CREATE OR REPLACE FUNCTION public.log_maintenance_added()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _asset UUID;
BEGIN
  SELECT asset_id INTO _asset FROM public.issues WHERE id = NEW.issue_id;
  INSERT INTO public.asset_history(asset_id, issue_id, action, actor_id)
  VALUES (_asset, NEW.issue_id, 'Maintenance record added', NEW.technician_id);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_maintenance_added AFTER INSERT ON public.maintenance_records
FOR EACH ROW EXECUTE FUNCTION public.log_maintenance_added();

-- ============ INDEXES ============
CREATE INDEX idx_issues_asset ON public.issues(asset_id);
CREATE INDEX idx_issues_tech ON public.issues(assigned_technician_id);
CREATE INDEX idx_issues_status ON public.issues(status);
CREATE INDEX idx_assets_status ON public.assets(status);
CREATE INDEX idx_history_asset ON public.asset_history(asset_id);
