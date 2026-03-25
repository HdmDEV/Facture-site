-- Run this in Supabase SQL editor to create the tables used by the app.

create table if not exists app_clients (
  id text primary key,
  societe text,
  nom_prenom text,
  email text,
  telephone text,
  adresse text,
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists app_articles (
  id text primary key,
  ref text,
  nom text,
  prix numeric(12,2) default 0,
  prix_achat numeric(12,2) default 0,
  tva numeric(5,2) default 0,
  stock numeric(12,2) default 0,
  warehouse text,
  created_at timestamp with time zone default now()
);

create table if not exists app_warehouses (
  id text primary key,
  nom text,
  created_at timestamp with time zone default now()
);

create table if not exists app_infos (
  id text primary key,
  nom text,
  adresse text,
  telephone text,
  email text,
  siret text,
  tva_intracom text,
  site_web text,
  iban text,
  bic text,
  conditions_paiement text,
  signature_path text,
  stamp_path text,
  created_at timestamp with time zone default now()
);

create table if not exists app_roles (
  slug text primary key,
  label text not null,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

insert into app_roles (slug, label, permissions)
values
  ('visitor', 'Visiteur', '{"invoice_access":true,"client_access":false,"article_access":false,"info_access":false,"logs_access":false,"admin_access":false,"user_manage":false,"role_manage":false}'::jsonb),
  ('user', 'Utilisateur', '{"invoice_access":true,"client_access":true,"article_access":true,"info_access":true,"logs_access":false,"admin_access":false,"user_manage":false,"role_manage":false}'::jsonb),
  ('admin', 'Admin', '{"invoice_access":true,"client_access":true,"article_access":true,"info_access":true,"logs_access":true,"admin_access":true,"user_manage":true,"role_manage":true}'::jsonb),
  ('root', 'Root', '{"invoice_access":true,"client_access":true,"article_access":true,"info_access":true,"logs_access":true,"admin_access":true,"user_manage":true,"role_manage":true}'::jsonb)
on conflict (slug) do update set
  label = excluded.label,
  permissions = excluded.permissions;

-- Auth profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  role text default 'user',
  created_at timestamp with time zone default now()
);

alter table profiles enable row level security;

create policy "profiles_insert_own"
on profiles for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_select_own"
on profiles for select
to authenticated
using (auth.uid() = id);

create policy "profiles_update_own"
on profiles for update
to authenticated
using (auth.uid() = id);
