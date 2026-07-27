# Speechy — OpenShift Deployment Guide

This covers deploying Speechy to an OpenShift cluster using the manifests in
`openshift/` and the GitLab CI pipelines in `speechy-server/.gitlab-ci.yml`
and `speechy-client/.gitlab-ci.yml`. It assumes you've already read
`DEPLOYMENT.md` (architecture, env vars, air-gap image list) — this document
only covers what's specific to OpenShift.

## 1. How the pieces fit together

```
GitLab CI (per project, independent — CLAUDE.md §2)
  speechy-server/.gitlab-ci.yml ──▶ builds/pushes speechy-server:$SHA + :latest
  speechy-client/.gitlab-ci.yml ──▶ builds/pushes speechy-client:$SHA + :latest
                                        │
                                        ▼
                         GitLab Container Registry
                                        │
                              (imagePullSecrets: gitlab-registry)
                                        ▼
openshift/                     OpenShift project "speechy"
  namespace.yaml          →   Namespace/Project
  serviceaccount.yaml     →   speechy-infra (anyuid, for stock postgres/redis images)
  postgres/, redis/       →   Deployment + PVC + Service (internal datastores)
  server/                 →   ConfigMap, Secret*, PVC, 2 Deployments, Service, Route
  client/                 →   Deployment, Service, Route
```

`*` secrets are never committed — `secret.example.yaml` is the template,
same convention as `.env.example`.

Each of `openshift/postgres`, `openshift/redis`, `openshift/server`,
`openshift/client` is its own Kustomize overlay, so you can
`oc apply -k openshift/server` independently of the client, matching
"the two sub-projects are independently deployed" from `CLAUDE.md` §2.

## 2. One-time cluster setup

Do this once per environment (dev/staging/production), by hand or via
whatever GitOps tool you use — it's not part of the CI pipelines on purpose,
since it touches secrets and cluster-scoped grants.

```bash
oc login <cluster-api-url>

# 2.1 Namespace
oc apply -f openshift/namespace.yaml
# or, more idiomatically on OpenShift: oc new-project speechy

# 2.2 Let postgres/redis's stock Docker Hub images run under OpenShift's
# arbitrary-UID model (see openshift/serviceaccount.yaml for why this is
# needed and what the trade-off is)
oc apply -k openshift/postgres   # creates the speechy-infra ServiceAccount too
oc adm policy add-scc-to-user anyuid -z speechy-infra -n speechy

# 2.3 Image pull secret — lets OpenShift pull from your GitLab registry
oc create secret docker-registry gitlab-registry \
  --docker-server=registry.gitlab.example.com \
  --docker-username=<deploy-token-username> \
  --docker-password=<deploy-token-password> \
  -n speechy
# A GitLab "deploy token" (Settings → Repository → Deploy tokens) with
# read_registry scope is the right credential here — not a personal account.

# 2.4 Server secret
cp openshift/server/secret.example.yaml openshift/server/secret.yaml
# edit SECRET_KEY / DB_PASSWORD / LLM_ENDPOINT / LLM_API_KEY
oc apply -f openshift/server/secret.yaml -n speechy
```

## 3. Edit the placeholders

Three files have `CHANGEME` / example hostnames you must edit before
applying — grep for them:

```bash
grep -rn "CHANGEME\|registry.gitlab.example.com" openshift/
```

- `openshift/server/configmap.yaml` — `ALLOWED_HOSTS`, `CLIENT_ORIGIN`
- `openshift/server/route.yaml`, `openshift/client/route.yaml` — `host`
- `openshift/server/deployment-web.yaml`, `deployment-worker.yaml`,
  `openshift/client/deployment.yaml` — `image:` → your real
  `$CI_REGISTRY_IMAGE` path (also matches what CI pushes to)

Keep `ALLOWED_HOSTS`/`CLIENT_ORIGIN` and the two Route `host` values
consistent with each other, and build the client image with a matching
`VITE_API_URL` (baked in at build time — see `DEPLOYMENT.md` §2.2 and §3).

## 4. First deploy

```bash
oc apply -k openshift/redis
oc apply -k openshift/server
oc apply -k openshift/client

# one-time DB setup, same as DEPLOYMENT.md §4
oc exec deploy/speechy-server-web -n speechy -- python manage.py migrate
oc exec -it deploy/speechy-server-web -n speechy -- python manage.py createsuperuser
```

`oc apply -k openshift/` from the repo root does all of the above (except
the namespace, SCC grant, pull secret, and server secret — those stay
manual per §2) if you'd rather bootstrap everything in one shot.

## 5. Ongoing deploys via GitLab CI

Set these **CI/CD variables** (Settings → CI/CD → Variables) on the GitLab
project:

| Variable | Used by | Notes |
|---|---|---|
| `OC_SERVER` | both `*:deploy` jobs | OpenShift API URL |
| `OC_TOKEN` | both `*:deploy` jobs | token for a ServiceAccount with `edit` on the `speechy` project — not your personal `oc login` token |
| `VITE_API_URL` | `client:build` | baked into the JS bundle at build time |
| `VITE_SSO_URL` | `client:build` | optional, see `DEPLOYMENT.md` §5 |

`CI_REGISTRY*` variables are provided automatically once the GitLab
project's Container Registry is enabled (Settings → General → Visibility →
Container Registry).

Each pipeline (`test` → `build` → `deploy`) only runs when its own
project's files change (`rules: changes:` in each `.gitlab-ci.yml`), and
`deploy` is a manual gate on the default branch — nothing reaches the
cluster without someone clicking ▶ in the GitLab pipeline UI.

The deploy job re-applies that project's manifests (`oc apply -k
openshift/<project>`, picking up any ConfigMap/Route edits) and then runs
`oc rollout restart` on its Deployment(s), which is what actually forces a
fresh pull of the `:latest` image `build` just pushed. The `$CI_COMMIT_SHORT_SHA`
tag stays in the registry for manual rollback:

```bash
oc set image deployment/speechy-server-web \
  server=registry.gitlab.example.com/speechy/speechy-server:<previous-sha> -n speechy
oc rollout status deployment/speechy-server-web -n speechy
```

## 6. OpenShift-specific things in this repo (and why)

- **Non-root containers.** OpenShift's default `restricted` SCC runs every
  pod as an arbitrary, non-root UID belonging to group `0`. Both
  `.docker/Dockerfile`s now `chgrp -R 0` / `chmod -R g=u` their app
  directories, set `HOME`, and end with a non-root `USER` — this also works
  unmodified under plain Docker/Compose, so nothing changed for local dev.
- **Client listens on 8080, not 80.** Arbitrary UIDs can't bind privileged
  ports. `docker-compose.yml`'s port mapping was updated to `3000:8080` to
  match.
- **postgres/redis need `anyuid`.** Their stock Docker Hub images assume
  root at container start (postgres chowns its data dir; redis's image
  ships `/data` owned by uid 999) — see `openshift/serviceaccount.yaml` for
  the trade-off and the production alternative (Red Hat's arbitrary-UID-safe
  images, or a managed/operator-backed Postgres instead of a bare
  Deployment+PVC).
- **Prompts are a fixed-name ConfigMap, not baked into the image.**
  `openshift/server/kustomization.yaml`'s `configMapGenerator` has
  `disableNameSuffixHash: true` specifically so that re-applying it after
  editing a prompt file updates the *same* ConfigMap object — kubelet syncs
  that to the mounted volume within ~60-90s with no pod restart, which is
  what `CLAUDE.md` §6 requires ("editable without restart").
- **No BuildConfig/S2I.** Images are built in GitLab CI and pushed to
  GitLab's registry rather than using OpenShift-native Builds — keeps the
  two projects' CI fully self-contained and portable to any registry.
- **Health probes use TCP, not HTTP, for speechy-server.** There's no
  unauthenticated 200-OK health endpoint (`/api/auth/me/` correctly returns
  401 with no token — see `DEPLOYMENT.md` §4). A `tcpSocket` probe on 8000
  confirms gunicorn is accepting connections without needing a
  probe-specific route through auth.

## 7. Air-gapped clusters

Everything in `DEPLOYMENT.md` §2 still applies — mirror the five base
images plus your two built app images into a registry the cluster can
reach (an internal registry, or OpenShift's own internal image registry via
`oc image mirror`). The `image:` fields in `openshift/server/*` and
`openshift/client/deployment.yaml` just need to point at wherever that
mirror ends up; nothing else in these manifests reaches the internet.
