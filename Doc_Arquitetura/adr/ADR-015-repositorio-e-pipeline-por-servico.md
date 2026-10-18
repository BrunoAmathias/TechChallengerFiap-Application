# ADR-015 — Repositório, pipeline e namespace por serviço

**Status:** Aceita · **Data:** 2026-10-17 · **Complementa:** ADR-007 (Terraform para a infraestrutura, manifests pelo CD)

## Contexto
A fase exige pipelines independentes com deploy em Kubernetes e branch main protegida. Os serviços precisam ser implantados sem depender uns dos outros, mas compartilham cluster, broker e entrada HTTP.

## Decisão
- **Um repositório por serviço** (Application = OS Service, Billing e Execution), cada um com `ci.yml` e `cd.yml`:
  - **CI** em PR e em push de `Dev` e `Homolog`: lint, migrations num banco de serviço, testes com cobertura mínima de 80% (inclui BDD) e `docker build`.
  - **CD** no merge da `main`: CI completo com **SonarCloud e Quality Gate** (reprovação bloqueia o deploy), imagem no ECR com tag = SHA do commit, Secret do serviço a partir dos GitHub Secrets, `kubectl kustomize` com a imagem nova, rollout e smoke test do `/health`.
- **Infraestrutura compartilhada em repositórios próprios** (K8s e DB), com Terraform e pipelines próprios.
- **Um namespace por serviço** (`os`, `billing`, `execution`) e **um ALB compartilhado** (`group.name: oficina`), cada serviço com o próprio Ingress e paths.
- **Proteção de branch por ruleset** em `main` e `Homolog` nos cinco repositórios: PR obrigatório, check de CI obrigatório e atualizado, sem force push nem exclusão (script `scripts/proteger-branch-main.sh`).
- **SonarCloud só na `main`:** o plano gratuito da organização só libera resultados da branch principal.

## Alternativas consideradas
- **Monorepo com pipelines por pasta:** mais simples de versionar junto, mas não atende "repositório próprio por serviço".
- **Um ALB por serviço:** isolamento maior, com custo três vezes maior.
- **Sonar em todas as branches:** exige plano pago.

## Consequências
- Um serviço pode ser implantado sem tocar nos outros; os contratos de eventos são o ponto de coordenação.
- A ordem do primeiro deploy importa: K8s e DB antes dos serviços (namespaces, Secrets compartilhados e bancos).
- Nas branches `Dev` e `Homolog`, o CI garante lint, testes e cobertura; a análise do Sonar acontece no CD da `main`.
