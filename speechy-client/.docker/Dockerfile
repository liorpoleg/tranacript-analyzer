# Build from the speechy-client/ directory:
#   docker build -f .docker/Dockerfile --build-arg VITE_API_URL=https://api.example.com -t speechy-client .
#
# VITE_API_URL is baked into the bundle at build time.

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

# Optional override so the SSO popup opens a real SSO server instead of
# speechy-server's own mock endpoint — see DEPLOYMENT.md §5.
ARG VITE_SSO_URL=
ENV VITE_SSO_URL=$VITE_SSO_URL

COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

COPY . .
RUN npm run build

# ── Stage 2: serve ────────────────────────────────────────────────────────────
FROM nginx:1.25-alpine

COPY .docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# OpenShift's restricted SCC runs the container as an arbitrary, non-root
# UID belonging to group 0 — nginx normally needs root to write its pid file
# and runtime cache/log dirs, so re-point those at group-writable locations
# and drop privileges. Still works unmodified under plain Docker/Compose.
RUN touch /var/run/nginx.pid && \
    chgrp -R 0 /var/cache/nginx /var/run/nginx.pid /var/log/nginx /usr/share/nginx/html && \
    chmod -R g=u /var/cache/nginx /var/run/nginx.pid /var/log/nginx /usr/share/nginx/html

USER 1001

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
