FROM wordpress:php7.4-apache

ARG WP_VERSION=latest

RUN set -eux; \
    apt-get update && apt-get install -y --no-install-recommends unzip default-mysql-client && rm -rf /var/lib/apt/lists/*; \
    if [ "$WP_VERSION" = "nightly" ]; then \
        curl -fsSL "https://wordpress.org/nightly-builds/wordpress-latest.zip" -o /tmp/wordpress.zip; \
        unzip -o /tmp/wordpress.zip -d /tmp; \
        rm /tmp/wordpress.zip; \
    elif [ "$WP_VERSION" = "latest" ]; then \
        curl -fsSL "https://wordpress.org/latest.tar.gz" -o /tmp/wordpress.tar.gz; \
        tar -xzf /tmp/wordpress.tar.gz -C /tmp; \
        rm /tmp/wordpress.tar.gz; \
    else \
        curl -fsSL "https://wordpress.org/wordpress-${WP_VERSION}.tar.gz" -o /tmp/wordpress.tar.gz; \
        tar -xzf /tmp/wordpress.tar.gz -C /tmp; \
        rm /tmp/wordpress.tar.gz; \
    fi; \
    cp -a /tmp/wordpress/. /usr/src/wordpress/; \
    rm -rf /tmp/wordpress; \
    curl -fsSL "https://downloads.wordpress.org/theme/twentynineteen.latest-stable.zip" -o /tmp/twentynineteen.zip; \
    unzip -o /tmp/twentynineteen.zip -d /usr/src/wordpress/wp-content/themes/; \
    rm /tmp/twentynineteen.zip; \
    curl -fsSL "https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar" -o /usr/local/bin/wp; \
    chmod +x /usr/local/bin/wp
