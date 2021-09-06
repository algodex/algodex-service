FROM node:15-alpine AS builder
EXPOSE 3000

WORKDIR /app
ADD ./ ./

RUN chown -R node /app && apk add libc6-compat && ln -s /lib/libc.musl-x86_64.so.1 /lib/ld-linux-x86-64.so.2



ENTRYPOINT node

FROM builder as production
USER node

RUN npm install
