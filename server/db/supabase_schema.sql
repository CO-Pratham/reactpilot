-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Projects Table
create table if not exists projects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  path text not null,
  file_count integer default 0,
  status text default 'active',
  performance_score integer,
  last_analyzed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Files Table
create table if not exists files (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  path text not null,
  content text,
  size integer default 0,
  type text default 'file',
  last_modified timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(project_id, path)
);

-- Reports Table
create table if not exists reports (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  performance_score integer default 0,
  issues jsonb default '[]'::jsonb,
  suggestions jsonb default '[]'::jsonb,
  patches jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index if not exists idx_projects_created_at on projects(created_at desc);
create index if not exists idx_files_project_id on files(project_id);
create index if not exists idx_reports_project_id on reports(project_id);
