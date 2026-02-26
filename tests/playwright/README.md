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
-   [Writing Tests](#writing-tests)
    -   [Basic Test Structure](#basic-test-structure)
    -   [The `wp` Fixture](#the-wp-fixture)
    -   [Test Annotations](#test-annotations)
    -   [Navigation Helpers](#navigation-helpers)
    -   [Plugin Management](#plugin-management)
-   [Test Infrastructure](#test-infrastructure)
    -   [Docker Services](#docker-services)
    -   [Must-Use Plugins](#must-use-plugins)
    -   [Test Helper Plugins](#test-helper-plugins)
    -   [Database Snapshot](#database-snapshot)
-   [Artifacts and Reporting](#artifacts-and-reporting)

---

## Overview

This infrastructure enables fast, fully isolated, repeatable E2E tests without restarting WordPress between tests. Key design principles:

-   **Per-test database isolation** — each test gets its own fresh database cloned from a snapshot.
-   **No real login** — authentication is handled via cookies, bypassing the login flow entirely.
-   **Plugin state via database** — plugins are activated/deactivated by writing directly to `wp_options`, not through the admin UI.
-   **Annotation-driven configuration** — tests declare their requirements (plugins, user) as Playwright annotations, keeping setup out of test bodies.

---

## Directory Structure

```
tests/playwright/
├── artifacts/                          # Generated test outputs (gitignored)
│   ├── playwright-html/                # HTML test report
│   └── playwright-output/             # Screenshots and traces on failure
├── docker/                             # Docker runtime assets
│   ├── mariadb/
│   │   └── backup.sql                  # WordPress DB snapshot (loaded on container init)
│   └── wordpress/
│       ├── db.php                      # DB drop-in: routes connections per test via cookie
│       ├── mu-plugins/
│       │   ├── e2e-authenticate-admin.php   # Authenticates user via cookie
│       └── plugins/                    # Test helper plugins (auto-mounted)
│           ├── gcp-credentials.php     # Mock GCP OAuth credentials
│           └── proxy-credentials.php  # Mock proxy OAuth credentials
├── specs/                              # Test files
│   └── plugin-activation.spec.ts
├── wordpress/                          # TypeScript test utilities
│   ├── index.ts                        # Re-exports
│   ├── args.ts                         # WordPressArgs type
│   ├── wordpress.ts                    # WordPress class (main fixture object)
│   ├── database.ts                     # Per-test DB create/drop
│   ├── cookies.ts                      # Test routing cookies
│   ├── plugins.ts                      # Plugin activation via DB
│   └── options.ts                      # Annotation helpers (withPlugins, asUser)
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

### Authentication Without Login

`docker/wordpress/mu-plugins/e2e-authenticate-admin.php` hooks into WordPress's `determine_current_user` filter. It reads the `_wp_test_user` cookie and sets the corresponding WordPress user as the currently authenticated user — no actual login flow required.

This means tests never need to fill in a username/password form, making them faster and more reliable.

### Plugin Activation via Database

`WordPressPlugins` activates and deactivates plugins by directly reading and writing the `active_plugins` option in `wp_options` (as a PHP-serialized array). This avoids the overhead of navigating the WordPress admin UI for plugin management.

Plugins specified via the `withPlugins()` annotation are activated automatically during test setup, before the test body runs.

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

| Member                      | Type     | Description                                        |
| --------------------------- | -------- | -------------------------------------------------- |
| `wp.page`                   | `Page`   | The Playwright page                                |
| `wp.baseURL`                | `string` | The WordPress base URL                             |
| `wp.goto(path)`             | method   | Navigate to an absolute path on the WordPress host |
| `wp.visitAdmin(path?)`      | method   | Navigate to `/wp-admin/{path}`                     |
| `wp.visitFrontend(path?)`   | method   | Navigate to `/{path}` (default: `/`)               |
| `wp.activatePlugin(file)`   | method   | Activate a plugin by its file path                 |
| `wp.deactivatePlugin(file)` | method   | Deactivate a plugin by its file path               |

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

Annotations can be applied at both the `test.describe` (suite) level and the individual `test` level. Test-level annotations are merged with suite-level annotations.

### Navigation Helpers

```typescript
// Navigate to any path on the WordPress host
await wp.goto( '/wp-json/wp/v2/posts' );

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

---

## Test Infrastructure

### Docker Services

**`mysql` (MariaDB 10.3.39)**

-   Port: `9306` → `3306`
-   Credentials: `root` / `example`
-   Initialized from `docker/mariadb/backup.sql` on first start

**`wp` (WordPress 6.7-php8.3)**

-   Port: `9002` → `80`
-   The plugin source (`../../`) is mounted at `wp-content/plugins/google-site-kit`
-   `WP_HTTP_BLOCK_EXTERNAL` is enabled (only `*.wordpress.org` is reachable)
-   `SCRIPT_DEBUG`, `WP_DEBUG_LOG`, `WP_DEBUG_DISPLAY` are all enabled
-   Depends on `mysql` being healthy before starting

**`wordpress-debug-log` (Alpine)**

-   Streams `wp-content/debug.log` to stdout — useful for monitoring PHP errors during local development with `docker compose logs -f wordpress-debug-log`

### Must-Use Plugins

Must-use plugins in `docker/wordpress/mu-plugins/` are always active and cannot be deactivated through the UI.

**`e2e-authenticate-admin.php`**
Hooks into `determine_current_user` to authenticate the user specified in the `_wp_test_user` cookie. This enables tests to act as any WordPress user without performing a real login.

### Test Helper Plugins

Located in `docker/wordpress/plugins/` and mounted as the `google-site-kit-test-plugins` plugin directory. Activated per-test via the `withPlugins()` annotation.

**`gcp-credentials.php`**
Filters `googlesitekit_oauth_secret` with placeholder GCP OAuth credentials (client ID and secret). Use this to test flows that require GCP-based authentication to be configured without using real credentials.

**`proxy-credentials.php`**
Similar to `gcp-credentials.php` but uses the `sitekit.withgoogle.com` proxy domain. Use this to test proxy-based OAuth flows.

### Database Snapshot

`docker/mariadb/backup.sql` is the canonical WordPress database snapshot loaded when the MariaDB container starts. It defines the baseline state for all tests.

The snapshot contains:

-   All standard WordPress tables (`wp_options`, `wp_users`, `wp_posts`, etc.)
-   A pre-configured `admin` user
-   Site Kit plugin installed (but configured as deactivated in the snapshot)

To update the snapshot, make the desired changes to the running WordPress container's database, then export it:

```bash
docker compose exec mysql mysqldump -uroot -pexample wordpress > docker/mariadb/backup.sql
```

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
