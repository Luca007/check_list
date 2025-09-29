# Guia de Identidade Visual e Roteiro de Telas – FIVE Sport Bar Ops

## 1. Identidade Visual

### 1.1 Paleta Oficial (Distribuição aproximada)
- **60% Preto – `#000000`** (fundos principais)
- **20% Dourado/Amarelo**  
  - Dourado marca/logotipo: `#D4AF37`  
  - Variante clara (hover/gradiente): `#E5C76B`
- **10% Amarelo (Reforço)** – `#FFC107` (ações primárias)
- **10% Vermelho & Verde semânticos**  
  - Vermelho (alertas/cartão vermelho): `#D32F2F`  
  - Verde (confirmações/cartão verde): `#2E7D32`
- **Neutros de apoio**:  
  - Off-white `#F7F7F7` (texto sobre fundos claros)  
  - Cinza 700 `#616161` (ícones inativos, texto auxiliar)  
  - Cinza 900 `#212121` (cartões sobre preto)  
  - Divisórias `#2A2A2A`

**Regras de uso**
- Fundo base: preto. Painéis/cartões sobre cinza 900.
- Dourado/âmbar reservados para elementos institucionais (app bar, botões primários, ícones de navegação).
- Vermelho/verde exclusivamente para status semânticos. Não misturar vermelho e dourado no mesmo componente interativo.

### 1.2 Tipografia
- **Display / HUD (placar):** Montserrat SemiBold/Bold
- **Texto corrido:** Inter ou Roboto Regular/Medium
- **Numeração / status:** Roboto Mono Medium
- **Tamanhos sugeridos (escala mobile):** H1 24px, H2 20px, H3 18px, corpo 14–16px, legenda 12px.

### 1.3 Ícones e pictogramas
- Estilo outline 2px com cantos levemente arredondados.
- Estado ativo dourado/âmbar; inativo cinza 700.  
- Ícones setoriais:
  - Cozinha: faca/chapéu do chef
  - Bar: copo alto
  - Carnes: grelha/corte
  - Garçom: bandeja
  - Gerente: escudo/olho 360°

### 1.4 Formas e motivos
- Motivo do anel duplo do logo em headers e splash (overlay sutil 10–15% de opacidade).
- Cartões com cantos 12px, sombra suave `0 2px 10px rgba(0,0,0,.4)`.
- Badges circulares em vermelho/verde para status instantâneo.
- Chips filtráveis (plantão, setor, status) com cantos 16px e outline dourado quando selecionados.

### 1.5 Componentes UI
- **Botão primário:** fundo `#FFC107`, texto preto, foco com anel dourado 2px.
- **Botão secundário:** borda dourada, texto dourado, fundo preto.
- **Botão perigo:** fundo vermelho, texto branco.
- **Botão confirmação:** fundo verde, texto branco.
- **Inputs:** fundo cinza 900, borda 1px `#2A2A2A`, foco dourado.
- **Switch / segmented control:** usado para alternar Plantão 1/2.
- **Stepper/checklist:** caixas grandes (mín. 72px altura) com estados Pendente (cinza), Em andamento (âmbar), Concluído (verde).
- **Tags de status:** Pronto (verde), Em preparo (âmbar), Atraso (vermelho), Falta insumo (vermelho escuro).

### 1.6 Imagens
- Fotografias reais em fundo escuro e luz quente.  
- Evitar tons frios; aplicar filtro quente leve quando necessário.
- Nunca utilizar clipart genérico.

### 1.7 Movimento
- Duração microinterações 120–200 ms.
- Check concluído: animação com brilho dourado.
- Alertas críticos: pulso único vermelho (sem looping).

### 1.8 Acessibilidade
- Contraste mínimo 4.5:1; textos claros sobre preto.
- Alvos táteis ≥ 44px.
- Ícones sempre acompanhados de texto.
- Cor não é único canal (usar ícone + texto + cor).

### 1.9 Logo
- Fundo preferencial preto.
- Zona de respiro: 1/3 do diâmetro do anel externo.
- Sem distorções ou sombras fortes. Versão sem fundo para splash e ícone.

## 2. Princípios de UX
- Uma ação principal por tela; secundárias via menu contextual.
- Fluxos curtos (ex.: abrir plantão ≤ 4 toques).
- Linguagem direta e operacional.
- Feedback imediato após interações, com vibração curta opcional.
- Confirmações claras em passos críticos.
- Consistência visual e semântica rígida das cores.

## 3. Arquitetura de Informação
- Navegação inferior com 5 abas (role-based): Início, Operações, Produção, Checklists, Gerente.
- Seleção de setor ao logar define dados exibidos.
- Plantão alternado via switch no topo; logs separados por plantão.

## 4. Roteiro de Telas
Cada tela deve ser projetada em grid de 8px, com estados: vazio, carregando, sucesso, erro. Usar exemplos reais do FIVE.

1. **Splash + Logo**  
   - Fundo preto, logo dourado, tagline "Sport Bar – DF Plaza".
2. **Login / Identificação**  
   - Inputs para CPF/telefone e PIN, seleção de Setor e Plantão 1/2, lembrar última escolha.
3. **Início – Visão rápida**  
   - Header com plantão atual, relógio, status de comunicação.  
   - Cartões: "Itens críticos hoje", "Produção pendente", "Checklists em aberto".  
   - Ações rápidas: Abrir plantão, Lista do dia, Conferir estoque.
4. **Abertura de Plantão**  
   - Stepper de 4 etapas (Limpeza → Cozinha → Bar → Carnes) com checkboxes grandes, foto opcional, comentário.  
   - Botão "Marcar tudo ok" por seção.
5. **Checklist por Setor**  
   - Filtros por setor, KPIs (tempo médio, pendências), chips de status.
6. **Fechamento de Plantão**  
   - Itens de contagem/fechamento, dupla confirmação.
7. **Lista de Produção do Dia**  
   - Status (Em preparo, Pronto, Falta insumo), controle +/- rápido, opção de scanner.
8. **Praça de Carnes**  
   - Subtelas por corte, indicadores de ponto/temperatura, flag de falta dispara alerta.
9. **Controle de Produção (KDS Cozinha/Bar)**  
   - Fila por prioridade, filtros, ações rápidas (Iniciar, Pausar, Concluir).
10. **Conferir Itens Essenciais**  
    - Lista crítica com estados OK/Baixo/Falta, botão "Notificar gerente" agregador.
11. **Avisos & Comunicação**  
    - Mensagens curtas com templates de cartão verde/vermelho, vínculo a item/etapa.
12. **Painel do Gerente**  
    - Visão 360° com semáforos, KPIs, ações (reabrir etapa, enviar aviso, exportar resumo).
13. **Permissões & Usuários**  
    - Gestão de perfis, permissões de edição e relatórios.
14. **Relatórios Essenciais**  
    - Vendas, itens mais pedidos, desperdício (somente leitura). Acesso restrito ao gerente.
15. **Configurações**  
    - Trocar setor, tema alto contraste, vibração, idioma (pt-BR padrão).
16. **QRCode / Delivery (opcional)**  
    - Exibe QR para cardápio e feedbacks rápidos.

## 5. Conteúdo e Microcopy
- Tom direto, vocabulário de bar/restaurante.
- Exemplos: "Abrir Plantão", "Fechar Plantão", "Conferir carnes", "Enviar produção", "Falta insumo: Ancho 300g", "Cartão verde: Bar finalizou 100% no prazo".

## 6. Design System Tokens
- **Cores**:  
  - `color.bg = #000000`
  - `color.brand = #D4AF37`
  - `color.accent = #FFC107`
  - `color.error = #D32F2F`
  - `color.success = #2E7D32`
  - `color.text = #FFFFFF`
  - `color.textMuted = #BDBDBD`
  - `color.divider = #2A2A2A`
- **Tipografia**:  
  - `font.display = Montserrat`
  - `font.body = Inter/Roboto`
  - `font.mono = Roboto Mono`
- **Raios**: `8px`, `12px`, `16px`
- **Espaçamentos**: `4, 8, 12, 16, 24, 32`
- **Elevação**: `0 2px 10px rgba(0,0,0,.4)`
- **Estados**:  
  - Hover: elevação + borda dourada 1px.  
  - Foco: anel 2px dourado/âmbar.  
  - Desabilitado: opacidade 40%, sem sombra.

## 7. Fluxos Críticos
- **Abertura de Plantão** (≤ 4 toques): Início → Abrir Plantão → Stepper 4 seções → Confirmar.
- **Registrar produção**: Produção do Dia → Item → +/- quantidade → Concluir → badge verde.
- **Reportar falta de insumo**: Item → "Falta" (vermelho) → Motivo → "Notificar gerente".

## 8. Offline & Operação
- Duas rotinas de plantão por dia; alternância rápida no topo.
- Integração com sistema existente: consumir relatórios e enviar eventos (faltas, status) sem duplicar POS.
- Comunicação interna rápida com templates vinculados a itens/etapas.
- Critérios de aceitação UX:  
  - Abertura de plantão ≤ 3 min.  
  - Registrar produção ≤ 3 toques.  
  - Identificar pendências ≤ 5 s ao abrir app.  
  - Legibilidade sob baixa luz com contraste validado.
