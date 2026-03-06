FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY --from=builder /app/dist ./dist
COPY vite.config.js .

EXPOSE 5173
CMD ["npm", "run", "preview"]
