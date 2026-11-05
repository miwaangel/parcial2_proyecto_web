# API (Node.js + Express). La configuracion llega por variables de entorno (docker-compose.yml).
FROM node:22-alpine

WORKDIR /app

# Primero solo las dependencias, para aprovechar la cache de Docker
COPY package.json package-lock.json ./
# Incluye devDependencies porque sequelize-cli (migraciones y seeders) es una de ellas
RUN npm ci

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

# Al arrancar: crea/actualiza tablas, carga los datos iniciales (solo la primera vez,
# Sequelize recuerda que seeders ya corrieron) y levanta la API.
CMD ["sh", "-c", "npx sequelize-cli db:migrate && npx sequelize-cli db:seed:all && node src/server.js"]
