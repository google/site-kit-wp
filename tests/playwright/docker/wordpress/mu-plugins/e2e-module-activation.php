<?php
/**
 * Plugin Name: E2E Module Activation
 * Description: Connects modules for E2E tests based on a cookie set by the Playwright fixture, and seeds their settings when provided.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
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
// sees them connected. Runs at an early `init` priority so the module is
// connected before Site Kit computes the user's capabilities and enqueues the
// dashboard assets: a view-only viewer's access depends on a shared module being
// connected, and seeding it later leaves the base data (and the dashboard) off
// the page.
add_action(
	'init',
	function () {
		$config = array_filter( e2e_get_connected_modules_config() );

		if ( empty( $config ) ) {
			return;
		}

		$modules = new Modules( Plugin::instance()->context() );

		foreach ( $config as $slug => $settings ) {
			try {
				$module = $modules->get_module( $slug );
			} catch ( Exception $e ) {
				continue;
			}

			// Activate non-force-active modules through the registry, which
			// preserves the modules active by default. `is_module_active()` (and
			// thus the REST `connected` field) then reports it as active. Skip
			// force-active modules: they are already active, and writing the
			// active-modules option for them triggers a re-sanitize that can
			// disrupt other forced settings (e.g. dashboard sharing).
			if ( ! $module->force_active ) {
				$modules->activate_module( $slug );
			}

			// Seed the module's settings so `is_connected()` passes. `merge()`
			// only writes when the value changes, so re-running per request is
			// cheap.
			if ( $module instanceof Module_With_Settings ) {
				$module->get_settings()->merge( $settings );
			}
		}
	},
	1
);
