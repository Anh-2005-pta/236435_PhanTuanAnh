FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --foreground-scripts

COPY . .

ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["/bin/sh", "-c", "sed -i \"s/listen 80;/listen ${PORT:-80};/g\" /etc/nginx/conf.d/default.conf && printf 'window.__APP_CONFIG__ = { API_URL: \"%s\" };\\n' \"${API_URL:-}\" > /usr/share/nginx/html/env-config.js && exec nginx -g 'daemon off;'"]
