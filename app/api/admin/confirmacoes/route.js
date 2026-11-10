import { authorized, sameOrigin } from '../../../../lib/auth';
import { list, change } from '../../../../lib/store';
import { validateConfirmation } from '../../../../lib/validation.mjs';
export async function GET() {
  if (!await authorized()) return Response.json({error:'Entre para acessar.'},{status:401});
  try { return Response.json({confirmacoes:await list()},{headers:{'Cache-Control':'no-store'}}); }
  catch(e) { return Response.json({error:e.message},{status:503}); }
}
async function mutate(req, remove) {
  if (!sameOrigin(req) || !await authorized()) return Response.json({error:'Acesso não autorizado.'},{status:401});
  try {
    const body = await req.json(); if (!/^[\da-f-]{36}$/i.test(body.id || '')) throw new Error('Identificador inválido.');
    await change(body.id,remove ? null : validateConfirmation(body)); return Response.json({ok:true});
  } catch(e) { return Response.json({error:e.message},{status:400}); }
}
export const PATCH = req => mutate(req,false);
export const DELETE = req => mutate(req,true);
