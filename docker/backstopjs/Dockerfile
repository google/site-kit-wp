FROM alpine:3.17

ARG BACKSTOPJS_VERSION=6.1.1

ENV BACKSTOPJS_VERSION=$BACKSTOPJS_VERSION

RUN apk upgrade --no-cache --available && \
    apk add --no-cache chromium nodejs npm && \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm i -g backstopjs@${BACKSTOPJS_VERSION} && \
    npm cache clean -f && \
    rm -rf /root/.cache

RUN apk add --no-cache openrc dbus
RUN rc-update add dbus

WORKDIR /src

ENTRYPOINT ["backstop"]
