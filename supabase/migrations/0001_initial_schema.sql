create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'user' check (role in ('user', 'reviewer', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.tracked_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  website_url text,
  description text,
  category text,
  status text not null default 'active' check (status in ('active', 'paused', 'draft', 'archived')),
  overall_risk_score numeric,
  overall_risk_level text,
  last_checked_at timestamptz,
  last_changed_at timestamptz,
  subscriber_count integer not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.policy_documents (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.tracked_services(id) on delete cascade,
  document_type text not null,
  title text,
  url text not null,
  status text not null default 'active' check (status in ('active', 'paused', 'draft', 'archived')),
  scan_frequency text not null default 'daily' check (scan_frequency in ('daily', 'weekly', 'monthly', 'manual')),
  last_checked_at timestamptz,
  last_changed_at timestamptz,
  latest_snapshot_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.policy_snapshots (
  id uuid primary key default gen_random_uuid(),
  policy_document_id uuid not null references public.policy_documents(id) on delete cascade,
  fetched_url text,
  raw_html text,
  cleaned_text text not null,
  content_hash text not null,
  effective_date date,
  detected_title text,
  fetched_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.policy_documents
  add constraint policy_documents_latest_snapshot_fk
  foreign key (latest_snapshot_id) references public.policy_snapshots(id) on delete set null;

create table public.policy_changes (
  id uuid primary key default gen_random_uuid(),
  policy_document_id uuid not null references public.policy_documents(id) on delete cascade,
  old_snapshot_id uuid references public.policy_snapshots(id),
  new_snapshot_id uuid references public.policy_snapshots(id),
  change_summary text,
  risk_impact_score numeric,
  risk_impact_level text,
  status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'rejected', 'published', 'ignored')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz default now()
);

create table public.policy_change_findings (
  id uuid primary key default gen_random_uuid(),
  policy_change_id uuid not null references public.policy_changes(id) on delete cascade,
  category text not null,
  severity text not null,
  confidence numeric,
  title text not null,
  what_changed text,
  before_text text,
  after_text text,
  explanation text,
  user_impact text,
  created_at timestamptz default now()
);

create table public.risk_reports (
  id uuid primary key default gen_random_uuid(),
  policy_document_id uuid not null references public.policy_documents(id) on delete cascade,
  snapshot_id uuid not null references public.policy_snapshots(id) on delete cascade,
  overall_score numeric not null,
  overall_level text not null,
  summary text,
  plain_english_summary text,
  confidence numeric,
  status text not null default 'draft' check (status in ('draft', 'published', 'rejected')),
  created_at timestamptz default now(),
  published_at timestamptz
);

create table public.risk_findings (
  id uuid primary key default gen_random_uuid(),
  risk_report_id uuid not null references public.risk_reports(id) on delete cascade,
  category text not null,
  severity text not null,
  score numeric not null,
  confidence numeric,
  title text not null,
  evidence text[],
  explanation text,
  user_impact text,
  mitigation text,
  created_at timestamptz default now()
);

create table public.user_service_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid not null references public.tracked_services(id) on delete cascade,
  notify_email boolean not null default true,
  notify_in_app boolean not null default true,
  created_at timestamptz default now(),
  unique(user_id, service_id)
);

create table public.tracking_suggestions (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid references public.profiles(id) on delete set null,
  company_name text not null,
  website_url text,
  terms_url text,
  privacy_url text,
  category text,
  reason text,
  notes text,
  duplicate_reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'already_tracked', 'needs_more_info')),
  admin_notes text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_service_id uuid references public.tracked_services(id),
  created_at timestamptz default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid references public.tracked_services(id) on delete cascade,
  policy_change_id uuid references public.policy_changes(id) on delete cascade,
  title text not null,
  message text not null,
  read_at timestamptz,
  emailed_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, policy_change_id)
);

create table public.scan_logs (
  id uuid primary key default gen_random_uuid(),
  policy_document_id uuid references public.policy_documents(id) on delete cascade,
  status text not null check (status in ('started', 'success', 'failed', 'skipped')),
  message text,
  changed boolean,
  error text,
  started_at timestamptz default now(),
  finished_at timestamptz
);

create index tracked_services_status_idx on public.tracked_services(status);
create index tracked_services_category_idx on public.tracked_services(category);
create index tracked_services_slug_idx on public.tracked_services(slug);
create index policy_documents_service_id_idx on public.policy_documents(service_id);
create index policy_documents_status_idx on public.policy_documents(status);
create index policy_snapshots_document_id_idx on public.policy_snapshots(policy_document_id);
create index policy_snapshots_hash_idx on public.policy_snapshots(content_hash);
create unique index unique_policy_snapshot_hash on public.policy_snapshots(policy_document_id, content_hash);
create index policy_changes_document_id_idx on public.policy_changes(policy_document_id);
create index policy_changes_status_idx on public.policy_changes(status);
create index policy_changes_published_at_idx on public.policy_changes(published_at);
create index policy_change_findings_change_id_idx on public.policy_change_findings(policy_change_id);
create index risk_reports_policy_document_id_idx on public.risk_reports(policy_document_id);
create index risk_reports_snapshot_id_idx on public.risk_reports(snapshot_id);
create index risk_reports_status_idx on public.risk_reports(status);
create index risk_findings_report_id_idx on public.risk_findings(risk_report_id);
create index user_service_subscriptions_user_id_idx on public.user_service_subscriptions(user_id);
create index user_service_subscriptions_service_id_idx on public.user_service_subscriptions(service_id);
create index tracking_suggestions_submitted_by_idx on public.tracking_suggestions(submitted_by);
create index tracking_suggestions_status_idx on public.tracking_suggestions(status);
create index tracking_suggestions_company_name_idx on public.tracking_suggestions(company_name);
create index notifications_user_id_idx on public.notifications(user_id);
create index notifications_read_at_idx on public.notifications(read_at);
create index scan_logs_policy_document_id_idx on public.scan_logs(policy_document_id);
create index scan_logs_status_idx on public.scan_logs(status);

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger tracked_services_updated_at before update on public.tracked_services for each row execute function public.set_updated_at();
create trigger policy_documents_updated_at before update on public.policy_documents for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'user');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$ select public.current_user_role() = 'admin'; $$;

create or replace function public.is_reviewer_or_admin()
returns boolean
language sql
stable
as $$ select public.current_user_role() in ('reviewer', 'admin'); $$;

create or replace function public.refresh_subscriber_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tracked_services
  set subscriber_count = (
    select count(*)::integer
    from public.user_service_subscriptions
    where service_id = coalesce(new.service_id, old.service_id)
  )
  where id = coalesce(new.service_id, old.service_id);
  return coalesce(new, old);
end;
$$;

create trigger user_service_subscriptions_count_insert
  after insert on public.user_service_subscriptions
  for each row execute function public.refresh_subscriber_count();

create trigger user_service_subscriptions_count_delete
  after delete on public.user_service_subscriptions
  for each row execute function public.refresh_subscriber_count();

alter table public.profiles enable row level security;
alter table public.tracked_services enable row level security;
alter table public.policy_documents enable row level security;
alter table public.policy_snapshots enable row level security;
alter table public.policy_changes enable row level security;
alter table public.policy_change_findings enable row level security;
alter table public.risk_reports enable row level security;
alter table public.risk_findings enable row level security;
alter table public.user_service_subscriptions enable row level security;
alter table public.tracking_suggestions enable row level security;
alter table public.notifications enable row level security;
alter table public.scan_logs enable row level security;

create policy "profiles own read" on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "profiles own update" on public.profiles for update using (auth.uid() = id or public.is_admin()) with check (auth.uid() = id or public.is_admin());

create policy "public active services" on public.tracked_services for select using (status = 'active' or public.is_reviewer_or_admin());
create policy "admin manage services" on public.tracked_services for all using (public.is_admin()) with check (public.is_admin());

create policy "public active documents" on public.policy_documents for select using (status = 'active' or public.is_reviewer_or_admin());
create policy "admin manage documents" on public.policy_documents for all using (public.is_admin()) with check (public.is_admin());

create policy "reviewers read snapshots" on public.policy_snapshots for select using (public.is_reviewer_or_admin());
create policy "service role snapshots" on public.policy_snapshots for all using (public.is_admin()) with check (public.is_admin());

create policy "public published changes" on public.policy_changes for select using (status = 'published' or public.is_reviewer_or_admin());
create policy "reviewers update changes" on public.policy_changes for update using (public.is_reviewer_or_admin()) with check (public.is_reviewer_or_admin());
create policy "admin insert changes" on public.policy_changes for insert with check (public.is_admin());

create policy "public published change findings" on public.policy_change_findings
  for select using (
    exists (select 1 from public.policy_changes pc where pc.id = policy_change_id and (pc.status = 'published' or public.is_reviewer_or_admin()))
  );
create policy "admin manage change findings" on public.policy_change_findings for all using (public.is_admin()) with check (public.is_admin());

create policy "public published reports" on public.risk_reports for select using (status = 'published' or public.is_reviewer_or_admin());
create policy "admin manage reports" on public.risk_reports for all using (public.is_admin()) with check (public.is_admin());

create policy "public published risk findings" on public.risk_findings
  for select using (
    exists (select 1 from public.risk_reports rr where rr.id = risk_report_id and (rr.status = 'published' or public.is_reviewer_or_admin()))
  );
create policy "admin manage risk findings" on public.risk_findings for all using (public.is_admin()) with check (public.is_admin());

create policy "users own subscriptions" on public.user_service_subscriptions for select using (auth.uid() = user_id or public.is_reviewer_or_admin());
create policy "users create own subscriptions" on public.user_service_subscriptions for insert with check (auth.uid() = user_id);
create policy "users delete own subscriptions" on public.user_service_subscriptions for delete using (auth.uid() = user_id);

create policy "users create suggestions" on public.tracking_suggestions for insert with check (auth.uid() = submitted_by);
create policy "users read own suggestions" on public.tracking_suggestions for select using (auth.uid() = submitted_by or public.is_reviewer_or_admin());
create policy "reviewers update suggestions" on public.tracking_suggestions for update using (public.is_reviewer_or_admin()) with check (public.is_reviewer_or_admin());

create policy "users own notifications" on public.notifications for select using (auth.uid() = user_id or public.is_reviewer_or_admin());
create policy "users mark notifications" on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin manage notifications" on public.notifications for all using (public.is_admin()) with check (public.is_admin());

create policy "reviewers read scan logs" on public.scan_logs for select using (public.is_reviewer_or_admin());
create policy "admin manage scan logs" on public.scan_logs for all using (public.is_admin()) with check (public.is_admin());

insert into public.tracked_services (name, slug, website_url, category, description, overall_risk_level)
values
  ('OpenAI', 'openai', 'https://openai.com', 'AI Tools', 'AI research and product platform behind ChatGPT and developer APIs.', 'Moderate'),
  ('Google', 'google', 'https://google.com', 'Cloud Services', 'Search, advertising, productivity, mobile, and cloud services.', 'Moderate'),
  ('Meta', 'meta', 'https://meta.com', 'Social Media', 'Social networking and messaging products including Facebook, Instagram, and WhatsApp.', 'Elevated'),
  ('TikTok', 'tiktok', 'https://tiktok.com', 'Social Media', 'Short-form video and social entertainment platform.', 'Elevated'),
  ('Discord', 'discord', 'https://discord.com', 'Messaging', 'Community messaging, voice, and social platform.', 'Moderate'),
  ('Microsoft', 'microsoft', 'https://microsoft.com', 'Productivity', 'Productivity, operating system, gaming, and cloud services.', 'Moderate'),
  ('Apple', 'apple', 'https://apple.com', 'Cloud Services', 'Consumer devices, software, app marketplace, and cloud services.', 'Low'),
  ('Stripe', 'stripe', 'https://stripe.com', 'Payments', 'Payment infrastructure and financial services platform.', 'Moderate'),
  ('Square', 'square', 'https://squareup.com', 'Payments', 'Payments, point-of-sale, and commerce tools.', 'Moderate'),
  ('Shopify', 'shopify', 'https://shopify.com', 'E-Commerce', 'E-commerce platform for merchants and storefronts.', 'Moderate'),
  ('PayPal', 'paypal', 'https://paypal.com', 'Payments', 'Online payments and consumer financial services.', 'Moderate'),
  ('Roblox', 'roblox', 'https://roblox.com', 'Gaming', 'Online gaming, creation, and social platform.', 'Elevated'),
  ('Reddit', 'reddit', 'https://reddit.com', 'Social Media', 'Community discussion and social media platform.', 'Moderate'),
  ('Snapchat', 'snapchat', 'https://snapchat.com', 'Social Media', 'Messaging, social media, and camera platform.', 'Elevated'),
  ('Uber', 'uber', 'https://uber.com', 'Delivery', 'Ride hailing, delivery, and logistics platform.', 'Moderate'),
  ('DoorDash', 'doordash', 'https://doordash.com', 'Delivery', 'Food delivery and local commerce platform.', 'Moderate'),
  ('Clover', 'clover', 'https://clover.com', 'Payments', 'Point-of-sale and business payment platform.', 'Moderate')
on conflict (slug) do nothing;
