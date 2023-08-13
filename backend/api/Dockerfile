FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV production

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 8080

CMD [ "node", "-r", "dotenv/config", "server.js", "dotenv_config_path=.env" ]