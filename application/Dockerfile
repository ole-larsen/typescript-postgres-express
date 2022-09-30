# syntax = .docker/dockerfile:1.0-experimental
## production stage
FROM nginx:stable-alpine as production-stage
RUN apk add --update nodejs npm unzip curl && rm -rf /var/cache/apk/*
WORKDIR /var/www/application
COPY . .
RUN npm install && npm run build
EXPOSE 80
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]
