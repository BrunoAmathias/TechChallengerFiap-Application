#!/usr/bin/env bash
# Cria o dashboard "Oficina - Saga e Microsserviços" no New Relic pela API NerdGraph,
# a partir de docs/observabilidade/dashboard-oficina.json.
#
# Requer:
#   export NEW_RELIC_API_KEY=<User key (NRAK-...), em one.newrelic.com → API keys>
#   export NEW_RELIC_ACCOUNT_ID=<id numérico da conta>
#
# Uso:
#   ./scripts/criar-dashboard-newrelic.sh
#
# Variáveis opcionais:
#   NEW_RELIC_REGION  US (padrão) ou EU
set -euo pipefail

: "${NEW_RELIC_API_KEY:?Defina NEW_RELIC_API_KEY com uma User key do New Relic}"
: "${NEW_RELIC_ACCOUNT_ID:?Defina NEW_RELIC_ACCOUNT_ID com o id da conta}"
REGION="${NEW_RELIC_REGION:-US}"

# Remove espaços, aspas e quebras de linha (\r) que costumam vir junto ao colar a chave
NEW_RELIC_API_KEY=$(printf '%s' "$NEW_RELIC_API_KEY" | tr -d " \t\r\n\"'")
NEW_RELIC_ACCOUNT_ID=$(printf '%s' "$NEW_RELIC_ACCOUNT_ID" | tr -d " \t\r\n\"'")

case "$NEW_RELIC_API_KEY" in
  NRAK-*) ;;
  *)
    echo "A chave informada não é uma User key: começa com '${NEW_RELIC_API_KEY:0:4}' e tem ${#NEW_RELIC_API_KEY} caracteres."
    echo "Crie uma chave do tipo User (começa com NRAK-) em https://one.newrelic.com/api-keys"
    exit 1
    ;;
esac

ENDPOINT="https://api.newrelic.com/graphql"
[ "$REGION" = "EU" ] && ENDPOINT="https://api.eu.newrelic.com/graphql"

DIR="$(cd "$(dirname "$0")/.." && pwd)"
DASHBOARD="${DIR}/docs/observabilidade/dashboard-oficina.json"

# Monta a mutation com o JSON do dashboard como variável, trocando o accountId 0 pelo da conta.
# Acentos viram \uXXXX (corpo só em ASCII) e o corpo vai pelo stdin do curl: no Git Bash,
# texto UTF-8 passado como argumento para o curl do Windows chega corrompido ("Invalid JSON").
gerar_payload() {
  NEW_RELIC_ACCOUNT_ID="$NEW_RELIC_ACCOUNT_ID" node -e '
  const fs = require("fs");
  const conta = Number(process.env.NEW_RELIC_ACCOUNT_ID);
  const dashboard = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  for (const pagina of dashboard.pages) {
    for (const widget of pagina.widgets) {
      for (const consulta of widget.rawConfiguration.nrqlQueries) consulta.accountIds = [conta];
    }
  }
  const query = "mutation($conta: Int!, $dashboard: DashboardInput!) { dashboardCreate(accountId: $conta, dashboard: $dashboard) { entityResult { guid name } errors { description type } } }";
  const corpo = JSON.stringify({ query, variables: { conta, dashboard } });
  process.stdout.write(corpo.replace(/[\u0080-￿]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")));
' "$DASHBOARD"
}

# No Windows (Git Bash) o curl usa o Schannel, que falha quando o servidor de
# revogação de certificados não responde (CRYPT_E_REVOCATION_OFFLINE)
CURL_OPCOES=()
if curl -V 2>/dev/null | grep -qi schannel; then
  CURL_OPCOES+=(--ssl-no-revoke)
fi

RESPOSTA=$(gerar_payload | curl -sS "${CURL_OPCOES[@]}" "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "API-Key: ${NEW_RELIC_API_KEY}" \
  --data-binary @-)

if [[ "$RESPOSTA" == *"authentication required"* ]]; then
  echo "FALHOU: o New Relic recusou a chave (authentication required)."
  echo "Chave usada: começa com '${NEW_RELIC_API_KEY:0:5}', ${#NEW_RELIC_API_KEY} caracteres; conta ${NEW_RELIC_ACCOUNT_ID}; região ${REGION}."
  echo "Confira se a User key foi criada nessa conta, se não foi apagada e se foi copiada inteira."
  exit 1
fi

printf '%s' "$RESPOSTA" | node -e '
  let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => {
    const r = JSON.parse(s);
    const criado = r.data?.dashboardCreate;
    const erros = [...(r.errors || []), ...(criado?.errors || [])];
    if (erros.length || !criado?.entityResult) {
      console.error("FALHOU:", JSON.stringify(erros.length ? erros : r));
      process.exit(1);
    }
    console.log(`OK: dashboard "${criado.entityResult.name}" criado (guid ${criado.entityResult.guid})`);
    console.log(`https://one.newrelic.com/redirect/entity/${criado.entityResult.guid}`);
  });
'
