# Chá de Bebê da Ísis

Convite responsivo em português do Brasil, feito com Next.js, React e CSS. Inclui confirmação por família, distribuição equilibrada de fraldas no servidor, painel administrativo e CSV.

## Desenvolvimento

Requer Node.js 22 ou posterior.

```sh
npm ci --cache /tmp/isis-npm-cache
cp .env.example .env.local
npm run dev
```

O modo `DEMO_MODE=true` só funciona no servidor de desenvolvimento, sem Supabase, fora da Vercel. Os dados de demonstração ficam em `.data/confirmacoes.json`; a senha local padrão é `isis-demo`. Essa senha **não funciona em produção**. O cookie expira em oito horas e reiniciar o processo encerra sessões de demonstração. Apague os dados de demonstração antes de usar este ambiente para outro evento. Não use múltiplos processos no modo de demonstração.

A página principal abre o formulário, seguido do agradecimento e do tamanho atribuído, sem trocar de página. O navegador lembra a última confirmação neste dispositivo; em outro dispositivo, preencher novamente o mesmo nome + WhatsApp recupera a atribuição do banco. Se mudar os dados de identidade, eles serão considerados uma nova família. Quem não fornecer WhatsApp é identificado pelo nome normalizado; homônimos sem telefone compartilham a confirmação.

## Supabase e produção

1. Crie um projeto Supabase e execute `supabase/schema.sql` no SQL Editor.
2. Configure, de forma privada, no ambiente de execução:
   - `SUPABASE_URL`: URL do projeto.
   - `SUPABASE_SERVICE_ROLE_KEY`: chave de serviço, usada somente no servidor. Nunca use prefixo `NEXT_PUBLIC_` para essa chave.
   - `ADMIN_PASSWORD`: senha forte e exclusiva do painel.
   - `SESSION_SECRET`: valor aleatório de pelo menos 32 caracteres (por exemplo, gerado com `openssl rand -hex 32`).
   - `NEXT_PUBLIC_SITE_URL`: URL HTTPS pública, sem barra no final, para os metadados de compartilhamento.
3. Remova `DEMO_MODE` ou defina `false`. O servidor de produção não usa a persistência local mesmo se essa opção estiver ativa.
4. Execute `npm run build` e `npm start`.

A tabela `confirmacoes` tem RLS habilitada e não permite leitura/escrita por clientes públicos. Apenas o servidor utiliza a chave de serviço e chama a função `confirmar_presenca`. Um lock de tabela serializa a seleção do menor grupo, a inserção e as edições/remoções concorrentes. Nome normalizado + WhatsApp têm índice único. Duplicatas retornam a confirmação existente. Empates são aleatórios no PostgreSQL. Atribuições existentes são preservadas: após remoções, a contagem atual orienta as próximas famílias; não se muda silenciosamente o tamanho já informado às outras pessoas.

O painel `/admin` permite visualizar, buscar, editar nome/telefone/acompanhantes, remover com confirmação e exportar CSV compatível com planilhas. Contadores são recalculados ao carregar e após cada alteração. Há uma atribuição por família, independentemente dos acompanhantes. Não há opção por pessoa nesta versão; essa mudança exige adaptar o modelo e a RPC.

O login usa senha no servidor e cookie HTTP-only, SameSite=Strict, Secure em produção, assinado e com validade de oito horas. A limitação de tentativas é local ao processo; para tráfego público elevado ou proteção contra abuso distribuído, configure rate limiting persistente no provedor. Compartilhe a senha somente com a organização do evento. A rota pública não expõe a lista de convidados.

## Publicar na Vercel

Importe este repositório na Vercel, selecione Next.js e configure as variáveis acima em Production. A Vercel fornece o domínio gratuito `*.vercel.app`. Após o primeiro deploy, ajuste `NEXT_PUBLIC_SITE_URL` para esse domínio e faça um redeploy. Teste confirmação, duplicidade e painel no ambiente publicado. Esta implementação não cria contas, projetos ou deploy automaticamente e não inclui credenciais.

## Personalizar

- `lib/config.js`: nome, frase, data, horário e endereço. O horário solicitado é **12h30**, mesmo que a referência mostre outro horário.
- `app/globals.css`: cores, fontes locais, layout, xadrez e animações. Respeita a preferência por movimento reduzido.
- `public/friends.svg`: ilustração vetorial própria inspirada no tema de personagens; não é um recorte da imagem anexada. A imagem do anexo não estava disponível como arquivo local nesta sessão. Para usar os recortes originais, substitua esse asset por um arquivo autorizado e atualize o caminho em `app/page.js`.
- `app/opengraph-image.js`: imagem Open Graph gerada no servidor. Usa os textos de configuração; pode ser substituída pela arte final do convite, ajustando os metadados em `app/layout.js`.

## Verificação

```sh
npm test
npm run build
```

Teste de navegador (com o servidor de desenvolvimento em execução e `DEMO_MODE=true`):

```sh
CHROMIUM_PATH=/usr/bin/chromium npx playwright test
```

Os testes de navegador criam e removem suas próprias confirmações. O teste de distribuição em memória exercita mil atribuições; a concorrência real do PostgreSQL precisa ser validada contra seu projeto Supabase após aplicar o SQL. Não há conexão Supabase nem deploy real verificados sem as credenciais do projeto.
