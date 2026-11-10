import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { convite } from '../lib/config';
export const runtime = 'nodejs';
export const size = {width:1200,height:630};
export const contentType = 'image/png';
export default async function Image() {
 const art = 'data:image/png;base64,' + (await readFile(path.join(process.cwd(),'public/friends-share.png'))).toString('base64');
 return new ImageResponse(<div style={{display:'flex',height:'100%',width:'100%',background:'#f4dce0',padding:28}}><div style={{display:'flex',alignItems:'center',background:'#fffdf8',borderRadius:'150px 150px 12px 12px',width:'100%',color:'#766248',padding:40}}><div style={{display:'flex',width:520,flexDirection:'column',alignItems:'center'}}><div style={{fontSize:18,letterSpacing:4}}>UMA DOCE AVENTURA VEM AÍ</div><img src={art} width={520} height={347}/></div><div style={{display:'flex',flex:1,flexDirection:'column',alignItems:'center'}}><div style={{fontSize:46}}>Chá de Bebê</div><div style={{fontSize:150,color:'#b78a2e',fontStyle:'italic'}}>{convite.nome}</div><div style={{fontSize:26}}>{`${convite.dia} ${convite.mes} ${convite.ano} · ${convite.horario}`}</div><div style={{fontSize:20,marginTop:30}}>Venha celebrar com a gente!</div></div></div></div>,size);
}
