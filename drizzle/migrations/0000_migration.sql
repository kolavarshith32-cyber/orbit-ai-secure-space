
CREATE TYPE public.org_role AS ENUM ('owner','admin','member','viewer');
CREATE TYPE public.message_role AS ENUM ('system','user','assistant');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  slug text NOT NULL UNIQUE,
  industry text,
  company_size text,
  workspace_name text NOT NULL DEFAULT 'Main workspace',
  assistant_name text NOT NULL DEFAULT 'Orbit',
  system_prompt text NOT NULL DEFAULT '',
  ai_model text NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.org_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
CREATE INDEX ON public.organization_members(user_id);
GRANT SELECT, DELETE ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.conversations(organization_id, user_id, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  role public.message_role NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.messages(conversation_id, created_at);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  file_type text NOT NULL DEFAULT '',
  processing_status text NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending','ready','failed','stored')),
  content text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.documents(organization_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.usage_events(organization_id, created_at DESC);
GRANT SELECT, INSERT ON public.usage_events TO authenticated;
GRANT ALL ON public.usage_events TO service_role;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.org_role_of(_org uuid)
RETURNS public.org_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.organization_members WHERE organization_id = _org AND user_id = auth.uid()
$$;
CREATE OR REPLACE FUNCTION public.is_org_member(_org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = _org AND user_id = auth.uid())
$$;
CREATE OR REPLACE FUNCTION public.has_org_role(_org uuid, _roles public.org_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = _org AND user_id = auth.uid() AND role = ANY(_roles))
$$;
CREATE OR REPLACE FUNCTION public.shares_org_with(_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members a JOIN public.organization_members b ON a.organization_id = b.organization_id
    WHERE a.user_id = auth.uid() AND b.user_id = _user)
$$;
REVOKE ALL ON FUNCTION public.org_role_of(uuid), public.is_org_member(uuid), public.has_org_role(uuid, public.org_role[]), public.shares_org_with(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.org_role_of(uuid), public.is_org_member(uuid), public.has_org_role(uuid, public.org_role[]), public.shares_org_with(uuid) TO authenticated;

CREATE POLICY "profiles read self or teammates" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.shares_org_with(id));
CREATE POLICY "profiles insert self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles update self" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "orgs read members" ON public.organizations FOR SELECT TO authenticated USING (public.is_org_member(id));
CREATE POLICY "orgs update admins" ON public.organizations FOR UPDATE TO authenticated USING (public.has_org_role(id, ARRAY['owner','admin']::public.org_role[])) WITH CHECK (public.has_org_role(id, ARRAY['owner','admin']::public.org_role[]));

CREATE POLICY "members read same org" ON public.organization_members FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "members removed by admins or self-leave" ON public.organization_members FOR DELETE TO authenticated USING (
  role <> 'owner' AND (user_id = auth.uid()
    OR public.has_org_role(organization_id, ARRAY['owner']::public.org_role[])
    OR (public.has_org_role(organization_id, ARRAY['admin']::public.org_role[]) AND role IN ('member','viewer'))));

CREATE POLICY "conv read own" ON public.conversations FOR SELECT TO authenticated USING (user_id = auth.uid() AND public.is_org_member(organization_id));
CREATE POLICY "conv insert own" ON public.conversations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.has_org_role(organization_id, ARRAY['owner','admin','member']::public.org_role[]));
CREATE POLICY "conv update own" ON public.conversations FOR UPDATE TO authenticated USING (user_id = auth.uid() AND public.has_org_role(organization_id, ARRAY['owner','admin','member']::public.org_role[])) WITH CHECK (user_id = auth.uid() AND public.is_org_member(organization_id));
CREATE POLICY "conv delete own" ON public.conversations FOR DELETE TO authenticated USING (user_id = auth.uid() AND public.is_org_member(organization_id));

CREATE POLICY "msg read via conv" ON public.messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.organization_id = messages.organization_id AND c.user_id = auth.uid())
  AND public.is_org_member(organization_id));
CREATE POLICY "msg insert via conv" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  (user_id = auth.uid() OR (user_id IS NULL AND role = 'assistant'))
  AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.organization_id = messages.organization_id AND c.user_id = auth.uid())
  AND public.has_org_role(organization_id, ARRAY['owner','admin','member']::public.org_role[]));

CREATE POLICY "docs read members" ON public.documents FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "docs insert writers" ON public.documents FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid() AND public.has_org_role(organization_id, ARRAY['owner','admin','member']::public.org_role[]) AND storage_path LIKE organization_id::text || '/%');
CREATE POLICY "docs update uploader or admin" ON public.documents FOR UPDATE TO authenticated USING ((uploaded_by = auth.uid() AND public.has_org_role(organization_id, ARRAY['owner','admin','member']::public.org_role[])) OR public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[])) WITH CHECK (public.is_org_member(organization_id) AND storage_path LIKE organization_id::text || '/%');
CREATE POLICY "docs delete uploader or admin" ON public.documents FOR DELETE TO authenticated USING ((uploaded_by = auth.uid() AND public.has_org_role(organization_id, ARRAY['owner','admin','member']::public.org_role[])) OR public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[]));

CREATE POLICY "usage read admins or own" ON public.usage_events FOR SELECT TO authenticated USING (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[]) OR (user_id = auth.uid() AND public.is_org_member(organization_id)));
CREATE POLICY "usage insert own" ON public.usage_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.is_org_member(organization_id));

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.create_organization(_name text, _industry text, _company_size text, _workspace_name text, _assistant_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _id uuid; _slug text; _base text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF coalesce(trim(_name),'') = '' OR length(_name) > 120 THEN RAISE EXCEPTION 'Invalid company name'; END IF;
  IF (SELECT count(*) FROM public.organization_members WHERE user_id = _uid AND role = 'owner') >= 5 THEN RAISE EXCEPTION 'Workspace limit reached'; END IF;
  INSERT INTO public.profiles (id) VALUES (_uid) ON CONFLICT DO NOTHING;
  _base := trim(both '-' from regexp_replace(lower(_name), '[^a-z0-9]+', '-', 'g'));
  IF _base = '' THEN _base := 'org'; END IF;
  _slug := left(_base, 40) || '-' || substr(md5(random()::text), 1, 6);
  INSERT INTO public.organizations (name, slug, industry, company_size, workspace_name, assistant_name)
  VALUES (trim(_name), _slug, nullif(trim(_industry),''), nullif(trim(_company_size),''),
          coalesce(nullif(trim(_workspace_name),''), 'Main workspace'), coalesce(nullif(left(trim(_assistant_name),40),''), 'Orbit'))
  RETURNING id INTO _id;
  INSERT INTO public.organization_members (organization_id, user_id, role) VALUES (_id, _uid, 'owner');
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.add_member_by_email(_org uuid, _email text, _role public.org_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _caller public.org_role; _target uuid;
BEGIN
  _caller := public.org_role_of(_org);
  IF _caller IS NULL OR _caller NOT IN ('owner','admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF _role = 'owner' THEN RAISE EXCEPTION 'Cannot assign owner'; END IF;
  IF _caller = 'admin' AND _role = 'admin' THEN RAISE EXCEPTION 'Only owners can add admins'; END IF;
  SELECT id INTO _target FROM auth.users WHERE lower(email) = lower(trim(_email));
  IF _target IS NULL THEN RAISE EXCEPTION 'No Orbit AI account exists for that email. Ask them to sign up first.'; END IF;
  INSERT INTO public.profiles (id) VALUES (_target) ON CONFLICT DO NOTHING;
  INSERT INTO public.organization_members (organization_id, user_id, role) VALUES (_org, _target, _role);
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'User is already a member';
END $$;

CREATE OR REPLACE FUNCTION public.set_member_role(_member_id uuid, _role public.org_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _m public.organization_members; _caller public.org_role;
BEGIN
  SELECT * INTO _m FROM public.organization_members WHERE id = _member_id;
  IF _m.id IS NULL THEN RAISE EXCEPTION 'Not found'; END IF;
  _caller := public.org_role_of(_m.organization_id);
  IF _m.user_id = auth.uid() THEN RAISE EXCEPTION 'You cannot change your own role'; END IF;
  IF _role = 'owner' OR _m.role = 'owner' THEN RAISE EXCEPTION 'Owner role cannot be changed here'; END IF;
  IF _caller = 'owner' THEN NULL;
  ELSIF _caller = 'admin' AND _m.role IN ('member','viewer') AND _role IN ('member','viewer') THEN NULL;
  ELSE RAISE EXCEPTION 'Not allowed'; END IF;
  UPDATE public.organization_members SET role = _role WHERE id = _member_id;
END $$;

CREATE OR REPLACE FUNCTION public.list_org_members(_org uuid)
RETURNS TABLE(id uuid, user_id uuid, role public.org_role, full_name text, email text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_org_member(_org) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  RETURN QUERY SELECT m.id, m.user_id, m.role, p.full_name, u.email::text, m.created_at
    FROM public.organization_members m JOIN public.profiles p ON p.id = m.user_id JOIN auth.users u ON u.id = m.user_id
    WHERE m.organization_id = _org ORDER BY m.created_at;
END $$;

REVOKE ALL ON FUNCTION public.create_organization(text,text,text,text,text), public.add_member_by_email(uuid,text,public.org_role), public.set_member_role(uuid,public.org_role), public.list_org_members(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_organization(text,text,text,text,text), public.add_member_by_email(uuid,text,public.org_role), public.set_member_role(uuid,public.org_role), public.list_org_members(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.safe_uuid(_t text) RETURNS uuid LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
BEGIN RETURN _t::uuid; EXCEPTION WHEN others THEN RETURN NULL; END $$;

CREATE POLICY "org docs read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents' AND public.is_org_member(public.safe_uuid((storage.foldername(name))[1])));
CREATE POLICY "org docs upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents' AND public.has_org_role(public.safe_uuid((storage.foldername(name))[1]), ARRAY['owner','admin','member']::public.org_role[]));
CREATE POLICY "org docs delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents' AND public.has_org_role(public.safe_uuid((storage.foldername(name))[1]), ARRAY['owner','admin','member']::public.org_role[]));
