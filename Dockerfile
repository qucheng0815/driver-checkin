FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p /app/db

EXPOSE 3000

CMD ["node", "server.js"]
