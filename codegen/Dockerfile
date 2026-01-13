FROM alpine/git:v2.52.0 AS googleapis-repo
WORKDIR /tmp
ARG LIBRARY_SHA
RUN mkdir library \
	&& cd library \
	&& git init --quiet \
	&& git remote add origin https://github.com/googleapis/google-api-php-client-services.git \
	&& git fetch --quiet --depth 1 origin ${LIBRARY_SHA} \
	&& git checkout FETCH_HEAD

FROM python:3.14-alpine
WORKDIR /usr/src/app
COPY --from=googleapis-repo /tmp/library/generator /usr/src/app/
RUN python3 -m pip install -e ./ --user --use-pep517
ENTRYPOINT ["python3", "-m", "googleapis.codegen"]
