# FIVE Sport Bar – Sistema Operacional

Aplicativo web responsivo para operação interna do FIVE Sport Bar (DF Plaza), com foco em abertura/fechamento de plantão, produção diária, conferência de estoque e comunicação rápida entre equipes. A solução é construída inteiramente em HTML, CSS e JavaScript puro, com suporte a Firebase (camada gratuita) e funcionamento offline com sincronização assim que a conexão retorna.

## Recursos principais

- Guia completo de identidade visual e roteiros de tela (`docs/visual-guide.md`).
- Design tokens implementados via CSS custom properties (`styles/main.css`).
- Estrutura de navegação por abas com dashboards específicos para cada perfil interno.
- Fluxos críticos (abertura de plantão, produção, comunicação) prontos para integrar com Firebase Firestore/Auth.
- Fila offline com IndexedDB/localStorage e sincronização automática após reconexão (`scripts/offline-sync.js` + `scripts/firebase.js`).
- Service Worker e `manifest.json` para experiência tipo app (PWA) e cache dos assets essenciais.

## Estrutura

```text
index.html                  # Shell principal do app
styles/main.css             # Tokens de design e componentes
scripts/app.js              # Lógica de interface e fluxos
scripts/firebase.js         # Integração com Firebase (modo gratuito)
scripts/offline-sync.js     # Fila offline e listeners
scripts/firebase-config.js  # Config em branco (preencher manualmente)
docs/visual-guide.md        # Identidade visual + roteiros
sw.js                       # Service Worker para cache offline
manifest.json               # Manifesto PWA
assets/icon.svg             # Ícone padrão do app
```

## Pré-requisitos

- Projeto Firebase configurado no plano gratuito (Auth + Firestore).
- Servidor HTTP simples para testar localmente (ex.: `npx serve` ou Live Server do VS Code). Servir arquivos estáticos garante o registro do Service Worker.

## Configuração do Firebase

1. Crie/ou reutilize um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Ative **Authentication** (pode iniciar com login anônimo ou custom tokens) e **Firestore Database** (modo nativo com regras restritas aos perfis necessários).
3. Duplique `scripts/firebase-config.example.js` para `scripts/firebase-config.js` e preencha com as credenciais fornecidas pelo Firebase:

```js
window.FIVE_FIREBASE_CONFIG = {
  apiKey: "SUAS CHAVES",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
  measurementId: "..."
};
```

> O arquivo `scripts/firebase-config.js` já está presente com campos vazios, mas recomenda-se sobrescrevê-lo via script privado ou variáveis de ambiente no ambiente de produção.

4. (Opcional) Estruture coleções iniciais no Firestore:
   - `users/{cpf_ou_telefone}`: `{ pin: "1234", role: "cozinha", name: "Nome" }`
   - `checklists/{id}` e `production-events`, `shortages` serão criadas automaticamente quando o app sincronizar dados.

## Executar localmente

1. Inicie um servidor estático no diretório do projeto.

```powershell
npx serve
```

1. Acesse `http://localhost:3000` (ou a porta exibida) no navegador.
2. Faça login com CPF/telefone e PIN cadastrados no Firestore ou utilize o modo offline (sem preencher credenciais reais) para navegar e testar os fluxos.

### Testes rápidos

- Desconecte o Wi-Fi / use modo avião e conclua ações (checklists, produção). As ações são enfileiradas localmente.
- Reative a conexão: o app exibirá um toast informando quantas ações foram sincronizadas.

## Manutenção e personalização

- Ajuste tokens de cor/raio/elevação em `styles/main.css` para evoluções do design.
- Inclua telas adicionais ou iterações respeitando a grid de 8px descrita no guia.
- Para novos fluxos, utilize `registerProductionEvent`, `saveChecklistProgress` e `reportShortage` para persistir no Firestore ou enfileirar offline.
- Customize o `sw.js` caso deseje cachear rotas adicionais ou implementar estratégias avançadas (ex.: stale-while-revalidate).

## Licença

Uso interno/privado para as operações do FIVE Sport Bar.