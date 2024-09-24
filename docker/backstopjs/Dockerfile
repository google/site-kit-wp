# Stage 1: Build
FROM alpine:3.17 AS builder

ARG BACKSTOPJS_VERSION=6.1.1
ENV BACKSTOPJS_VERSION=$BACKSTOPJS_VERSION

RUN apk upgrade --no-cache --available && \
    apk add --no-cache openrc dbus chromium nodejs npm && \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install -g backstopjs@${BACKSTOPJS_VERSION} && \
    npm cache clean -f && \
    rm -rf /root/.cache && \
    rc-update add dbus

# Stage 2: Runtime
FROM alpine:3.17

# Install only the necessary runtime dependencies
RUN apk add --no-cache openrc dbus chromium nodejs

# Copy BackstopJS from the builder stage
COPY --from=builder /usr/local/lib/node_modules/backstopjs /usr/local/lib/node_modules/backstopjs
COPY --from=builder /usr/local/bin/backstop /usr/local/bin/backstop

# Create working directory
WORKDIR /src

ENTRYPOINT ["backstop"]
