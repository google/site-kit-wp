FROM node:14.21.1-bullseye

# Prevent intractive prompts from apt-get.
ARG DEBIAN_FRONTEND=noninteractive

ARG BACKSTOPJS_VERSION=6.1.1
ENV BACKSTOPJS_VERSION=$BACKSTOPJS_VERSION

RUN apt-get update

# Install suggested requirements for running backstop in GitHub actions.
# https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-on-gitlabci
RUN apt-get install -yq gconf-service libasound2 libatk1.0-0 libc6 libcairo2 \
    libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libgconf-2-4 \
    libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 \
    libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
    libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
    libxss1 libxtst6 ca-certificates fonts-liberation libnss3 lsb-release \
    xdg-utils wget

# Install the Chromium requirements, specify a Chromium build for stability.
RUN apt-get install -yq \
    chromium=120.0.6099.224-1~deb11u1 \
    ca-certificates \
    nodejs \
    npm

RUN PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm i -g backstopjs@${BACKSTOPJS_VERSION} && \
    npm cache clean -f && \
    rm -rf /root/.cache

WORKDIR /src

ENTRYPOINT ["backstop"]
