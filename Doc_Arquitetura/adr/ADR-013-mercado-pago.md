# ADR-013 — Pagamento com Mercado Pago Checkout Pro

**Status:** Aceita · **Data:** 2026-10-15

## Contexto
O cliente aprova o orçamento e paga online. O pagamento é a etapa mais sensível da saga: precisa ser confirmado de forma confiável e poder ser estornado na compensação.

## Decisão
- **Checkout Pro** (SDK `mercadopago` v2): ao aprovar, o Billing cria uma preferência com `external_reference` = id do orçamento e redireciona o cliente para o checkout. O cliente aprova ou recusa por um link com token HMAC enviado por e-mail, sem login.
- **Confirmação pelo webhook:** o Billing valida a assinatura (`x-signature`, HMAC-SHA256 do manifesto `id:...;request-id:...;ts:...;`), **consulta o pagamento na API do Mercado Pago** (nunca confia no corpo do webhook) e confere **valor e moeda** contra o orçamento antes de publicar `pagamento.confirmado`. Uma divergência gera o evento `PagamentoDivergente` e não avança a saga.
- **Estorno** na compensação (`execucao.falhou`), com reembolso total e chave de idempotência = `eventId`.
- **Expiração:** um pagamento pendente além de `PAYMENT_EXPIRATION_MINUTES` publica `pagamento.falhou`.
- **Modo fake** (`MERCADOPAGO_MODE=fake`) para desenvolvimento e testes sem credenciais. Nos testes, o SDK real é exercitado com `nock`.
- **Assinatura em sandbox:** os avisos automáticos de pagamentos entre contas de teste do Mercado Pago não validam com a chave do painel (as simulações validam). Por isso existe `MP_WEBHOOK_SIGNATURE`: `enforce` (padrão, produção) recusa assinatura inválida; `warn` (só sandbox) aceita e registra (`WebhookAssinaturaInvalida`). No sandbox, a segurança se apoia na consulta do pagamento na API e na checagem de valor e moeda.

## Alternativas consideradas
- **Checkout Transparente:** dá mais controle da tela, mas o Billing passaria a lidar com dados de cartão (escopo PCI maior).
- **Confirmar pelo retorno do navegador (`back_url`):** não é confiável, porque o cliente pode fechar a página.

## Consequências
- Nenhum dado de cartão passa pelos serviços.
- O webhook precisa de uma URL pública com HTTPS. No ambiente de desenvolvimento foi usado um túnel Cloudflare; em produção, ALB com certificado ACM.
- O modo `warn` nunca deve ser usado em produção.
