# HelpDesk (front-end)

Interface do Sistema de Gerenciamento de Chamados (painéis Admin, Técnico e Cliente), mobile first, seguindo o layout do [Figma](https://www.figma.com/design/PJ7gHDYZfLX7L53la29X4m/Plataforma-de-Chamados--Community-).

**Stack:** React, Vite, TypeScript, TailwindCSS, React Router, Axios.

**Deploy:** [https://helpdesk-web-inky.vercel.app](https://helpdesk-web-inky.vercel.app) · API: [https://helpdesk-api-1-mstu.onrender.com](https://helpdesk-api-1-mstu.onrender.com)

## Rodando localmente

Suba antes a API (veja `../backend/README.md`).

```bash
cp .env.example .env   # VITE_API_URL=http://localhost:3333
npm install
npm run dev            # http://localhost:5173
```

Contas de teste (senha `123456`): `admin@helpdesk.com`, `tecnico1@helpdesk.com`, `cliente@helpdesk.com`.

## Deploy na Vercel

Root `frontend`, defina `VITE_API_URL` com a URL da API. `vercel.json` já cuida do fallback de rotas da SPA.
