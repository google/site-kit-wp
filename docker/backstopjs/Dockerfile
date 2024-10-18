FROM node:14.20.1-alpine3.15

ARG BACKSTOPJS_VERSION=6.1.1
ENV BACKSTOPJS_VERSION=$BACKSTOPJS_VERSION

RUN apk update

# Specify a Chromium build for stability.
RUN apk add --no-cache \
    chromium=99.0.4844.84-r0 \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    npm \ 
    openrc \
    dbus

RUN PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm i -g backstopjs@${BACKSTOPJS_VERSION} && \
    npm cache clean -f && \
    rm -rf /root/.cache

WORKDIR /src

ENTRYPOINT ["backstop"]
