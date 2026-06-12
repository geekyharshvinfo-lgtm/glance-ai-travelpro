# Deployment

Containerized SvelteKit Node app, deployed to GCP via Helm. Two environments (UAT + prod), one shared central CI workflow set.

## Build artifact

`adapter-node` produces `./build` containing `index.js` + chunks. The container runs `node build` — no Express, no PM2.

## Dockerfile

Three-stage `Dockerfile` based on `node:25.8.0-alpine3.23`:

1. **`deps`** — `apk add --no-cache libc6-compat`, copies lockfiles, configures the InMobi private npm registry (`inmobiartifactory.jfrog.io`) using the build-arg `npm_token`, runs `npm ci`.
2. **`builder`** — copies `node_modules` from `deps`, copies the rest of the source, runs `SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN} npm run build`. The `npm run prebuild` (`scripts/pre-build.sh`) inside that build hook copies the right `.env` file based on `BUILD_ENV_VAL`.
3. **`runner`** — runs `apk upgrade --no-cache`, creates `nodejs:1001` group + `lp-svelte:1001` user, copies `package.json` + `build/` + `node_modules`, switches to `lp-svelte`, exposes 8080, sets `PORT=8080`, runs `node build`. Healthcheck: `curl -f http://localhost:8080` every minute, 5 retries.

`HEALTHCHECK` in Dockerfile pings the root URL. Kubernetes probes use `/api/health` instead (see Helm values).

## Helm

`deployment_values/values.yaml` (prod) and `deployment_values/values_uat.yaml`. Both use the same chart structure and differ in env labels, hostnames, and image registries:

| Field | UAT | Production |
| --- | --- | --- |
| `serviceName` | `ai-influencer-web-uat` | `ai-influencer-web-prod` |
| `image.repository` | `us-central1-docker.pkg.dev/platformtools-develop-015a/docker-dev-gar/inmobi-glance/ai-influencer-web` | `us-central1-docker.pkg.dev/platformtools-prod-872a/docker-prod-gar/inmobi-glance/ai-influencer-web` |
| External hostname | `influencers-uat.glance.com` | `influencers.glance.com` |
| Internal hostname | `ai-influencer-web.ailooks-uat.internal.glance.com` | `ai-influencer-web.ailooks.internal.glance.com` |
| `env_variables[ENV]` | `staging` | `prod` |
| `replicaCount` | 1 (autoscaling disabled) | 1 (autoscaling disabled, `min/max` 15/20 if re-enabled) |

Resource limits: `1 CPU / 1Gi memory`, requests `500m / 512Mi`. Service port `8080`. Healthcheck: `GET /api/health`, 60 s interval, 50 s timeout, 5 unhealthy threshold.

`autoscaling.enabled` is **false** in both envs today — replica count is pinned at 1. The `min/max 15/20` numbers in the file are only used if you flip the flag.

## Image build pipeline

The `image.tag` in `values.yaml` is updated on every successful `master` merge by the central release workflow (commit messages like `[buildhub] Post-merge version bump: values update` are the artifact of this). Don't hand-edit it unless you're rolling back.

Build args required:
- `npm_token` — InMobi Artifactory NPM auth token (CI secret).
- `SENTRY_AUTH_TOKEN` — for source-map upload (lives in `.env.sentry-build-plugin` locally, CI secret in pipelines).

## CI workflows

All three workflows in `.github/workflows/` delegate to `inmobi-se/central-workflows`. Local file content is just job orchestration:

| File | Trigger | Jobs |
| --- | --- | --- |
| `ci-pr-workflow.yml` | PR open / sync / reopen / edit (target: `main`, `develop*`, `master*`) | `workflow-quality` (lint + check) → `workflow-build` (artifact, `is-release-flow: false`) → `workflow-monitoring` (reporting). Concurrency group cancels stale runs |
| `ci-release-workflow.yml` | Push to `master*`, manual `workflow_dispatch` | `workflow-build` (`is-release-flow: true`) → `job-post-release` (git tag + GitHub release + backmerge) → `workflow-monitoring` |
| `ci-hygiene.yml` | PR events | `workflow-hygiene` — branch name regex, PR title format, JIRA ticket validation, commit message lint |

`NODE_VERSION` is hardcoded to `'18'` in workflow env, while `package.json` requires `>=25.0.0` and `.nvmrc` is `v25.8.0`. The mismatch is intentional — the central CI image runs Node 18 because the build doesn't actually exercise the Node 25 features (codepaths use `esnext` Vite target, not Node-API features).

## Branching workflow

`buildParams/projectInfo.json:branching_workflow` is `github_flow`. That means:

- Default branch is `master`.
- All work targets `master` directly via PRs.
- Releases use `release` / `major-release` / `minor-release` / `patch-release` PR types — there is no `develop` branch.
- `buildParams/git.json` enforces 1 approval to merge to `master` and deletes feature branches on merge.

`buildParams/gating/thresholds.json` declares all coverage thresholds (`branch_coverage`, `line_coverage`, `method_coverage`, `class_coverage`, `complexity_coverage`, `instruction_coverage`) as `0` — coverage gating is effectively off. Tests don't currently block merges. See @docs/testing.md.

Glance org standards are CI-enforced — see `~/CLAUDE.md` for branch / commit / PR title conventions. JIRA project is `AIP`.

## Versioning

`package.json` `version` is bumped automatically by the central release workflow. PR types map to bumps:

| PR type | Bump |
| --- | --- |
| `major-release` | major |
| `minor-release` | minor |
| `patch-release` / `release` | patch |

For new projects without git tags, set `project_version` in `buildParams/projectInfo.json` or use explicit `{v=X.Y.Z}` syntax in the PR title (e.g., `release{v=2.0.0}(api): [AIP-789] migrate`).

## Health & observability

- **k8s liveness** — `GET /api/health` returns `{ status: 'ok' }`. Implemented in `src/routes/api/health/+server.ts`.
- **Sentry** — release name `ai-influencer@<version>` from `package.json`. Source maps upload only when `SENTRY_AUTH_TOKEN` is set and `PUBLIC_ENV` is `production` or `uat`. See @docs/error-tracking.md.
- **Sentinel** — analytics. See @docs/analytics.md.

## Rolling back

1. Find the last good `image.tag` in `git log -- deployment_values/values.yaml`.
2. PR a single-line `image.tag` revert against `master` with a `release` type.
3. The release workflow rebuilds nothing — it just re-tags the existing image and re-applies. Fast.

Don't hand-deploy via `kubectl set image` — the GitOps loop will overwrite it on the next reconcile.

## Local containerization

```bash
docker build --build-arg npm_token=$NPM_TOKEN --build-arg SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN -t ai-influencer-web .
docker run -p 8080:8080 ai-influencer-web
# open http://localhost:8080
```

The local container ignores `BUILD_ENV_VAL` and uses whatever `.env` is committed. Set `BUILD_ENV_VAL=production` in the build args to swap to `.prod.env` if you need a prod-shaped local image.
