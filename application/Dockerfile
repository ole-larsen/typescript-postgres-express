# syntax = docker/dockerfile:1.0-experimental
## production stage
FROM nginx:stable-alpine as production-stage
RUN apk add --update nodejs npm unzip && rm -rf /var/cache/apk/*
WORKDIR /var/www/application
COPY . .
RUN --mount=type=cache,id=npm-cache,target=/root/.cache --mount=type=cache,id=dot-npm,target=/root/.npm npm install && npm run build
EXPOSE 80
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]
