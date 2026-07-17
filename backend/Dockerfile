FROM node:20-alpine

WORKDIR /app

# для нативных зависимостей (pg, bcrypt)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]