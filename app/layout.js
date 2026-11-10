import './globals.css';
import { convite } from '../lib/config';
export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: convite.titulo, description: 'Uma doce aventura está chegando. Venha celebrar a chegada da Ísis! Confirme sua presença.',
  openGraph: { title: convite.titulo, description: `${convite.diaSemana}, ${convite.dia} de ${convite.mesCompleto} de ${convite.ano}, às ${convite.horario}. Uma doce aventura espera por você.`, locale:'pt_BR', type:'website', images:[{url:'/opengraph-image',width:1200,height:630}] },
  robots: { index:false, follow:false },
};
export default function Layout({children}) { return <html lang="pt-BR"><body>{children}</body></html>; }
