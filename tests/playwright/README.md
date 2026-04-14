# Site Kit Playwright E2E Tests

End-to-end tests for the Site Kit WordPress plugin, built on [Playwright](https://playwright.dev/) with a Docker-based WordPress environment.

## Table of Contents

-   [Overview](#overview)
-   [Directory Structure](#directory-structure)
-   [How It Works](#how-it-works)
    -   [Per-Test Database Isolation](#per-test-database-isolation)
    -   [Cookie-Based Routing](#cookie-based-routing)
    -   [Authentication Without Login](#authentication-without-login)
    -   [Plugin Activation via Database](#plugin-activation-via-database)
    -   [Feature Flags](#feature-flags)
    -   [Google API Fixtures](#google-api-fixtures)
    -   [Email Testing](#email-testing)
    -   [Reference Date](#reference-date)
    -   [PHP Error Logging](#php-error-logging)
-   [Running Tests](#running-tests)
-   [Writing Tests](#writing-tests)
    -   [Basic Test Structure](#basic-test-structure)
    -   [The `wp` Fixture](#the-wp-fixture)
    -   [Test Annotations](#test-annotations)
    -   [Navigation Helpers](#navigation-helpers)
    -   [Plugin Management](#plugin-management)
    -   [REST API Helpers](#rest-api-helpers)
    -   [Email Assertions](#email-assertions)
-   [Test Infrastructure](#test-infrastructure)
    -   [Docker Services](#docker-services)
    -   [Docker Compose Profiles](#docker-compose-profiles)
    -   [Must-Use Plugins](#must-use-plugins)
    -   [Test Helper Plugins](#test-helper-plugins)
    -   [Database Snapshot](#database-snapshot)
    -   [Generating the Database Snapshot](#generating-the-database-snapshot)
-   [Artifacts and Reporting](#artifacts-and-reporting)
-   [CI / GitHub Actions](#ci--github-actions)

---

## Overview

This infrastructure enables fast, fully isolated, repeatable E2E tests without restarting WordPress between tests. Key design principles:

-   **Per-test database isolation** — each test gets its own fresh database cloned from a snapshot.
-   **No real login** — authentication is handled via cookies, bypassing the login flow entirely.
-   **Plugin state via database** — plugins are activated/deactivated by writing directly to `wp_options`, not through the admin UI.
-   **Annotation-driven configuration** — tests declare their requirements (plugins, user, feature flags, fixtures) as Playwright annotations, keeping setup out of test bodies.
-   **Google API mocking** — a local fixtures service intercepts all Google API calls and returns pre-recorded responses.
-   **Email capture** — a Mailpit SMTP server captures all outgoing emails for assertion in tests.
-   **Fixed reference date** — a must-use plugin fixes the WordPress reference date to `2026-01-01` for deterministic time-based tests.

---

## Directory Structure

```
tests/playwright/
├── artifacts/                          # Generated test outputs (gitignored)
│   ├── playwright-html/                # HTML test report
│   └── playwright-output/             # Screenshots and traces on failure
├── bin/
│   └── generate-backup-sql.sh          # Script to regenerate the DB snapshot
├── config/
│   └── viewports.ts                    # Viewport helpers (mobile, tablet, desktop, large)
├── docker/                             # Docker runtime assets
│   ├── fixtures/                       # Google API mock service
│   │   ├── data/                       # Per-fixture JSON response files keyed by API host
│   │   │   └── email-reporting/
│   │   │       └── weekly-report-data/
│   │   │           └── searchconsole.googleapis.com.json
│   │   ├── Dockerfile
│   │   ├── index.ts                    # Express server: routes requests to fixture JSON
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── mariadb/
│   │   └── backup.sql                  # WordPress DB snapshot (loaded on container init)
│   └── wordpress/
│       ├── Dockerfile                  # Custom WordPress image (configurable WP version)
│       ├── db.php                      # DB drop-in: routes connections and logs PHP errors
│       ├── mu-plugins/
│       │   ├── e2e-authenticate-admin.php  # Authenticates user via cookie
│       │   ├── e2e-feature-flags.php       # Enables feature flags via cookie
│       │   ├── e2e-fixtures.php            # Disables SSL verification, forwards fixture header
│       │   └── e2e-reference-date.php      # Fixes reference date to 2026-01-01
│       └── plugins/                    # Test helper plugins (auto-mounted)
│           ├── email-reporting.php     # REST endpoint to trigger email reporting cron
│           ├── gcp-credentials.php     # Mock GCP OAuth credentials
│           ├── mailpit.php             # Routes wp_mail() through Mailpit SMTP
│           ├── proxy-auth.php          # Fakes proxy authentication state
│           └── proxy-credentials.php  # Mock proxy OAuth credentials
├── specs/                              # Test files
│   ├── email-reporting/
│   │   └── email-reporting.spec.ts
│   └── plugin-activation.spec.ts
├── wordpress/                          # TypeScript test utilities
│   ├── index.ts                        # Re-exports
│   ├── args.ts                         # WordPressArgs type
│   ├── wordpress.ts                    # WordPress class (main fixture object)
│   ├── database.ts                     # Per-test DB create/drop and error log retrieval
│   ├── cookies.ts                      # Test routing cookies
│   ├── plugins.ts                      # Plugin activation via DB
│   ├── options.ts                      # Annotation helpers (withPlugins, asUser, withFeatureFlags, withFixtures)
│   ├── mailpit.ts                      # Mailpit email client
│   └── error-log-ignore-list.ts        # Known PHP errors to ignore per WP version
├── docker-compose.yml
├── package.json
├── playwright.config.ts
└── playwright.ts                       # Custom test fixture exporting `test` and `expect`
```

---

## How It Works

### Per-Test Database Isolation

Each test runs against its own isolated MySQL database. The flow is:

1. **Before the test:** `WordPressDatabase.create()` generates a unique database name from the Playwright test ID (format: `wp_<sanitized_test_id>`), creates the database, and restores it from `docker/mariadb/backup.sql`.
2. **During the test:** A `_wp_test_db` cookie tells the WordPress `db.php` drop-in which database to use for that request.
3. **After the test:** `WordPressDatabase.drop()` deletes the test database.

This means all tests can run in parallel without interfering with each other, and every test starts from the same known-good database state.

### Cookie-Based Routing

`docker/wordpress/db.php` is a [WordPress database drop-in](https://developer.wordpress.org/reference/classes/wpdb/) loaded before WordPress bootstraps. It reads the `_wp_test_db` cookie from the incoming HTTP request and overrides the `$wpdb` connection to use that test-specific database.

The `WordPressCookies` class injects these cookies into the Playwright browser context before the test navigates to any page:

-   `_wp_test_db` — database name for this test (always set)
-   `_wp_test_user` — username to authenticate as (set when `_wp:as-user` annotation is present)
-   `_wp_test_feature_flags` — comma-separated list of enabled feature flags (set when `_wp:feature-flags` annotation is present)
-   `_wp_test_fixtures` — fixture set name for Google API mocking (set when `_wp:fixtures` annotation is present)

### Authentication Without Login

`docker/wordpress/mu-plugins/e2e-authenticate-admin.php` hooks into WordPress's `determine_current_user` filter. It reads the `_wp_test_user` cookie (defaulting to `admin` if absent) and sets the corresponding WordPress user as the currently authenticated user — no actual login flow required.

On `wp-admin` pages, `wp_set_auth_cookie()` is called to persist the session, ensuring redirect flows work correctly.

This means tests never need to fill in a username/password form, making them faster and more reliable.

### Plugin Activation via Database

`WordPressPlugins` activates and deactivates plugins by directly reading and writing the `active_plugins` option in `wp_options` (as a PHP-serialized array). This avoids the overhead of navigating the WordPress admin UI for plugin management.

Plugins specified via the `withPlugins()` annotation are activated automatically during test setup, before the test body runs.

### Feature Flags

`docker/wordpress/mu-plugins/e2e-feature-flags.php` hooks into the `googlesitekit_is_feature_enabled` filter at priority 999. It reads the `_wp_test_feature_flags` cookie (a comma-separated list of flag names) and forces those flags to return `true`.

Use the `withFeatureFlags()` annotation to enable flags for a test:

```typescript
import { withFeatureFlags } from '../wordpress';

test(
    'feature behind a flag',
    { annotation: withFeatureFlags( 'myFeatureFlag' ) },
    async ( { wp } ) => { ... }
);
```

### Google API Fixtures

A local Node.js service (`docker/fixtures/`) intercepts all Google API calls made by WordPress and returns pre-recorded JSON responses. The service is configured as a DNS alias for the following hosts on the internal Docker network:

-   `analyticsadmin.googleapis.com`
-   `analyticsdata.googleapis.com`
-   `searchconsole.googleapis.com`
-   `oauth2.googleapis.com`
-   `tagmanager.googleapis.com`
-   `adsense.googleapis.com`
-   `pagespeedonline.googleapis.com`
-   `subscribewithgoogle.googleapis.com`
-   `www.googleapis.com`
-   `storage.googleapis.com`

**How fixture data works:**

1. Create a directory under `docker/fixtures/data/<fixture-name>/` with one JSON file per API host (e.g., `searchconsole.googleapis.com.json`).
2. Each file contains an array of `{ request, response }` pairs matched by URL path.
3. Use the `withFixtures()` annotation to activate a fixture set for a test.
4. The `e2e-fixtures.php` mu-plugin disables SSL certificate verification and forwards the `_wp_test_fixtures` cookie value as a `X-WP-Test-Fixtures` request header to the fixtures service.
5. The fixtures service routes responses based on that header.

The service also handles Google's multipart batch request format, dispatching each sub-request to its corresponding fixture entry.

Use the `withFixtures()` annotation:

```typescript
import { withFixtures } from '../wordpress';

test(
    'test with mocked API data',
    { annotation: withFixtures( 'email-reporting/weekly-report-data' ) },
    async ( { wp } ) => { ... }
);
```

### Email Testing

A [Mailpit](https://github.com/axllent/mailpit) service (v1.29.2) captures all outgoing emails sent by WordPress via SMTP.

**How it works:**

1. Activate the `mailpit.php` test helper plugin via `withPlugins('mailpit.php')` — this redirects `wp_mail()` to Mailpit's SMTP server on port 1025 and sets the sender address to `<database-name>@example.com`.
2. Use `wp.mailpit` (a `Mailpit` instance) to assert on received emails in your test.
3. After the test, any emails sent by this test are automatically deleted from Mailpit.

The `Mailpit` class uses Mailpit's [search API](https://mailpit.axllent.org/docs/api-v1/) to scope queries to the current test's sender address, so parallel tests never see each other's emails.

See [Email Assertions](#email-assertions) for usage examples.

### Reference Date

`docker/wordpress/mu-plugins/e2e-reference-date.php` fixes the WordPress reference date to `2026-01-01 00:00:00`. This ensures that any date-dependent logic in Site Kit (e.g., date range calculations, report periods) behaves deterministically regardless of when the tests are run.

### PHP Error Logging

The `db.php` drop-in registers PHP error handlers that capture all errors, warnings, notices, deprecations, uncaught exceptions, and fatal errors into a per-test `wp_e2e_error_log` database table. This ensures that PHP-level problems are surfaced in test results rather than silently ignored.

**How it works:**

1. **During the test:** Three PHP handlers (error handler, exception handler, shutdown handler) log every PHP error into the `wp_e2e_error_log` table in the test's database. Captured error levels include `E_WARNING`, `E_NOTICE`, `E_DEPRECATED`, `E_STRICT`, `E_USER_*` variants, `UNCAUGHT_EXCEPTION`, and fatal errors (`E_ERROR`, `E_PARSE`, `E_CORE_ERROR`, `E_COMPILE_ERROR`).
2. **After the test:** The `WordPress.tearDown()` method queries `wp_e2e_error_log` and filters results against a version-aware ignore list (`wordpress/error-log-ignore-list.ts`).
3. **If errors remain:** The error log is attached to the test result as a `php-error-log` JSON artifact, and the test is failed with a summary of all errors (format: `[LEVEL] message (file:line)`).

**Ignore list:** Some PHP errors are expected on older WordPress versions. The ignore list in `wordpress/error-log-ignore-list.ts` is keyed by WordPress version, with a special `ALL` key for errors ignored across all versions. Each entry is a substring match against the error message. For example, `get_magic_quotes_gpc()` deprecation warnings are expected on WordPress 5.2.21 but not on newer versions.

---

## Running Tests

From the repository root:

```bash
# Start the Docker environment
npm run playwright:env:start

# Run all Playwright tests
npm run test:playwright

# Run tests with Playwright's interactive UI mode
npm run test:playwright:ui

# Stop the Docker environment
npm run playwright:env:stop
```

Or from within `tests/playwright/` directly:

```bash
npm run start   # Start Docker
npm run test    # Run tests
npm run test:ui # Interactive UI mode
npm run stop    # Stop Docker
```

**First-time setup** — install Playwright's Chromium browser before running tests:

```bash
npm run -w tests/playwright setup
```

### Environment Variables

The following environment variables configure how tests connect to the running environment:

| Variable                   | Default                 | Description                             |
| -------------------------- | ----------------------- | --------------------------------------- |
| `PLAYWRIGHT_WP_URL`        | `http://localhost:9002` | WordPress base URL                      |
| `PLAYWRIGHT_DB_HOST`       | `localhost`             | MariaDB host                            |
| `PLAYWRIGHT_DB_PORT`       | `9306`                  | MariaDB port                            |
| `PLAYWRIGHT_DB_USER`       | `root`                  | MariaDB user                            |
| `PLAYWRIGHT_DB_PASSWORD`   | `example`               | MariaDB password                        |
| `PLAYWRIGHT_MAILPIT_URL`   | `http://localhost:8025` | Mailpit API base URL                    |
| `PLUGIN_PATH`              | `../../`                | Path to the plugin directory to mount   |
| `WP_VERSION`               | `5.2.21`                | WordPress version to use in Docker      |
| `FORBID_ONLY`              | _(unset)_               | Fail if `test.only` is present (CI use) |
| `RETRIES`                  | `0`                     | Number of retries per failing test      |
| `WORKERS`                  | _(Playwright default)_  | Number of parallel workers              |

---

## Writing Tests

### Basic Test Structure

Import `test` and `expect` from `../playwright` (not from `@playwright/test`) to get the `wp` fixture:

```typescript
import { test, expect, TestDetails } from '../playwright';
import { asUser, withPlugins } from '../wordpress';

test( 'my test', async ( { wp } ) => {
	await wp.visitAdmin( 'plugins.php' );
	await expect( wp.page.locator( 'h1' ) ).toHaveText( 'Plugins' );
} );
```

### The `wp` Fixture

The `wp` fixture is a `WordPress` instance automatically set up and torn down for each test. It provides:

| Member                      | Type       | Description                                        |
| --------------------------- | ---------- | -------------------------------------------------- |
| `wp.page`                   | `Page`     | The Playwright page                                |
| `wp.baseURL`                | `string`   | The WordPress base URL                             |
| `wp.mailpit`                | `Mailpit`  | Email client scoped to the current test            |
| `wp.goto(path)`             | method     | Navigate to an absolute path on the WordPress host |
| `wp.visitDashboard(hash?)`  | method     | Navigate to the Site Kit dashboard (`/wp-admin/admin.php?page=googlesitekit-dashboard`) |
| `wp.visitAdmin(path?)`      | method     | Navigate to `/wp-admin/{path}`                     |
| `wp.visitFrontend(path?)`   | method     | Navigate to `/{path}` (default: `/`)               |
| `wp.activatePlugin(file)`   | method     | Activate a plugin by its file path                 |
| `wp.deactivatePlugin(file)` | method     | Deactivate a plugin by its file path               |
| `wp.restRequest(...)`       | method     | Issue a WordPress REST API request via the browser |

### Test Annotations

Annotations are how tests declare setup requirements. They are processed by the `wp` fixture during setup.

**`asUser(username)`** — Authenticate as the given WordPress user:

```typescript
import { asUser } from '../wordpress';

const details: TestDetails = {
    annotation: [ asUser( 'admin' ) ],
};

test.describe( 'my suite', details, () => { ... } );
```

Available users in the database snapshot: `admin`, `admin-2`, `editor`, `author`, `contributor`.

**`withPlugins(...plugins)`** — Activate one or more test helper plugins before the test. Plugin paths are relative to `google-site-kit-test-plugins/`:

```typescript
import { withPlugins } from '../wordpress';

test(
    'test with GCP credentials',
    { annotation: withPlugins( 'gcp-credentials.php' ) },
    async ( { wp } ) => { ... }
);
```

Multiple plugins can be activated at once:

```typescript
{
	annotation: withPlugins( 'gcp-credentials.php', 'proxy-credentials.php' );
}
```

**`withFeatureFlags(...flags)`** — Enable one or more Site Kit feature flags for the duration of the test:

```typescript
import { withFeatureFlags } from '../wordpress';

test(
    'test behind a feature flag',
    { annotation: withFeatureFlags( 'proactiveUserEngagement' ) },
    async ( { wp } ) => { ... }
);
```

**`withFixtures(fixtureSet)`** — Use a named set of pre-recorded Google API responses. The fixture set name maps to a directory under `docker/fixtures/data/`:

```typescript
import { withFixtures } from '../wordpress';

test(
    'test with mocked API data',
    { annotation: withFixtures( 'email-reporting/weekly-report-data' ) },
    async ( { wp } ) => { ... }
);
```

Annotations can be applied at both the `test.describe` (suite) level and the individual `test` level. Test-level annotations are merged with suite-level annotations.

### Navigation Helpers

```typescript
// Navigate to any path on the WordPress host
await wp.goto( '/wp-json/wp/v2/posts' );

// Navigate to the Site Kit dashboard
await wp.visitDashboard();
await wp.visitDashboard( '#/settings' ); // with hash

// Navigate to a wp-admin page
await wp.visitAdmin( 'options-general.php' );
await wp.visitAdmin( 'plugins.php' );
await wp.visitAdmin( '' ); // dashboard

// Navigate to a frontend page
await wp.visitFrontend( '/' );
await wp.visitFrontend( '/sample-page/' );
```

### Plugin Management

In addition to annotation-based activation, plugins can be managed imperatively within a test:

```typescript
test( 'my test', async ( { wp } ) => {
	// Deactivate the main plugin to test the activation flow
	await wp.deactivatePlugin( 'google-site-kit/google-site-kit.php' );

	// ... interact with the UI ...

	// Re-activate it
	await wp.activatePlugin( 'google-site-kit/google-site-kit.php' );
} );
```

### REST API Helpers

`wp.restRequest()` issues a WordPress REST API request using the browser's `fetch`, inheriting the test's authenticated session:

```typescript
test( 'my test', async ( { wp } ) => {
	const response = await wp.restRequest( 'POST', '/google-site-kit/v1/e2e/email-reporting/trigger-cron', {
		body: JSON.stringify( { frequency: 'weekly' } ),
	} );
} );
```

### Email Assertions

Use `wp.mailpit` to wait for and inspect emails sent during a test. Email capture requires the `mailpit.php` plugin to be activated:

```typescript
test(
    'sends a welcome email',
    { annotation: withPlugins( 'mailpit.php' ) },
    async ( { wp } ) => {
        // ... trigger an action that sends email ...

        // Wait for an email to arrive (polls until timeout)
        const message = await wp.mailpit.waitForMessage();

        // Fetch full message details (including body)
        const detail = await wp.mailpit.getMessage( message.ID );

        expect( detail.Subject ).toBe( 'Welcome!' );
        expect( detail.HTML ).toContain( 'Hello' );

        // Check if any emails arrived matching an optional search query
        const found = await wp.mailpit.hasMessage( 'subject:Weekly' );
    }
);
```

**`Mailpit` API:**

| Method                          | Description                                                         |
| ------------------------------- | ------------------------------------------------------------------- |
| `getMessages(query?)`           | Fetch all messages, optionally filtered by a search query           |
| `getMessage(id)`                | Fetch full message detail (body, attachments) for a given ID        |
| `waitForMessage(options?)`      | Poll until at least one message arrives (default timeout: 2500ms)   |
| `hasMessage(query?)`            | Return `true` if any messages match the optional query              |
| `deleteMessages()`              | Delete all messages sent by this test                               |

Mailpit automatically scopes queries to the current test's sender address (`<database-name>@example.com`), so concurrent tests never see each other's emails.

---

## Test Infrastructure

### Docker Services

**`mysql` (MariaDB 10.3.39)**

-   Port: `9306` → `3306`
-   Credentials: `root` / `example`
-   Initialized from `docker/mariadb/backup.sql` on first start

**`wp` (custom WordPress image — `docker/wordpress/Dockerfile`)**

-   Port: `9002` → `80`
-   Based on `ghcr.io/google/site-kit-wp/playwright-wp`; the WordPress version is controlled by the `WP_VERSION` build arg (defaults to `5.2.21`)
-   The plugin is mounted at `wp-content/plugins/google-site-kit` from `PLUGIN_PATH` (defaults to `../../` for local dev; CI uses a built artifact)
-   Test helper plugins are mounted at `wp-content/plugins/google-site-kit-test-plugins`
-   `WP_HTTP_BLOCK_EXTERNAL` is enabled (only `*.wordpress.org` is reachable from the browser; the fixtures service intercepts Google API calls at the network level)
-   `db.php` drop-in is mounted at `wp-content/db.php` — handles per-test database routing and PHP error logging
-   `SCRIPT_DEBUG` and `WP_DEBUG_LOG` are enabled; `WP_DEBUG_DISPLAY` is **disabled** (errors go to the log file and the per-test error log table, not the page)
-   `WP_AUTO_UPDATE_CORE` is disabled
-   Depends on `mysql` being healthy before starting

**`mailpit` (axllent/mailpit:v1.29.2)**

-   SMTP port: `1025`
-   Web UI / REST API port: `8025`
-   Captures all outgoing WordPress emails sent via the `mailpit.php` test helper plugin
-   Profile: `test`

**`fixtures` (custom Node.js image — `docker/fixtures/Dockerfile`)**

-   Serves pre-recorded Google API responses for tests
-   Configured as a DNS alias for all major Google API hosts on the internal Docker network
-   Routes requests based on the `X-WP-Test-Fixtures` header forwarded by `e2e-fixtures.php`
-   Profile: `test`

### Docker Compose Profiles

Docker Compose uses profiles to separate test-running services from backup-generation services:

-   **`test`** — used when running tests (`npm run start` / `npm run test`). All services (`mysql`, `wp`, `mailpit`, `fixtures`) are started.
-   **`generate`** — used by `bin/generate-backup-sql.sh` to generate the database snapshot. Starts `mysql` and `wp` only, with `WP_DEBUG=0` to suppress debug output during setup.

### Must-Use Plugins

Must-use plugins in `docker/wordpress/mu-plugins/` are always active and cannot be deactivated through the UI.

**`e2e-authenticate-admin.php`**
Hooks into `determine_current_user` to authenticate the user specified in the `_wp_test_user` cookie (defaults to `admin`). Also calls `wp_set_auth_cookie()` on admin pages so redirect flows work correctly. This enables tests to act as any WordPress user without performing a real login.

**`e2e-feature-flags.php`**
Hooks into `googlesitekit_is_feature_enabled` at priority 999 to force the feature flags listed in the `_wp_test_feature_flags` cookie to return `true`.

**`e2e-fixtures.php`**
Disables SSL certificate verification so WordPress can reach the local fixtures service (which uses a self-signed certificate). Forwards the `_wp_test_fixtures` cookie value as an `X-WP-Test-Fixtures` HTTP header on all outbound requests.

**`e2e-reference-date.php`**
Fixes the Site Kit reference date to `2026-01-01 00:00:00` so that date-dependent calculations in reports are deterministic across test runs.

### Test Helper Plugins

Located in `docker/wordpress/plugins/` and mounted as the `google-site-kit-test-plugins` plugin directory. Activated per-test via the `withPlugins()` annotation.

**`gcp-credentials.php`**
Filters `googlesitekit_oauth_secret` with placeholder GCP OAuth credentials (client ID and secret). Use this to test flows that require GCP-based authentication to be configured without using real credentials.

**`proxy-credentials.php`**
Similar to `gcp-credentials.php` but uses the `sitekit.withgoogle.com` proxy domain. Use this to test proxy-based OAuth flows.

**`proxy-auth.php`**
Fakes a completed proxy authentication state so tests can start from an already-authenticated context without going through the OAuth flow.

**`mailpit.php`**
Configures PHPMailer to route all `wp_mail()` calls through Mailpit's SMTP server on port 1025. Sets the sender address to `<database-name>@example.com` so the `Mailpit` client can scope email queries to the current test.

**`email-reporting.php`**
Exposes a REST endpoint (`POST /wp-json/google-site-kit/v1/e2e/email-reporting/trigger-cron`) that synchronously runs the email reporting cron job for a given `frequency`. This lets tests trigger and verify email sends without waiting for WP-Cron to fire naturally.

### Database Snapshot

`docker/mariadb/backup.sql` is the canonical WordPress database snapshot loaded when the MariaDB container starts. It defines the baseline state for all tests.

The snapshot contains:

-   All standard WordPress tables (`wp_options`, `wp_users`, `wp_posts`, etc.)
-   Pre-configured users: `admin`, `admin-2` (administrators), `editor`, `author`, `contributor`
-   Four sample posts (including one with special characters)
-   TwentyNineteen theme activated
-   Site Kit plugin installed (but configured as deactivated in the snapshot)
-   Permalink structure set to `%postname%`

### Generating the Database Snapshot

The snapshot is generated deterministically by `bin/generate-backup-sql.sh`. This script ensures the `backup.sql` file produces clean diffs and is reproducible across runs.

```bash
# From the repository root:
npm run playwright:generate-backup

# Or from within tests/playwright/:
npm run generate-backup
```

**What the script does:**

1. Tears down any existing containers and removes the current `backup.sql`.
2. Starts Docker services with WordPress 5.2.21 (oldest supported version, for maximum forward-compatibility).
3. Installs WordPress via WP-CLI with test configuration (users, posts, theme, plugin, permalinks).
4. Normalizes the database for deterministic output:
    - All dates set to `2025-01-01 00:00:00`
    - All password hashes set to a fixed phpass hash of `"password"`
    - Session tokens and transients cleared
    - Cron option replaced with a fixed empty cron array
5. Exports the database with `mysqldump` and strips the timestamp comment.
6. Tears down containers.

**When to regenerate:** Run this script whenever you need to change the baseline state of the test database (e.g. adding new users, changing default options, updating the pre-installed plugin set). The resulting `backup.sql` should be committed to version control.

---

## Artifacts and Reporting

Test outputs are saved to `artifacts/` (not committed to version control).

| Path                           | Contents                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| `artifacts/playwright-html/`   | Interactive HTML report (`index.html`) — open in browser to view test results with screenshots |
| `artifacts/playwright-output/` | Per-test directories containing screenshots (always) and trace files (on first retry)          |

**View the HTML report:**

```bash
npx playwright show-report artifacts/playwright-html
```

**View a trace:**

```bash
npx playwright show-trace artifacts/playwright-output/<test-name>/trace.zip
```

---

## CI / GitHub Actions

The Playwright workflow (`.github/workflows/playwright.yml`) has two jobs:

### `build`

Runs once and produces two shared artifacts:

-   **`plugin`** — a built, unzipped plugin directory produced by `npm run dev-zip`. Test runs mount this via `PLUGIN_PATH` instead of the raw source tree, ensuring tests run against a production-like build.
-   **`playwright-browsers`** — the Chromium browser binary cached for reuse across matrix jobs.

### `playwright-tests`

Runs in parallel across a matrix of WordPress versions:

| WordPress version | Notes                                       |
| ----------------- | ------------------------------------------- |
| `latest`          | Current stable release                      |
| `nightly`         | WordPress nightly build (no Docker caching) |
| `5.2.21`          | Minimum supported version                   |

Each matrix job:

1. Downloads the `plugin` and `playwright-browsers` artifacts from the `build` job.
2. Caches Docker images keyed on `WP_VERSION` and the `Dockerfile`/`docker-compose.yml` hashes (skipped for `nightly` builds).
3. Starts the Docker environment and runs the full test suite with `RETRIES=2` and `WORKERS=4`.
4. Uploads `tests/playwright/artifacts/` as a GitHub Actions artifact.
5. Uploads the HTML report to the `site-kit-playwright` GCS bucket:
    - PRs: `pull/<number>/wp-<version>/`
    - Pushes: `<branch>/wp-<version>/`

After all matrix jobs complete, a separate `add-comment-to-pr` job posts (or updates) a PR comment with direct links to each version's HTML report on GCS.
