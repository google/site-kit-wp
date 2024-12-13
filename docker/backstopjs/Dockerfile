FROM node:16.14.2-bullseye

# Prevent intractive prompts from apt-get.
ARG DEBIAN_FRONTEND=noninteractive

ARG BACKSTOPJS_VERSION=6.1.1
ENV BACKSTOPJS_VERSION=$BACKSTOPJS_VERSION

RUN apt-get update

# Install suggested requirements for running backstop in GitHub actions.
# https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-on-gitlabci
RUN apt-get install -yq gconf-service=3.2.6-7 libasound2=1.2.4-1.1 libatk1.0-0=2.36.0-2 libc6=2.31-13+deb11u11 libcairo2=1.16.0-5 \
    libcups2=2.3.3op2-3+deb11u9 libdbus-1-3=1.12.28-0+deb11u1 libexpat1=2.2.10-2+deb11u6 libfontconfig1=2.13.1-4.2 libgbm1=20.3.5-1 libgcc1 libgconf-2-4=3.2.6-7 \
    libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 \
    libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
    libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
    libxss1 libxtst6 ca-certificates fonts-liberation libnss3 lsb-release \
    xdg-utils wget

# Install the Chromium requirements, specify a Chromium build for stability.
RUN apt-get install -yq \
    chromium=120.0.6099.224-1~deb11u1 \
    ca-certificates

RUN PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm i -g backstopjs@${BACKSTOPJS_VERSION} && \
    npm cache clean -f && \
    rm -rf /root/.cache

WORKDIR /src

ENTRYPOINT ["backstop"]
