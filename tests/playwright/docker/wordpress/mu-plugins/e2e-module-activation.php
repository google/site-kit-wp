<?php
/**
 * Plugin Name: E2E Module Activation
 * Description: Connects modules for E2E tests based on a cookie set by the Playwright fixture, and applies their settings when provided.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Plugin;

const E2E_CONNECTED_MODULES_COOKIE = '_wp_test_connected_modules';

/**
 * Gets the connected modules declared for the current test, keyed by slug with
 * their settings (an empty array when none were provided).
 *
 * The cookie is a JSON array of `{ slug, settings }` entries.
 *
 * @return array<string, array<string, mixed>> Settings keyed by module slug.
 */
function e2e_get_connected_modules_config() {
	if ( empty( $_COOKIE[ E2E_CONNECTED_MODULES_COOKIE ] ) ) {
		return array();
	}

	$decoded = json_decode(
		rawurldecode( wp_unslash( $_COOKIE[ E2E_CONNECTED_MODULES_COOKIE ] ) ),
		true
	);

	if ( ! is_array( $decoded ) ) {
		return array();
	}

	$config = array();

	foreach ( $decoded as $entry ) {
		if ( empty( $entry['slug'] ) ) {
			continue;
		}

		$slug            = sanitize_key( $entry['slug'] );
		$config[ $slug ] = isset( $entry['settings'] ) && is_array( $entry['settings'] )
		? $entry['settings']
		: array();
	}

	return $config;
}

/**
 * Gets the connected module slugs declared for the current test.
 *
 * @return string[] Connected module slugs.
 */
function e2e_get_connected_modules() {
	return array_keys( e2e_get_connected_modules_config() );
}

add_filter(
	'googlesitekit_is_module_connected',
	function ( $connected, $module ) {
		$connected_modules = e2e_get_connected_modules();

		if ( empty( $connected_modules ) ) {
			return $connected;
		}

		return in_array( $module, $connected_modules, true );
	},
	999,
	2
);

// Modules that carry settings must be active and genuinely connected so the
// client (which reads the REST modules list, not the connectivity filter above)
// sees them connected.
$e2e_modules_with_settings = array_filter( e2e_get_connected_modules_config() );

// Provide each module's settings on read (no database writes) so `is_connected()`
// passes. `pre_option_` short-circuits `get_option`, so it works even for an
// unset settings option and is always active — the module is connected before
// Site Kit computes capabilities, which a view-only viewer's dashboard access
// depends on.
foreach ( $e2e_modules_with_settings as $e2e_slug => $e2e_settings ) {
	add_filter(
		"pre_option_googlesitekit_{$e2e_slug}_settings",
		function () use ( $e2e_settings ) {
			return $e2e_settings;
		}
	);
}

// Activate non-force-active modules so `is_module_active()` (and thus the REST
// `connected` field) reports them as active. Unlike the settings above, the
// active-modules option is unset in the test database, so an `option_` filter
// would not fire; `activate_module()` preserves the modules active by default
// and only writes the first time (it is idempotent).
add_action(
	'init',
	function () use ( $e2e_modules_with_settings ) {
		if ( empty( $e2e_modules_with_settings ) ) {
			return;
		}

		$modules = new Modules( Plugin::instance()->context() );

		foreach ( array_keys( $e2e_modules_with_settings ) as $slug ) {
			try {
				$module = $modules->get_module( $slug );
			} catch ( Exception $e ) {
				continue;
			}

			if ( ! $module->force_active ) {
				$modules->activate_module( $slug );
			}
		}
	}
);
