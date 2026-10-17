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

ENDPOINT="https://api.newrelic.com/graphql"
[ "$REGION" = "EU" ] && ENDPOINT="https://api.eu.newrelic.com/graphql"

DIR="$(cd "$(dirname "$0")/.." && pwd)"
DASHBOARD="${DIR}/docs/observabilidade/dashboard-oficina.json"

# Monta a mutation com o JSON do dashboard como variável, trocando o accountId 0 pelo da conta
PAYLOAD=$(NEW_RELIC_ACCOUNT_ID="$NEW_RELIC_ACCOUNT_ID" node -e '
  const fs = require("fs");
  const conta = Number(process.env.NEW_RELIC_ACCOUNT_ID);
  const dashboard = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  for (const pagina of dashboard.pages) {
    for (const widget of pagina.widgets) {
      for (const consulta of widget.rawConfiguration.nrqlQueries) consulta.accountIds = [conta];
    }
  }
  const query = "mutation($conta: Int!, $dashboard: DashboardInput!) { dashboardCreate(accountId: $conta, dashboard: $dashboard) { entityResult { guid name } errors { description type } } }";
  process.stdout.write(JSON.stringify({ query, variables: { conta, dashboard } }));
' "$DASHBOARD")

RESPOSTA=$(curl -sS "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "API-Key: ${NEW_RELIC_API_KEY}" \
  -d "$PAYLOAD")

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
