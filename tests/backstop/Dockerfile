FROM node:24.2.0-bookworm

# Prevent interactive prompts from apt-get.
ARG DEBIAN_FRONTEND=noninteractive

ARG BACKSTOPJS_VERSION=6.3.25
ENV BACKSTOPJS_VERSION=$BACKSTOPJS_VERSION

# This version is the only version available on both arm64 and amd64 architectures as of June 2025.
ARG CHROMIUM_VERSION=135.0.7049.95-1~deb12u1
ENV CHROMIUM_VERSION=$CHROMIUM_VERSION

# Install all required packages.
RUN apt-get update && \
    # Install apt-mark for package locking.
    apt-get install -yq apt-utils && \
    # Install suggested requirements for running backstop in GitHub actions:
    # https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-on-gitlabci
    apt-get install -yq gconf-service libasound2 libatk1.0-0 libc6 libcairo2 \
    libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libgconf-2-4 \
    libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 \
    libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
    libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
    libxss1 libxtst6 ca-certificates fonts-liberation libnss3 lsb-release \
    xdg-utils wget && \
    # Install the Chromium with fixed versions, allowing downgrades and changes to held packages.
    apt-get install -yq --allow-downgrades --allow-change-held-packages \
    chromium=${CHROMIUM_VERSION} \
    chromium-common=${CHROMIUM_VERSION} \
    ca-certificates && \
    # Lock the Chromium packages to prevent automatic updates.
    apt-mark hold chromium chromium-common && \
    # Install backstopjs globally, skipping Chromium download since we installed it manually.
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm i -g backstopjs@${BACKSTOPJS_VERSION}

WORKDIR /src

ENTRYPOINT ["backstop"]