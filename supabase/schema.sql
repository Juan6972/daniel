-- Execute once in the Supabase SQL editor. Never expose the service-role key in the browser.
create extension if not exists unaccent with schema extensions;
create or replace function public.normalizar_nome(value text) returns text
language sql immutable set search_path = public, extensions
as $$ select lower(extensions.unaccent(regexp_replace(trim(value), '\s+', ' ', 'g'))) $$;
create table if not exists public.confirmacoes (
 id uuid primary key default gen_random_uuid(),
 nome text not null check(char_length(nome) between 3 and 120),
 whatsapp text not null default '' check(whatsapp = '' or whatsapp ~ '^[0-9]{10,11}$'),
 acompanhantes integer not null default 0 check(acompanhantes between 0 and 20),
 tamanho text not null check(tamanho in ('P','M','G')),
 criado_em timestamptz not null default now(),
 nome_normalizado text generated always as (public.normalizar_nome(nome)) stored,
 unique(nome_normalizado, whatsapp)
);
alter table public.confirmacoes enable row level security;
revoke all on public.confirmacoes from anon, authenticated;
grant all on public.confirmacoes to service_role;
create or replace function public.confirmar_presenca(p_nome text, p_whatsapp text default '', p_acompanhantes integer default 0)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare existing public.confirmacoes; selected_size text; new_row public.confirmacoes; clean_phone text; clean_name text;
begin
 clean_name := regexp_replace(trim(p_nome), '\s+', ' ', 'g');
 clean_phone := regexp_replace(coalesce(p_whatsapp,''), '[^0-9]', '', 'g');
 if length(clean_phone) > 11 and left(clean_phone,2) = '55' then clean_phone := substring(clean_phone from 3); end if;
 if clean_name is null or length(clean_name) < 3 or length(clean_name) > 120 or position(' ' in clean_name)=0 then raise exception 'Nome completo inválido'; end if;
 if clean_phone <> '' and clean_phone !~ '^[0-9]{10,11}$' then raise exception 'WhatsApp inválido'; end if;
 if p_acompanhantes is null or p_acompanhantes < 0 or p_acompanhantes > 20 then raise exception 'Acompanhantes inválidos'; end if;
 -- Table lock serializes confirmations AND administrator updates/deletions.
 lock table public.confirmacoes in exclusive mode;
 select * into existing from public.confirmacoes where nome_normalizado=public.normalizar_nome(clean_name) and whatsapp=clean_phone;
 if found then return to_jsonb(existing) - 'nome_normalizado' || jsonb_build_object('existente',true); end if;
 select sizes.size into selected_size from (values ('P'),('M'),('G')) sizes(size)
 left join public.confirmacoes c on c.tamanho=sizes.size
 group by sizes.size order by count(c.id), random() limit 1;
 insert into public.confirmacoes(nome,whatsapp,acompanhantes,tamanho) values(clean_name,clean_phone,p_acompanhantes,selected_size) returning * into new_row;
 return to_jsonb(new_row) - 'nome_normalizado' || jsonb_build_object('existente',false);
end;
$$;
revoke all on function public.confirmar_presenca(text,text,integer) from public,anon,authenticated;
grant execute on function public.confirmar_presenca(text,text,integer) to service_role;
