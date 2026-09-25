# Site Kit → OpenTelemetry PoC

A working local model of the error-reporting pipeline proposed in the
OpenTelemetry design doc. Clone the branch, run four commands, break something
in Site Kit on purpose, and watch a full stack trace arrive in a real
observability UI — with no Google infrastructure and no cloud provisioning.

The point is to make the proposal concrete. Everything here runs on a laptop,
but the shape is the shape we are proposing for production.

## What this maps onto

| PoC | Production |
| --- | --- |
| Site Kit browser JS + PHP | same |
| `collector` container | **Site Kit Service proxy** |
| `lgtm` container (Loki/Grafana) | Google Cloud Observability |

The middle row is the ask. Site Kit runs on millions of installs we do not own
and cannot update on demand, so redaction, sampling and rate limiting have to
happen on the one hop we control. In the PoC that hop is an OpenTelemetry
Collector; in production it is SK Service. `collector-config.yaml` is heavily
commented and is the fastest way to see what that job actually involves.

## Setup

```bash
# 1. The telemetry backend (Grafana on :3000, OTLP intake on :4318)
docker compose -f otel/docker-compose.yml up -d

# 2. WordPress with Site Kit (:9002, admin/password) — existing tooling
npm run env:start

# 3. Build the plugin
npm run dev
```

No plugin configuration is needed: the endpoint defaults to the local
collector, following the same pattern `Google_Proxy` uses for the proxy URL.
Override it — or switch reporting off — with a constant in `wp-config.php`:

```php
define( 'GOOGLESITEKIT_OTLP_ENDPOINT', 'http://collector.example.com:4318' );
define( 'GOOGLESITEKIT_OTLP_ENDPOINT', '' ); // disables reporting
```

Reporting still requires the existing tracking opt-in, so a user who has not
consented emits nothing regardless of the endpoint.

### Producing an error

Error reporting is the one feature that cannot be verified by using the
product normally — you need a bug to observe it. Append the trigger parameter
to any Site Kit admin screen:

```
http://localhost:9002/wp-admin/admin.php?page=googlesitekit-splash&googlesitekit-otel-test=1
```

This throws inside a React render, so it exercises the real
`ErrorHandler` → `reportError` → OTLP path rather than a shortcut through it.
The component is inert unless reporting is enabled *and* the parameter is
present.

Reporting also requires the tracking opt-in. To grant it without clicking
through the UI:

```bash
docker exec -u xfs googlesitekit-e2e-cli-1 wp user meta update 1 wp_googlesitekit_tracking_optin 1
```

Then open the triage viewer:

**<http://localhost:8080>**

To see it with realistic volume without breaking anything by hand:

```bash
node otel/seed-errors.js 400
```

Grafana is also running at <http://localhost:3000> (no login) for ad-hoc
queries — `{service_name="site-kit-wp"}` — but the viewer is the thing to
look at. Grafana is a general observability tool and shows a log stream; the
argument this PoC has to make is about the review workflow, which means
showing distinct bugs rather than a stream of events.

## Verifying without WordPress

The pipeline can be exercised directly, which is useful for confirming the
backend works before involving the plugin:

```bash
sed "s/TIMESTAMP_NS/$(date +%s)000000000/" otel/sample-record.json | curl -X POST http://localhost:4318/v1/logs -H 'Content-Type: application/json' -d @-
```

(The timestamp is substituted at send time because Loki rejects records dated
outside its retention window — a stale fixture silently ingests nothing.)

Then watch it move through the collector:

```bash
docker compose -f otel/docker-compose.yml logs -f collector
```

## Redaction

`sample-record.json` deliberately contains a Google OAuth token, an email
address and a hosting path with a real-looking account name. All three are
stripped by the collector before storage — check the `debug` exporter output
above and compare it to the file. That is the second of two redaction layers;
the first runs in the plugin, before anything leaves the site.

Two layers is deliberate. The plugin-side pass is the one that matters
legally, because the data never leaves the user's server. The collector-side
pass is the one we can fix in minutes instead of waiting years for installs to
update.

## Teardown

```bash
docker compose -f otel/docker-compose.yml down
```

## The viewer

`viewer/index.html` is a single static page, ~290 lines, no dependencies. It
queries Loki, groups records by `sitekit.fingerprint`, and lists distinct
issues with event counts, affected sites and affected versions.

It exists to make the gap in the proposal visible. OpenTelemetry deliberately
does not define this layer: it moves telemetry and standardises its shape, but
deciding that two records are "the same bug" and presenting that to a human is
a product concern. Sentry's real value is that layer, not its transport — so a
proposal that replaces Sentry with OTel has to say where the layer comes from.
This page is the cheapest possible answer, and it is here so the doc can show
the gap rather than describe it.

## Status

- [x] Collector + backend, redaction verified end to end
- [x] Browser emitter (`assets/js/util/otel/`)
- [x] Client-side fingerprinting
- [x] Triage viewer + seeder
- [x] End-to-end verified from a real WordPress install on **PHP 7.4.16**
- [ ] PHP emitter (`includes/Core/Telemetry/` — endpoint plumbing done, emission not yet)
- [ ] Symbolication (see the design doc — minified stacks remain unreadable)

## A note on PHP 7.4

The local environment runs PHP 7.4.16, which is Site Kit's declared minimum.
The OpenTelemetry PHP SDK requires 8.1 and cannot be installed here at all.
Everything in this PoC works on 7.4 because it emits OTLP by hand rather than
through an SDK — which is the concrete form of the argument that Site Kit
should adopt the protocol and the data model without adopting the libraries.

## Known PoC-only constraints

- **Seeded events span 45 minutes, not days.** Loki rejects entries more than
  about an hour behind the head of a stream. This is a property of the
  stand-in storage, not of the pipeline or of OTLP.
- **No persistence.** `docker compose down` discards all data.
- **Adding a PHP class requires regenerating the autoloader.** Site Kit uses
  an authoritative classmap, so a new class is invisible until
  `composer run autoload-includes` has run. Symptom is a fatal error naming
  the missing class.
- **Dev builds ship source maps, production builds do not.** Stack traces in
  this PoC are therefore more readable than a real user's would be. The
  seeded records deliberately contain minified frames so the demo does not
  overstate its own case.
