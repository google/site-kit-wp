FROM node:alpine

ARG BACKSTOPJS_VERSION=6.1.1

ENV BACKSTOPJS_VERSION=$BACKSTOPJS_VERSION

RUN apk upgrade --no-cache --available && \
    apk add --no-cache chromium fontconfig freetype ttf-liberation && \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm i -g backstopjs@${BACKSTOPJS_VERSION} && \
    npm cache clean -f && \
    rm -rf /root/.cache

WORKDIR /src

ENTRYPOINT ["backstop"]
