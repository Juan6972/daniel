export function validateConfirmation(input) {
  const nome = String(input.nome ?? '').trim().replace(/\s+/g, ' ');
  const whatsapp = String(input.whatsapp ?? '').replace(/\D/g, '');
  const acompanhantes = Number(input.acompanhantes ?? 0);
  if (nome.length < 3 || nome.length > 120 || nome.split(' ').length < 2) throw new Error('Informe seu nome completo, com nome e sobrenome.');
  if (whatsapp && !/^(?:55)?\d{10,11}$/.test(whatsapp)) throw new Error('Informe um WhatsApp válido com DDD.');
  if (!Number.isInteger(acompanhantes) || acompanhantes < 0 || acompanhantes > 20) throw new Error('Informe entre 0 e 20 acompanhantes.');
  const canonicalPhone = whatsapp.length > 11 && whatsapp.startsWith('55') ? whatsapp.slice(2) : whatsapp;
  return { nome, whatsapp: canonicalPhone, acompanhantes };
}
export function identity(row) { return row.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g,' ') + '|' + row.whatsapp; }
export function chooseSize(rows, random = Math.random) {
  const counts = { P: 0, M: 0, G: 0 };
  rows.forEach(r => counts[r.tamanho]++);
  const min = Math.min(...Object.values(counts));
  const tied = Object.keys(counts).filter(s => counts[s] === min);
  return tied[Math.floor(random() * tied.length)];
}
