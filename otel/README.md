# Site Kit → OpenTelemetry PoC

Sends Site Kit's JavaScript errors, with their full message and stack trace,
to Google Cloud over OTLP. Errors land in Cloud Logging and are grouped in
Error Reporting.

The plugin builds standard OTLP records and knows nothing about Google Cloud.
Everything Google-specific lives in the service.

| Plugin (ships to every install) | |
| --- | --- |
| `includes/Core/Telemetry/Telemetry.php` | Endpoint and consent gate, passed to JS |
| `assets/js/util/otel/` | Builds and sends OTLP records |
| `assets/js/components/ErrorHandler/` | Reports caught React errors |
| `assets/js/components/OTLPTestError/` | PoC only: throws a test error on demand |

| Service (stand-in for the Site Kit Service) | |
| --- | --- |
| `otel/service/collector-config.yaml` | Shapes records for Error Reporting and forwards them |
| `otel/service/docker-compose.yml` | Runs the collector with your Google Cloud credentials |

In production the service runs on Google Cloud, so its credentials come from
its own service account rather than a mounted file.

## Setup

Once, with a Google Cloud project that has billing enabled:

```bash
gcloud auth login
gcloud services enable logging.googleapis.com telemetry.googleapis.com clouderrorreporting.googleapis.com --project YOUR_PROJECT_ID
gcloud auth application-default login
gcloud auth application-default set-quota-project YOUR_PROJECT_ID
cp otel/service/.env.example otel/service/.env   # then set GOOGLE_CLOUD_PROJECT
```

Then:

```bash
docker compose -f otel/service/docker-compose.yml up -d
npm run env:start                 # WordPress on :9002, admin / password
composer run autoload-includes    # registers the new Telemetry class
npm run dev

# Reporting requires the tracking opt-in.
docker exec -u xfs googlesitekit-e2e-cli-1 wp user meta update 1 wp_googlesitekit_tracking_optin 1
```

## Producing an error

Open any Site Kit screen with the trigger parameter:

```
http://localhost:9002/wp-admin/admin.php?page=googlesitekit-splash&googlesitekit-otel-test=1
```

Within a minute the error appears in Error Reporting, and in Logs Explorer
under the log name `site-kit-wp`. Error attributes are labels on the entry;
the plugin, WordPress and PHP versions are under `otel.resource.attributes`.

The plugin posts to `http://localhost:4318` by default. Set
`GOOGLESITEKIT_OTLP_ENDPOINT` in `wp-config.php` to send elsewhere, or to an
empty string to turn reporting off.

## Not in the PoC

- **Redaction, sampling and rate limiting.** These are service
  responsibilities in production. The plugin sends records unscrubbed, as the
  existing Google Analytics error events do.
- **Source maps.** Dev builds are not minified, so stack traces here read
  better than a real user's would.
- **PHP errors.** Only the browser emits. No OpenTelemetry SDK is used: the
  JavaScript logs packages are still experimental (0.x). The PHP SDK's 1.0.x
  line supports PHP 7.4 but has had no release since February 2024.
