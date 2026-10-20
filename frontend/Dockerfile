# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Copy dependency files first so Docker caches the install layer
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx vitest run
RUN npm run build

# ---- Runtime stage ----
# Unprivileged image: Nginx runs as a non-root user and listens on 8080
FROM nginxinc/nginx-unprivileged:1.30.6-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
