import test from 'node:test';
import assert from 'node:assert/strict';
import { validateConfirmation, identity, chooseSize } from '../lib/validation.mjs';
test('normalizes full names and Brazilian phones without exposing duplicates',()=>{
 const a=validateConfirmation({nome:'  José   Silva ',whatsapp:'+55 (31) 99999-9999',acompanhantes:2});
 assert.equal(a.nome,'José Silva');assert.equal(a.whatsapp,'31999999999');
 assert.equal(identity(a),identity({nome:'JOSE SILVA',whatsapp:'31999999999'}));
});
test('rejects incomplete names, invalid WhatsApp and invalid companions',()=>{
 for(const input of [{nome:'Ana'},{nome:'Ana Silva',whatsapp:'123'},{nome:'Ana Silva',acompanhantes:-1},{nome:'Ana Silva',acompanhantes:1.5},{nome:'Ana Silva',acompanhantes:21}])assert.throws(()=>validateConfirmation(input));
});
test('balances 1000 family assignments with a maximum difference of one',()=>{
 const rows=[];for(let i=0;i<1000;i++){rows.push({tamanho:chooseSize(rows)});const counts=['P','M','G'].map(s=>rows.filter(r=>r.tamanho===s).length);assert.ok(Math.max(...counts)-Math.min(...counts)<=1);}
});
test('randomizes ties and selects only least represented sizes after removal',()=>{
 assert.equal(chooseSize([],()=>0),'P');assert.equal(chooseSize([],()=>.5),'M');assert.equal(chooseSize([],()=>.999),'G');
 assert.equal(chooseSize([{tamanho:'P'},{tamanho:'M'}]),'G');
});
