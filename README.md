<div align="center">

<img src="public/icon.png" alt="CyberReview Logo" width="80" />

# CYBER REVIEW

**A plataforma cyberpunk para ranquear qualquer coisa**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06b6d4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

## ✨ Sobre o Projeto

**CyberReview** é uma plataforma social gamificada para criar e compartilhar reviews de qualquer coisa — jogos, filmes, carros, músicas e muito mais. Com uma estética cyberpunk única e um sistema de progressão completo, cada review é uma experiência imersiva.

---

## 🚀 Features

| Feature | Descrição |
|---|---|
| 📝 **Reviews** | Crie reviews com atributos customizados, imagens e pontuações |
| 🔀 **Clone** | Clone reviews de outros usuários e adicione seu ponto de vista |
| ❤️ **Likes & Reações** | Curta reviews com emojis e efeitos de partículas customizados |
| 🎁 **Lootboxes** | Ganhe lootboxes ao publicar reviews e desbloqueie itens cosméticos |
| 🏆 **Sistema de XP & Level** | Suba de nível e desbloqueie novos ranks |
| 👾 **Perfil Customizável** | Equipe molduras, banners, efeitos de partículas, títulos e badges |
| 👥 **Amizades** | Adicione amigos e filtre o feed para ver apenas reviews deles |
| 🔍 **Busca Global** | Busque usuários e reviews diretamente na navbar |
| ⚡ **Realtime** | Atualizações ao vivo via Supabase Realtime |

---

## 🎨 Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Linguagem:** TypeScript
- **Banco de dados:** [Supabase](https://supabase.com/) (PostgreSQL + Realtime)
- **Autenticação:** Supabase Auth
- **Storage:** Supabase Storage (avatars & imagens)
- **UI:** Vanilla CSS + Tailwind utilitário
- **Fontes:** Orbitron + Inter (Google Fonts)
- **Ícones:** [Lucide React](https://lucide.dev/)

---

## ⚡ Performance & Arquitetura

O **CyberReview** foi construído focando em uma experiência fluida ("Snappy UX"), utilizando técnicas avançadas de gerenciamento de estado e rede:

- **Abas Ininterruptas (AbortController):** Todas as requisições ao Supabase são vinculadas a um `AbortController`. Ao navegar rapidamente entre o Feed e o Perfil, as requisições da aba anterior são canceladas instantaneamente, evitando desperdício de banda e o efeito de "carregamento infinito".
- **Sincronização Realtime de Contadores:** Os cards do Feed possuem listeners Realtime. Curtidas e comentários refletem nos cards de todos os usuários logados sem necessidade de Refresh.
- **Race Condition Protection:** Lógica implementada para garantir que, em conexões lentas, apenas a última requisição solicitada pelo usuário atualize a interface.

---

## ☁️ Deploy via Vercel

A plataforma está otimizada para ser hospedada no **Vercel** de forma gratuita e escalável.

### Passos para Deploy:

1. Suba seu código para um repositório no **GitHub**.
2. No painel do Vercel, clique em **"Add New"** > **"Project"**.
3. Importe o repositório do CyberReview.
4. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Clique em **Deploy**.

---

## ⚙️ Rodando Localmente

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/jeffersongomesdamd/CyberReview.git
cd CyberReview

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.local.example .env.local
# Preencha com suas credenciais do Supabase

# 4. Rode o servidor de desenvolvimento
npm run dev
```

---

## 📁 Estrutura do Projeto

```
CyberReview/
├── app/                    # App Router (Next.js)
│   ├── profile/[username]/ # Perfil dinâmico por Nickname
│   └── review/[id]/        # Visualização detalhada
├── components/             # Componentes modulares
│   ├── FeedClient.tsx      # Core logic do Feed (Realtime + Filters)
│   └── ReviewCard.tsx      # Renderização otimizada de cards
├── supabase/
│   └── migrations/         # Scripts de banco (Triggers, RLS, Counters)
├── lib/                    # Hooks e Utilitários
└── public/                 # Branding e Assets
```

---

## 📜 Licença

Este projeto é de uso pessoal e portfólio. Todos os direitos reservados.

---

<div align="center">
  Feito com ⚡ por <a href="https://github.com/jeffersongomesdamd">Jefferson Gomes</a>
</div>
