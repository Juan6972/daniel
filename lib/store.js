import { createClient } from '@supabase/supabase-js';
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { chooseSize, identity } from './validation.mjs';
const file = path.join(process.cwd(), '.data', 'confirmacoes.json');
export const isDemo = () => !process.env.SUPABASE_URL && process.env.DEMO_MODE === 'true' && !process.env.VERCEL && process.env.NODE_ENV !== 'production';
function client() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('A confirmação ainda não está disponível. Tente novamente mais tarde.');
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}
async function read() { try { return JSON.parse(await readFile(file, 'utf8')); } catch(e) { if(e.code === 'ENOENT') return []; throw e; } }
let queue = Promise.resolve();
function transaction(fn) {
  const job = queue.then(async () => {
    const rows = await read(); const result = await fn(rows);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file + '.tmp', JSON.stringify(rows, null, 2)); await rename(file + '.tmp', file); return result;
  }); queue = job.catch(() => {}); return job;
}
export async function confirm(input) {
  if (isDemo()) return transaction(rows => {
    const existing = rows.find(r => identity(r) === identity(input));
    if (existing) return { ...existing, existente: true };
    const row = { id: randomUUID(), ...input, tamanho: chooseSize(rows), criado_em: new Date().toISOString() };
    rows.push(row); return row;
  });
  const { data, error } = await client().rpc('confirmar_presenca', { p_nome: input.nome, p_whatsapp: input.whatsapp, p_acompanhantes: input.acompanhantes });
  if (error) { console.error('Confirmation database error:', error.code); throw new Error('Não foi possível confirmar agora. Tente novamente.'); }
  return data;
}
export async function list() {
  if (isDemo()) { await queue; return read(); }
  const { data, error } = await client().from('confirmacoes').select('*').order('criado_em', { ascending: false });
  if (error) throw new Error('Não foi possível carregar as confirmações.'); return data;
}
export async function change(id, input) {
  if (isDemo()) return transaction(rows => {
    const idx = rows.findIndex(r => r.id === id); if (idx < 0) throw new Error('Confirmação não encontrada.');
    if (!input) { rows.splice(idx,1); return; }
    if (rows.some(r => r.id !== id && identity(r) === identity(input))) throw new Error('Este convidado já confirmou.');
    rows[idx] = { ...rows[idx], ...input }; return rows[idx];
  });
  const db = client();
  const { error } = input ? await db.from('confirmacoes').update(input).eq('id',id) : await db.from('confirmacoes').delete().eq('id',id);
  if (error) throw new Error(error.code === '23505' ? 'Este convidado já confirmou.' : 'Não foi possível salvar a alteração.');
}
export async function lookup(id) {
  if (isDemo()) { await queue; return (await read()).find(r => r.id === id) || null; }
  const { data, error } = await client().from('confirmacoes').select('id,nome,whatsapp,acompanhantes,tamanho,criado_em').eq('id',id).maybeSingle();
  if (error) throw new Error('Não foi possível recuperar a confirmação.'); return data;
}
