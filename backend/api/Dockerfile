FROM node:20-alpine AS build

WORKDIR /app

COPY . ./

RUN npm ci

RUN npm run tsc

# ---------------------------------------

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Set the NODE_ENV environment variable to production to optimize the build for production
ENV NODE_ENV production

# Install dependencies
RUN npm ci

# Remove development dependencies to keep the final image small
RUN npm prune --omit=dev

# Copy .js file only from the dist folder of the previous build stage
COPY --from=build /app/dist ./dist/

##### Copy the prod env variables
COPY .env ./

##### Copy the dev env variables
# COPY .env.development ./

EXPOSE 8080

##### Start the application in production mode
CMD [ "node", "-r", "dotenv/config", "./dist/server.js", "dotenv_config_path=.env" ]

##### Start the application in dev mode
# CMD [ "node", "-r", "dotenv/config", "./dist/server.js", "dotenv_config_path=.env.development" ]

