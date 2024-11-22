FROM alpine:3.17

ARG BACKSTOPJS_VERSION=6.1.1

ENV BACKSTOPJS_VERSION=$BACKSTOPJS_VERSION

RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      nodejs \
      npm \ 
      openrc \
      dbus

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN apk upgrade --no-cache --available && \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm i -g backstopjs@${BACKSTOPJS_VERSION} && \
    npm cache clean -f && \
    rm -rf /root/.cache && \
    rc-update add dbus

WORKDIR /src

ENTRYPOINT ["backstop"]
