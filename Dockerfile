FROM node:16-alpine AS base

WORKDIR /app

ENV TZ=America/Chicago

RUN chown -R node /app \
    && apk add --no-cache libc6-compat tzdata \
    && ln -s /lib/libc.musl-x86_64.so.1 /lib/ld-linux-x86-64.so.2

ADD ./ ./

RUN chown node:node -R ./

ENTRYPOINT node

FROM base as production

USER node

RUN npm install

EXPOSE 3000
