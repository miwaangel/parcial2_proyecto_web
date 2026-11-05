# Frontend (React + Vite): se compila y se sirve como sitio estatico con nginx.

# --- Etapa 1: compilar ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite mete estas variables en el codigo al compilar (por eso son ARG de build)
ARG VITE_API_URL=http://localhost:3000/api
ARG VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
ENV VITE_API_URL=$VITE_API_URL \
    VITE_USE_MOCKS=false \
    VITE_RECAPTCHA_SITE_KEY=$VITE_RECAPTCHA_SITE_KEY

RUN npm run build

# --- Etapa 2: servir ---
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
