import { confirm, isDemo, lookup } from '../../../lib/store';
import { validateConfirmation } from '../../../lib/validation.mjs';
export const runtime = 'nodejs';
export async function POST(req) {
  try { const input = validateConfirmation(await req.json()); return Response.json({ confirmacao: await confirm(input), demo: isDemo() }); }
  catch(e) { return Response.json({ error: e.message }, { status: 400 }); }
}
export async function GET(req) {
  const id = new URL(req.url).searchParams.get('id');
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!id) return Response.json({ demo: isDemo() }, { headers });
  if (!/^[\da-f-]{36}$/i.test(id)) return Response.json({ error:'Identificador inválido.' }, { status:400, headers });
  try {
    const row = await lookup(id);
    return Response.json({ confirmacao:row, demo:isDemo() }, { status:row ? 200 : 404, headers });
  } catch { return Response.json({ error:'Não foi possível recuperar a confirmação.' }, { status:503, headers }); }
}
