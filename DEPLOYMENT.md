# Speechy — Air-Gapped Deployment Guide

This covers: what to pre-fetch on an internet-connected machine, how to move it
across the air gap, how to run every service, and how to replace the mock SSO
with a real ADFS integration.

## 1. Architecture

```
                      ┌────────────────────┐
   browser  ───────▶  │ client (nginx)     │  static SPA, port 3000→80
                      └─────────┬──────────┘
                                │ REST (JSON), Bearer JWT
                                ▼
                      ┌────────────────────┐
                      │ server-web         │  Django + gunicorn, port 8000
                      │ (speechy-server)   │
                      └───┬────────────┬───┘
                          │            │
                 ┌────────▼───┐   ┌────▼─────┐
                 │ db         │   │ redis    │◀── broker/result backend
                 │ postgres   │   └────┬─────┘
                 └────────────┘        │
                                  ┌────▼──────────┐
                                  │ server-worker │  Celery, same image as
                                  │ (Celery)      │  server-web, different CMD
                                  └───────────────┘
```

`server-web` and `server-worker` are **the same Docker image** — the
`.docker/entrypoint.sh` script picks `web` (gunicorn) or `worker` (celery)
based on the container command. There is no separate worker image to build.

`prompts/` (repo root) is mounted as a **read-only volume**, not baked into
the image, so prompt tuning doesn't require a rebuild — see §4.

## 2. What you need before going air-gapped

Everything below must be fetched **once, on a machine with internet access**,
then transferred across the air gap as files. Nothing at deploy time reaches
the internet — all dependency installation on the air-gapped host happens
from local files only.

### 2.1 Docker base images

```bash
docker pull python:3.11-slim
docker pull node:20-alpine
docker pull nginx:1.25-alpine
docker pull postgres:16-alpine
docker pull redis:7-alpine

docker save -o speechy-base-images.tar \
  python:3.11-slim node:20-alpine nginx:1.25-alpine postgres:16-alpine redis:7-alpine
```

Transfer `speechy-base-images.tar` across the gap, then on the air-gapped
host:

```bash
docker load -i speechy-base-images.tar
```

### 2.2 Application images (recommended: build online, ship the image)

The cleanest path for air-gapped delivery is to **build the two application
images on the internet-connected machine** (where `pip install`/`npm ci` can
actually reach PyPI/npm), then export them — the air-gapped host never runs
a package installer against the internet.

```bash
# from repo root
docker build -f speechy-server/.docker/Dockerfile -t speechy-server:latest .
docker build -f speechy-client/.docker/Dockerfile \
  --build-arg VITE_API_URL=https://speechy.internal.example \
  -t speechy-client:latest speechy-client

docker save -o speechy-app-images.tar speechy-server:latest speechy-client:latest
```

> **Important:** `VITE_API_URL` is baked into the client's JS bundle at
> *build* time (see `speechy-client/.docker/Dockerfile` line 11) — it cannot
> be changed later via an env var on the running container. Build with the
> real internal API hostname the browsers will use in production, not
> `localhost`.

Transfer `speechy-app-images.tar`, then on the air-gapped host:

```bash
docker load -i speechy-app-images.tar
```

With both tarballs loaded, `docker compose up -d` (§4) will use these images
directly and will not attempt to build anything.

### 2.3 Alternative: build on the air-gapped host itself

If you must build on the air-gapped machine (e.g. policy requires images be
assembled from source there), you need a **local package mirror** reachable
from that host:

- Python: a local PyPI-compatible index (e.g. `devpi`, or a flat wheel
  directory served over HTTP) containing every pinned version in
  `speechy-server/requirements.txt`. Point pip at it via `PIP_INDEX_URL`
  (add as a Docker build arg, or bake a `pip.conf` into the build context).
- Node: a local npm registry mirror (e.g. `verdaccio`) or a pre-populated
  npm cache directory, containing every exact version in
  `speechy-client/package.json` / `package-lock.json`.

This is more moving parts than §2.2 — prefer shipping pre-built images
unless you have a specific reason not to.

## 3. Environment configuration

Copy `speechy-server/.env.example` → `speechy-server/.env` and fill in real
values. **Do not use `DATABASE_URL`** — `speechy/settings/base.py` never
reads it; it reads `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_HOST` /
`DB_PORT` individually (the example file previously listed `DATABASE_URL`,
which was dead and has been corrected).

| Variable | Used by | Notes |
|---|---|---|
| `SECRET_KEY` | Django | Long random string, unique per environment |
| `DEBUG` | Django | `False` in production |
| `ALLOWED_HOSTS` | Django | Comma-separated hostnames the API is served under |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | Django | `DB_HOST=db` when using the compose file |
| `REDIS_URL` | Django + Celery | `redis://redis:6379/0` when using the compose file |
| `CLIENT_ORIGIN` | CORS + SSO redirect target | Must be the exact origin the browser loads the client from (scheme+host+port) |
| `LLM_ENDPOINT` | `LLMClient` | **# EXTERNAL_URL** — your internal LLM gateway; never hardcoded |
| `LLM_MODEL`, `LLM_API_KEY` | `LLMClient` | |
| `PROMPTS_DIR` | prompt loader | `/prompts` when using the compose volume mount |
| `MEDIA_ROOT` | file storage | `/app/media` inside the container (persisted via the `media` volume) |

`speechy-client/.env.example` (`VITE_API_URL`) only matters at **build**
time — see §2.2.

Repo root also needs a `.env` (or exported shell vars) for
`docker-compose.yml` itself: `DB_PASSWORD` (required — compose will refuse
to start without it) and optionally `VITE_API_URL` if you're building the
client image via compose instead of pre-building per §2.2.

## 4. Running everything

A `docker-compose.yml` is provided at the repo root, wiring up `db`, `redis`,
`server-web`, `server-worker`, and `client`.

```bash
# first run
docker compose up -d db redis
docker compose run --rm server-web python manage.py migrate
docker compose run --rm server-web python manage.py createsuperuser
docker compose up -d
```

- **server-web**: gunicorn on port 8000, 2 workers × 4 threads (tune in
  `speechy-server/.docker/entrypoint.sh` for your host's CPU count). Runs
  `migrate` automatically on every start.
- **server-worker**: Celery consuming the same Redis broker. Scale with
  `docker compose up -d --scale server-worker=3`.
- **client**: nginx serving the pre-built SPA on port 3000 (mapped to
  container port 80). SPA routing fallback and long-lived asset caching are
  already configured in `speechy-client/.docker/nginx.conf`.
- **prompts**: edit files under `prompts/` on the host — since it's a
  read-only bind mount and prompts are loaded at task-execution time (not
  process startup), changes take effect on the *next* job with no restart.

### Running services without Docker (bare metal / VM)

If Docker itself isn't available in your target environment:

```bash
# server, from speechy-server/
python -m venv .venv && source .venv/bin/activate
pip install --no-index --find-links=/path/to/local/wheels -r requirements.txt
python manage.py migrate --settings=speechy.settings.production
gunicorn speechy.wsgi:application --bind 0.0.0.0:8000 --settings=speechy.settings.production
celery -A speechy worker --loglevel=info   # separate process/service

# client — build once (needs Node + the npm mirror from §2.3), then serve
# dist/ as static files from any web server (nginx, IIS, Apache) using the
# same SPA-fallback + caching rules as speechy-client/.docker/nginx.conf
```

Postgres and Redis need to be installed via your OS package manager's local
mirror or run as standalone containers even in this mode.

### Health checks

- `GET http://<server>:8000/api/auth/me/` → `401` with `{"error":{"missing":true}}` when no token (confirms the API + DB connection are up)
- `docker compose logs -f server-worker` → should show `celery@... ready.`
- `curl http://<client-host>:3000/` → SPA `index.html`

## 5. Replacing the mock SSO with your real SSO server

Speechy does not talk to ADFS itself, and doesn't need to. A separate
server you already operate does the full ADFS handshake and hands the
popup a **Speechy-compatible JWT directly** — signed with Speechy's own
secret, with the exact claims `HeaderJWTAuthentication` expects. From
Speechy's point of view, that server is just another JWT issuer it already
trusts. There is no ADFS-specific code, dependency, or setting to add to
`speechy-server` at all.

### 5.1 What exists today (to be removed)

- `speechy-server/apps/users/views.py` — `MockSSOView`: gets-or-creates a
  hardcoded `liorpo` user, mints a Speechy JWT via
  `SpeechyTokenObtainPairSerializer`, and redirects to
  `{CLIENT_ORIGIN}/sso/callback?token=...`.
- `speechy-server/apps/users/urls.py` — `path('auth/sso/mock/', MockSSOView.as_view(), name='sso-mock')`.
- Any test referencing `MockSSOView` or the hardcoded `liorpo` user.

Delete all three — once your real server is wired in, Speechy has no SSO
endpoint of its own to serve.

**What does *not* need to change:** `speechy-client/src/pages/SsoCallbackPage`
and the rest of `loginWithSSO()` in `speechy-client/src/api/auth.ts` (popup
lifecycle, message listener, `setToken`, redirect to `/dashboard`). That
plumbing already just waits for a `postMessage` carrying a `token` — it
doesn't care who minted it.

### 5.2 Client change: point the popup at your real server

`loginWithSSO()` already supports this via an env override — no code change
needed, just configuration:

```ts
// speechy-client/src/api/auth.ts (unchanged)
const ssoUrl =
  import.meta.env.VITE_SSO_URL ||
  `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/sso/mock/`;
```

Set `VITE_SSO_URL` to your real server's popup-entry URL. Remember this is
baked in at **client build time** (§2.2), not read from a runtime env var —
set it as a build arg when building the client image:

```bash
docker build -f speechy-client/.docker/Dockerfile \
  --build-arg VITE_API_URL=https://speechy.internal.example \
  --build-arg VITE_SSO_URL=https://your-sso-server.internal.example/login \
  -t speechy-client:latest speechy-client
```

(`speechy-client/.docker/Dockerfile` already declares `VITE_SSO_URL` as a
build `ARG`/`ENV` alongside `VITE_API_URL`.)

Your real server must still redirect the popup back to
`{CLIENT_ORIGIN}/sso/callback?token=<jwt>` — `SsoCallbackPage` only reads
`?token=` off its own URL and posts it to `window.opener`.

### 5.3 The trust boundary — what your server must get right

Since Speechy validates the token itself (`apps/users/authentication.py`,
`HeaderJWTAuthentication`, via `rest_framework_simplejwt.tokens.AccessToken`),
your SSO server's minted token must satisfy exactly what that code checks:

- **Signature**: signed with the *same* `SECRET_KEY` Speechy's Django
  settings use (default simplejwt signing is HMAC/HS256 against
  `SECRET_KEY`). This is the actual trust boundary between the two systems
  — treat this secret as sensitive as any other production credential, and
  make sure whoever owns the SSO server is getting it through a secure
  channel, not a shared doc.
- **`token_type` claim** must be `"access"` — simplejwt's `AccessToken`
  rejects tokens whose `token_type` claim doesn't match, treating them as
  invalid (→ `HeaderJWTAuthentication` returns `{'missing': True}`, and the
  client's `client.ts` interceptor wipes the token and bounces to
  `/login` — the exact symptom we already chased down once this session).
- **`exp` / `iat`** — standard simplejwt claims; expired tokens are
  rejected explicitly (see `_is_expired()` in `authentication.py`).
- **`user_id`** must be the UUID of a **row that already exists** in
  Speechy's `User` table (`authentication.py` does
  `User.objects.get(id=token['user_id'])` and raises `{'missing': True}`
  on `DoesNotExist`). Confirm with whoever owns the SSO server: does it
  provision the Speechy user first (e.g. via an admin API call into
  Speechy) before minting a token, or does Speechy need a
  just-in-time-provisioning step on first login? This isn't handled today
  — `MockSSOView` sidesteps it by hardcoding `get_or_create` for `liorpo`.
- **`permission_groups`** must be a list intersecting
  `ALLOWED_GROUPS = {'speechy_admins', 'speechy_viewers'}` in
  `authentication.py` — tokens with no matching group raise
  `{'unauthorized': True}`, which the client's interceptor routes to
  `/unauthorized` rather than `/login`.

### 5.4 The COOP gotcha applies to your server too

We hit this earlier with `MockSSOView`: Django's `SecurityMiddleware`
defaults to `Cross-Origin-Opener-Policy: same-origin`, which severs
`window.opener` the moment the popup loads a cross-origin response —
even if that response immediately redirects back to the client's origin.
If your SSO server is also Django (or any framework with a similarly
secure-by-default COOP policy), its response needs
`Cross-Origin-Opener-Policy: unsafe-none` on whatever hop happens while
the popup is on that server's origin, or `postMessage` back to Speechy's
client will silently fail exactly like it did during this session's mock
debugging.

### 5.5 Checklist

- [ ] `MockSSOView` + its `urls.py` route + any test referencing it — deleted
- [ ] Client image rebuilt with `--build-arg VITE_SSO_URL=<your real server's URL>`
- [ ] Confirmed with the SSO server's owner: same `SECRET_KEY`, `token_type: "access"`, valid `exp`/`iat`, `user_id` resolves to an existing Speechy user, `permission_groups` populated correctly
- [ ] Confirmed the SSO server's redirect response sets `Cross-Origin-Opener-Policy: unsafe-none` (or doesn't set a restrictive COOP at all)
- [ ] User provisioning story settled: who creates the Speechy `User` row before/on first SSO login
- [ ] Verify end-to-end: click "Login with SSO" → popup goes to your real server → authenticates against ADFS there → popup lands back on `/sso/callback?token=...` → dashboard loads with correct `permission_groups`
