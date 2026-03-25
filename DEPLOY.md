# Guia de Implantação: CyberReview

Siga estes passos para colocar o seu **CyberReview** no ar.

## 1. Instalação Local

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente:
   - Copie o arquivo `.env.local.example` para `.env.local`.
   - Preencha com sua `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` obtidas no painel do Supabase.

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## 2. Configuração do Banco de Dados (Supabase)

1. No painel do Supabase, vá em **SQL Editor**.
2. Cole e execute o conteúdo de `supabase/schema.sql`. Isso criará as tabelas, triggers e políticas de segurança (RLS).

## 3. Configuração de Autenticação

1. No Supabase, vá em **Authentication** -> **URL Configuration**.
2. Adicione `http://localhost:3000` em **Site URL**.
3. Adicione `http://localhost:3000/**` em **Redirect URLs**.

## 4. Configuração de Storage

1. O script SQL já deve ter criado o bucket `review-images`.
2. Certifique-se de que o bucket está configurado como **Public**.

## 5. Deploy no Vercel

1. Suba o código para um repositório no GitHub.
2. Conecte o repositório ao Vercel.
3. Adicione as mesmas variáveis de ambiente do `.env.local` nas configurações do projeto no Vercel.
4. Adicione a URL de produção do Vercel nas **Redirect URLs** do Supabase.

---

**CyberReview** — *Rank anything, evaluate everything.*
