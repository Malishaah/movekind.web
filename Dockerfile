# Bygg
FROM node:20-alpine AS build
WORKDIR /app
COPY movekind.web/package*.json ./
RUN npm ci
COPY movekind.web ./
RUN npm run build

# Runtime
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache curl
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "run", "start"]
