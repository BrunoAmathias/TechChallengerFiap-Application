#!/usr/bin/env bash
# Cria (ou atualiza) o ruleset "Main" de um repositório pela API do GitHub,
# com as mesmas regras usadas no TechChallengerFiap-Application:
#   - vale para as branches main e Homolog
#   - merge só por Pull Request (sem push direto); aprovação descartada se houver novo push
#   - status checks obrigatórios e branch atualizada antes do merge
#   - sem force push e sem apagar a branch
#
# Requer um token com permissão de administração do repositório:
#   export GH_TOKEN=<fine-grained com "Administration: Read and write" ou clássico com escopo "repo">
#
# Uso:
#   ./scripts/proteger-branch-main.sh BrunoAmathias/TechChallengerFiap-Application
#   ./scripts/proteger-branch-main.sh BrunoAmathias/TechChallengerFiap-Billing
#   ./scripts/proteger-branch-main.sh BrunoAmathias/TechChallengerFiap-Execution
#   CHECKS="Validar infraestrutura Terraform" ./scripts/proteger-branch-main.sh BrunoAmathias/TechChallengerFiap-K8s
#   CHECKS="Validar infraestrutura Terraform" ./scripts/proteger-branch-main.sh BrunoAmathias/TechChallengerFiap-DB
#
# Variáveis opcionais:
#   CHECKS      checks obrigatórios separados por vírgula (padrão: ci, o job dos workflows de CI)
#   APROVACOES  aprovações exigidas no PR (padrão: 0, igual ao ruleset original)
#   BRANCHES    branches protegidas separadas por vírgula (padrão: main,Homolog)
set -euo pipefail

REPO="${1:?Informe o repositório no formato dono/nome}"
CHECKS="${CHECKS:-ci}"
APROVACOES="${APROVACOES:-0}"
BRANCHES="${BRANCHES:-main,Homolog}"
NOME_RULESET="Main"
GITHUB_ACTIONS_APP_ID=15368
: "${GH_TOKEN:?Defina GH_TOKEN com um token de administração do repositório}"

API="https://api.github.com/repos/${REPO}/rulesets"
RESPOSTA="$(mktemp)"
trap 'rm -f "$RESPOSTA"' EXIT

chamar() { # metodo url [corpo]
  curl -sS -o "$RESPOSTA" -w "%{http_code}" -X "$1" \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer ${GH_TOKEN}" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "$2" ${3:+-d "$3"}
}

lista_json() { # "a,b" + formato printf -> itens JSON separados por vírgula
  printf '%s' "$1" | awk -F',' -v fmt="$2" '{for (i=1;i<=NF;i++){gsub(/^ +| +$/,"",$i); if ($i!="") printf "%s" fmt, (n++?",":""), $i}}'
}

REFS=$(lista_json "$BRANCHES" '"refs/heads/%s"')
REGRA_CHECKS=""
if [ -n "$CHECKS" ]; then
  CONTEXTOS=$(lista_json "$CHECKS" "{\"context\":\"%s\",\"integration_id\":${GITHUB_ACTIONS_APP_ID}}")
  REGRA_CHECKS=",{\"type\":\"required_status_checks\",\"parameters\":{\"strict_required_status_checks_policy\":true,\"do_not_enforce_on_create\":false,\"required_status_checks\":[${CONTEXTOS}]}}"
fi

BODY=$(cat <<EOF
{
  "name": "${NOME_RULESET}",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": [${REFS}], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "pull_request", "parameters": {
        "required_approving_review_count": ${APROVACOES},
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "allowed_merge_methods": ["merge", "squash", "rebase"]
    } }${REGRA_CHECKS}
  ]
}
EOF
)

# Procura um ruleset "Main" já existente para atualizar em vez de duplicar
STATUS=$(chamar GET "${API}?per_page=100")
if [ "$STATUS" != "200" ]; then
  echo "FALHOU ao listar rulesets (HTTP ${STATUS}) em ${REPO}:"; cat "$RESPOSTA"; exit 1
fi
ID=$(tr -d '\n' < "$RESPOSTA" | grep -o "\"id\": *[0-9]*, *\"name\": *\"${NOME_RULESET}\"" | grep -o '[0-9]\+' | head -n1 || true)

if [ -n "$ID" ]; then
  STATUS=$(chamar PUT "${API}/${ID}" "$BODY"); ACAO="atualizado"
else
  STATUS=$(chamar POST "$API" "$BODY"); ACAO="criado"
fi

if [ "$STATUS" = "200" ] || [ "$STATUS" = "201" ]; then
  echo "OK: ruleset \"${NOME_RULESET}\" ${ACAO} em ${REPO} (branches: ${BRANCHES}; checks: ${CHECKS:-nenhum}; aprovações: ${APROVACOES})"
else
  echo "FALHOU (HTTP ${STATUS}) em ${REPO}:"; cat "$RESPOSTA"; exit 1
fi
