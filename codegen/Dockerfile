FROM python:3.14-alpine

RUN apk add --no-cache git

WORKDIR /tmp

ARG LIBRARY_SHA
RUN mkdir library \
	&& cd library \
	&& git init --quiet \
	&& git remote add origin https://github.com/googleapis/google-api-php-client-services.git \
	&& git fetch --quiet --depth 1 origin ${LIBRARY_SHA} \
	&& git checkout FETCH_HEAD

RUN mv library/generator /usr/src/app \
	&& rm -rf library

WORKDIR /usr/src/app

RUN python3 -m pip install -e ./ --user --use-pep517

ENTRYPOINT ["python3", "-m", "googleapis.codegen"]
