# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# The API URL is baked into the static build at build time.
# Override with --build-arg VITE_API_URL=https://your-api-domain/api/v1
ARG VITE_API_URL=http://localhost:4000/api/v1
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# --- Production stage: serve the static build with nginx ---
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
