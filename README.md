# FlowGestão — Sistema de Gestão Empresarial
### Projeto de Extensão Universitária

Sistema completo de gestão para pequenas e médias empresas com:
- **Fluxo de Caixa** — Controle de receitas e despesas com gráficos
- **Funcionários** — Cadastro e gestão de equipe
- **Folha de Pagamento** — Registro de salários, bônus e descontos
- **Estoque** — Inventário com alertas de estoque baixo e movimentações
- **Fornecedores** — Cadastro de parceiros e fornecedores

---

## 🚀 Como Configurar

### 1. Configurar o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Vá em **SQL Editor** e execute o arquivo `supabase-setup.sql`
3. Vá em **Settings > API** e copie:
   - `Project URL`
   - `anon public` key

### 2. Criar o arquivo `.env`

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 3. Criar usuário no Supabase

No painel do Supabase vá em **Authentication > Users > Add user** e crie um usuário com e-mail e senha.

### 4. Instalar e rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`

---

## 🌐 Deploy para Produção

### Opção A — Vercel (recomendado, gratuito)

1. Acesse [vercel.com](https://vercel.com) e conecte seu GitHub
2. Importe este projeto
3. Em **Environment Variables**, adicione as variáveis do `.env`
4. Clique em **Deploy**

### Opção B — Netlify

1. Acesse [netlify.com](https://netlify.com)
2. Arraste a pasta do projeto ou conecte o GitHub
3. Configure as variáveis de ambiente
4. Build command: `npm run build`
5. Publish directory: `dist`

### Opção C — Build manual

```bash
npm run build
```

A pasta `dist/` gerada pode ser enviada para qualquer servidor estático (Nginx, Apache, etc).

---

## 📁 Estrutura do Projeto

```
gestao-saas/
├── src/
│   ├── components/       # Componentes reutilizáveis
│   ├── contexts/         # Context API (Auth)
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Supabase client
│   └── pages/            # Páginas do sistema
│       ├── DashboardPage.jsx
│       ├── CashFlowPage.jsx
│       ├── EmployeesPage.jsx
│       ├── PayrollPage.jsx
│       ├── StockPage.jsx
│       └── SuppliersPage.jsx
├── supabase-setup.sql    # Script de criação das tabelas
├── .env.example          # Modelo de variáveis de ambiente
└── package.json
```

---

## 🛠 Tecnologias Utilizadas

- **React 18** + Vite
- **Supabase** (banco de dados PostgreSQL + autenticação)
- **Recharts** (gráficos)
- **Lucide React** (ícones)
- **date-fns** (formatação de datas)

---

## 📊 Tabelas no Supabase

| Tabela | Descrição |
|--------|-----------|
| `transacoes` | Receitas e despesas |
| `funcionarios` | Cadastro de funcionários |
| `folha_pagamento` | Registros de pagamento |
| `estoque` | Produtos em estoque |
| `movimentacoes_estoque` | Entradas e saídas do estoque |
| `fornecedores` | Cadastro de fornecedores |

---

Desenvolvido como Projeto de Extensão Universitária — 2025
