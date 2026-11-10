import { passwordOK, signSession, sameOrigin } from '../../../../lib/auth';
const attempts = new Map();
export async function POST(req) {
  if (!sameOrigin(req)) return Response.json({error:'Origem inválida.'},{status:403});
  const ip = req.headers.get('x-forwarded-for') || 'local';
  const now = Date.now(); const entry = attempts.get(ip);
  if (entry && entry.until > now && entry.count >= 8) return Response.json({error:'Muitas tentativas. Aguarde 15 minutos.'},{status:429});
  try {
    const { password } = await req.json();
    if (typeof password !== 'string' || !passwordOK(password)) {
      attempts.set(ip,{count:entry && entry.until > now ? entry.count+1 : 1,until:entry && entry.until > now ? entry.until : now+900000});
      return Response.json({error:'Senha incorreta ou acesso não configurado.'},{status:401});
    }
    attempts.delete(ip);
    return Response.json({ok:true},{headers:{'Set-Cookie':`isis_admin=${signSession()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`}});
  } catch { return Response.json({error:'Pedido inválido.'},{status:400}); }
}
export async function DELETE(req) {
  if (!sameOrigin(req)) return new Response(null,{status:403});
  return Response.json({ok:true},{headers:{'Set-Cookie':'isis_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'}});
}
