create extension if not exists pgcrypto;

create table if not exists public.questions (
 id uuid primary key default gen_random_uuid(),
 slug text unique not null,
 title text not null,
 subtitle text,
 category text not null default 'Dnevna dilema',
 question_date date not null default current_date,
 status text not null default 'draft' check(status in ('draft','published','archived')),
 publish_at timestamptz,
 expires_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.options (
 id uuid primary key default gen_random_uuid(),
 question_id uuid not null references public.questions(id) on delete cascade,
 label text not null,
 position integer not null,
 unique(question_id,position),
 unique(question_id,id)
);
create table if not exists public.votes (
 id uuid primary key default gen_random_uuid(),
 question_id uuid not null references public.questions(id) on delete cascade,
 option_id uuid not null,
 voter_key uuid not null,
 created_at timestamptz not null default now(),
 foreign key(question_id,option_id) references public.options(question_id,id) on delete cascade,
 unique(question_id,voter_key)
);
create index if not exists votes_question_idx on public.votes(question_id);

alter table public.questions enable row level security;
alter table public.options enable row level security;
alter table public.votes enable row level security;

drop policy if exists "read published questions" on public.questions;
create policy "read published questions" on public.questions for select to anon,authenticated
using(status='published' and (publish_at is null or publish_at<=now()) and (expires_at is null or expires_at>now()));
drop policy if exists "read options of published questions" on public.options;
create policy "read options of published questions" on public.options for select to anon,authenticated
using(exists(select 1 from public.questions q where q.id=question_id and q.status='published'
and (q.publish_at is null or q.publish_at<=now()) and (q.expires_at is null or q.expires_at>now())));
-- No public policy for votes: individual votes and voter keys remain private.

create or replace function public.vote_question(p_question_id uuid,p_option_id uuid,p_voter_key uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare new_id uuid;
begin
 if p_voter_key is null then return jsonb_build_object('ok',false,'reason','invalid_voter'); end if;
 if not exists(select 1 from questions where id=p_question_id and status='published'
   and (publish_at is null or publish_at<=now()) and (expires_at is null or expires_at>now()))
 then return jsonb_build_object('ok',false,'reason','question_unavailable'); end if;
 if not exists(select 1 from options where id=p_option_id and question_id=p_question_id)
 then return jsonb_build_object('ok',false,'reason','invalid_option'); end if;
 insert into votes(question_id,option_id,voter_key) values(p_question_id,p_option_id,p_voter_key)
 on conflict(question_id,voter_key) do nothing returning id into new_id;
 if new_id is null then return jsonb_build_object('ok',false,'reason','already_voted'); end if;
 return jsonb_build_object('ok',true);
end $$;

create or replace function public.get_question_results(p_question_id uuid)
returns table(option_id uuid,label text,votes bigint,percentage integer)
language sql security definer set search_path=public as $$
 with c as (
  select o.id oid,o.label lbl,count(v.id)::bigint n,o.position
  from options o join questions q on q.id=o.question_id
  left join votes v on v.option_id=o.id and v.question_id=q.id
  where q.id=p_question_id and q.status='published'
  and (q.publish_at is null or q.publish_at<=now()) and (q.expires_at is null or q.expires_at>now())
  group by o.id,o.label,o.position
 ), t as (select coalesce(sum(n),0)::numeric total from c)
 select c.oid,c.lbl,c.n,case when t.total=0 then 0 else round(c.n*100/t.total)::integer end
 from c cross join t order by c.position;
$$;
revoke all on function public.vote_question(uuid,uuid,uuid) from public;
revoke all on function public.get_question_results(uuid) from public;
grant execute on function public.vote_question(uuid,uuid,uuid) to anon,authenticated;
grant execute on function public.get_question_results(uuid) to anon,authenticated;
grant select on public.questions,public.options to anon,authenticated;

insert into questions(slug,title,subtitle,category,status,question_date) values
('pozajmica','Prijatelj ti treći put kasni sa vraćanjem pozajmljenog novca. Sada traži još 500 €. Šta radiš?','Budi iskren — nema pogrešnog odgovora.','Prijateljstvo','draft',current_date),
('petak','Petak je, 17:05. Šef šalje poruku: „Imaš samo jednu sitnicu da završiš.” Šta pomisliš?','Ovo pitanje je opasno blizu realnosti.','Posao','draft',current_date-1),
('pica','Ostao je poslednji komad pice. U sobi ste ti i još jedna osoba. Šta je najispravnije?','Karakter se vidi u sitnicama. Ili u pici.','Svakodnevica','draft',current_date-2)
on conflict(slug) do nothing;

insert into options(question_id,label,position)
select q.id,v.label,v.pos from questions q join (values
('pozajmica','Pozajmim. Prijatelji smo.',1),('pozajmica','Ne pozajmljujem više.',2),('pozajmica','Pozajmim, ali uz jasan rok.',3),('pozajmica','Prvo vraća staro, pa pričamo.',4),
('petak','Gotovo je za pet minuta.',1),('petak','Vidimo se u ponedeljak.',2),('petak','Isključim internet.',3),('petak','Odgovorim: „Naravno 😊” i uzdahnem.',4),
('pica','Pitam da li neko želi.',1),('pica','Prepolovim.',2),('pica','Pojedem. Ko prvi, njegovo.',3),('pica','Ostavim ga za sutra.',4)
) v(slug,label,pos) on q.slug=v.slug
where not exists(select 1 from options o where o.question_id=q.id and o.position=v.pos);

-- Nakon provere objavi prvo pitanje:
-- update public.questions set status='published',publish_at=now() where slug='pozajmica';
