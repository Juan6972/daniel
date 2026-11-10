import {test,expect} from '@playwright/test';
const suffix=Date.now();
test('mobile invitation, persisted RSVP, duplicate detection and protected admin CRUD',async({page,request})=>{
 await page.setViewportSize({width:390,height:844});
 const denied=await request.get('/api/admin/confirmacoes');expect(denied.status()).toBe(401);
 await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('Ísis');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.getByRole('button',{name:'Confirmar presença',exact:true}).click();
 await page.getByLabel('Nome completo').fill(`Maria Teste ${suffix}`);
 await page.getByLabel('WhatsApp',{exact:false}).fill('(31) 99999-9999');
 await page.getByRole('button',{name:'Adicionar acompanhante',exact:true}).click();
 await page.getByRole('button',{name:'Confirmar minha presença'}).click();
 await expect(page.getByText('PRESENÇA CONFIRMADA',{exact:true})).toBeVisible();
 const assigned=await page.locator('.size-letter').textContent();expect(['P','M','G']).toContain(assigned);
 await page.getByRole('button',{name:'Voltar ao convite'}).click();await page.reload();
 await page.getByRole('button',{name:'Ver minha confirmação'}).click();await expect(page.locator('.size-letter')).toHaveText(assigned);
 const duplicate=await request.post('/api/confirmacoes',{data:{nome:`Maria Teste ${suffix}`,whatsapp:'+55 (31) 99999-9999',acompanhantes:4}});
 const data=await duplicate.json();expect(data.confirmacao.existente).toBe(true);expect(data.confirmacao.tamanho).toBe(assigned);expect(data.confirmacao.acompanhantes).toBe(1);
 await page.goto('/admin');await page.getByLabel('Senha de acesso').fill('wrong');await page.getByRole('button',{name:'Entrar',exact:true}).click();await expect(page.locator('p[role=alert]')).toContainText('Senha incorreta');
 await page.getByLabel('Senha de acesso').fill('isis-demo');await page.getByRole('button',{name:'Entrar',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Quem vem celebrar?'})).toBeVisible();
 await page.getByRole('button',{name:`Editar Maria Teste ${suffix}`}).click();await page.getByLabel('Acompanhantes',{exact:true}).fill('3');await page.getByRole('button',{name:'Salvar alterações'}).click();
 const row=page.getByRole('row').filter({hasText:`Maria Teste ${suffix}`});await expect(row).toContainText('3');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar CSV'}).click();expect((await download).suggestedFilename()).toContain('.csv');
 await page.getByRole('button',{name:`Remover Maria Teste ${suffix}`}).click();await page.getByRole('button',{name:'Sim, remover confirmação'}).click();await expect(page.getByRole('row').filter({hasText:`Maria Teste ${suffix}`})).toHaveCount(0);
 await page.getByRole('button',{name:'Sair',exact:true}).click();await expect(page.getByLabel('Senha de acesso')).toBeVisible();
});
test('server serializes concurrent demo requests and preserves duplicates',async({request})=>{
 const names=Array.from({length:9},(_,i)=>`Familia Concorrente ${suffix} ${i}`);
 let ids=[];
 try{
 const results=await Promise.all(names.map(nome=>request.post('/api/confirmacoes',{data:{nome,whatsapp:'',acompanhantes:0}}).then(r=>r.json())));
 ids=results.map(d=>d.confirmacao.id);expect(new Set(ids).size).toBe(9);
 await request.post('/api/admin/login',{data:{password:'isis-demo'}});
 const all=await (await request.get('/api/admin/confirmacoes')).json();
 const counts=['P','M','G'].map(s=>all.confirmacoes.filter(d=>d.tamanho===s).length);expect(Math.max(...counts)-Math.min(...counts)).toBeLessThanOrEqual(1);
 }finally{
 await request.post('/api/admin/login',{data:{password:'isis-demo'}});
 for(const id of ids)await request.delete('/api/admin/confirmacoes',{data:{id}});
 }
});
