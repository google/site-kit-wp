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
    libgdk-pixbuf2.0-0=2.40.2-2 libglib2.0-0=2.66.8-1+deb11u5 libgtk-3-0=3.24.24-4+deb11u4 libnspr4=2:4.29-1 libpango-1.0-0=1.46.2-3 \
    libpangocairo-1.0-0=1.46.2-3 libstdc++6=10.2.1-6 libx11-6=2:1.7.2-1+deb11u2 libx11-xcb1=2:1.7.2-1+deb11u2 libxcb1=1.14-3 libxcomposite1=1:0.4.5-1 \
    libxcursor1=1:1.2.0-2 libxdamage1=1:1.1.5-2 libxext6=2:1.3.3-1.1 libxfixes3=1:5.0.3-2 libxi6=2:1.7.10-1 libxrandr2=2:1.5.1-1 libxrender1=1:0.9.10-1 \
    libxss1=1:1.2.3-1 libxtst6=2:1.2.3-1 ca-certificates=20210119 fonts-liberation=1:1.07.4-11 libnss3=2:3.61-1+deb11u4 lsb-release=11.1.0 \
    xdg-utils=1.1.3-4.1 wget=1.21-1+deb11u1

# Install the Chromium requirements, specify a Chromium build for stability.
RUN apt-get install -yq \
    chromium=120.0.6099.224-1~deb11u1 \
    ca-certificates

RUN PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm i -g backstopjs@${BACKSTOPJS_VERSION} && \
    npm cache clean -f && \
    rm -rf /root/.cache

WORKDIR /src

ENTRYPOINT ["backstop"]
