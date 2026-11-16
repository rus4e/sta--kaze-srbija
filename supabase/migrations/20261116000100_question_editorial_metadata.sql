create table public.question_editorial_metadata (
  question_id uuid primary key references public.questions(id) on delete cascade,
  week_start date not null,
  package_day date not null,
  package_position smallint not null check (package_position between 1 and 5),
  question_type text not null check (question_type in ('Tekstualno', 'Ilustrovano', 'Vizuelno')),
  editorial_status text not null default 'Čeka proveru'
    check (editorial_status in ('Čeka proveru', 'Odobreno', 'Odbijeno')),
  editorial_note text,
  asset_ready boolean not null default false,
  updated_at timestamptz not null default now(),
  check (package_day >= week_start and package_day < week_start + 7),
  unique (package_day, package_position)
);

create index question_editorial_metadata_week_idx
  on public.question_editorial_metadata (week_start, package_position);

alter table public.question_editorial_metadata enable row level security;

revoke all on table public.question_editorial_metadata from public, anon, authenticated;
grant select, insert, update, delete on table public.question_editorial_metadata to authenticated;

create policy "editor owner manages question metadata"
on public.question_editorial_metadata
for all
to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'editor_role') = 'owner')
with check ((select auth.jwt() -> 'app_metadata' ->> 'editor_role') = 'owner');
