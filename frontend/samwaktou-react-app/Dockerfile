FROM node:20 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --silent
COPY . ./
RUN npm run build

FROM node:20-alpine
RUN npm install -g serve
WORKDIR /app
COPY --from=build /app/build ./public
EXPOSE 3000

CMD ["serve", "-s", "public", "-l", "3000", "-p", "3000"]