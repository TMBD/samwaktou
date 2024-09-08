FROM node:20 AS build

WORKDIR /app

COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --silent

COPY . ./

# Set the environment to production
ENV NODE_ENV=production

##### Build the Vite app for production
RUN npm run build

##### Build the Vite app for testing
# RUN npm run build-for-testing

#-----------------------------------------------------------

FROM node:20-alpine

# Install 'serve' to serve static files
RUN npm install -g serve

WORKDIR /app

# Copy the build artifacts from the build stage
COPY --from=build /app/dist ./public

# Expose the port on which the app will run
EXPOSE 3000

CMD ["serve", "-s", "public", "-l", "3000"]
