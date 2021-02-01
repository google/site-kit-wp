FROM wordpress

RUN apt-get update && apt-get install -y libmemcached-dev zlib1g-dev \
  && pecl install memcached \
  && docker-php-ext-enable memcached
