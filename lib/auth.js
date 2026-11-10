import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { isDemo } from './store';
const devKey = randomBytes(32).toString('hex');
function secret() { return process.env.SESSION_SECRET || (isDemo() ? devKey : ''); }
export function passwordOK(value) {
  const expected = process.env.ADMIN_PASSWORD || (isDemo() ? 'isis-demo' : '');
  if (!expected || !secret()) return false;
  const a = createHmac('sha256',secret()).update(value).digest();
  const b = createHmac('sha256',secret()).update(expected).digest(); return timingSafeEqual(a,b);
}
export function signSession() {
  const exp = String(Date.now() + 8*60*60*1000);
  return exp + '.' + createHmac('sha256',secret()).update(exp).digest('hex');
}
export async function authorized() {
  if (!secret()) return false;
  const token = (await cookies()).get('isis_admin')?.value || '';
  const [exp, mac] = token.split('.');
  if (!exp || !mac || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  const expected = createHmac('sha256',secret()).update(exp).digest('hex');
  return mac.length === expected.length && timingSafeEqual(Buffer.from(mac),Buffer.from(expected));
}
export function sameOrigin(req) {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.get('host'); } catch { return false; }
}
