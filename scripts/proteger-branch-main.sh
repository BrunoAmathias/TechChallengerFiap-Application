#!/usr/bin/env bash
# Protege a branch main de um repositório pela API do GitHub:
#   - merge só por Pull Request, com N aprovações (padrão 1)
#   - status checks obrigatórios (padrão: "ci", o job dos workflows de CI)
#   - sem push direto, sem force push e sem apagar a branch
#
# Requer um token com permissão de administração do repositório:
#   export GH_TOKEN=<token clássico com escopo "repo" ou fine-grained com "Administration: write">
#
# Uso:
#   ./scripts/proteger-branch-main.sh BrunoAmathias/TechChallengerFiap-Application
#   ./scripts/proteger-branch-main.sh BrunoAmathias/TechChallengerFiap-Billing
#   ./scripts/proteger-branch-main.sh BrunoAmathias/TechChallengerFiap-Execution
#   CHECKS="Validar infraestrutura Terraform" ./scripts/proteger-branch-main.sh BrunoAmathias/TechChallengerFiap-K8s
#   CHECKS="Validar infraestrutura Terraform" ./scripts/proteger-branch-main.sh BrunoAmathias/TechChallengerFiap-DB
#
# Variáveis opcionais:
#   CHECKS      checks obrigatórios separados por vírgula (padrão: ci)
#   APROVACOES  aprovações exigidas no PR (padrão: 1)
#   ADMINS      "true" aplica as regras também a administradores (padrão: true).
#               Em repositório de uma pessoa só, com APROVACOES=1, ninguém consegue
#               aprovar o próprio PR; use ADMINS=false para o dono poder fazer o merge
#               como administrador (o push direto continua bloqueado para os demais).
set -euo pipefail

REPO="${1:?Informe o repositório no formato dono/nome}"
CHECKS="${CHECKS:-ci}"
APROVACOES="${APROVACOES:-1}"
ADMINS="${ADMINS:-true}"
: "${GH_TOKEN:?Defina GH_TOKEN com um token de administração do repositório}"

CONTEXTOS=$(printf '%s' "$CHECKS" | awk -F',' '{for (i=1;i<=NF;i++){gsub(/^ +| +$/,"",$i); printf "%s\"%s\"", (i>1?",":""), $i}}')

BODY=$(cat <<EOF
{
  "required_status_checks": { "strict": true, "contexts": [${CONTEXTOS}] },
  "enforce_admins": ${ADMINS},
  "required_pull_request_reviews": {
    "required_approving_review_count": ${APROVACOES},
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
EOF
)

STATUS=$(curl -sS -o /tmp/protecao-resposta.json -w "%{http_code}" -X PUT \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer ${GH_TOKEN}" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/${REPO}/branches/main/protection" \
  -d "$BODY")

if [ "$STATUS" = "200" ]; then
  echo "OK: main de ${REPO} protegida (checks: ${CHECKS}; aprovações: ${APROVACOES}; admins: ${ADMINS})"
else
  echo "FALHOU (HTTP ${STATUS}) em ${REPO}:"
  cat /tmp/protecao-resposta.json
  exit 1
fi
