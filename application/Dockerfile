ARG NODE_VERSION=16.18.1

FROM node:${NODE_VERSION}-alpine AS node
FROM nginx:stable-alpine as production-stage

COPY --from=node /usr/lib /usr/lib
COPY --from=node /usr/local/share /usr/local/share
COPY --from=node /usr/local/lib /usr/local/lib
COPY --from=node /usr/local/include /usr/local/include
COPY --from=node /usr/local/bin /usr/local/bin

RUN apk add --update nodejs npm unzip curl && rm -rf /var/cache/apk/*
WORKDIR /var/www/application
COPY . .
RUN node -v && npm install && npm run build
EXPOSE 80
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]
