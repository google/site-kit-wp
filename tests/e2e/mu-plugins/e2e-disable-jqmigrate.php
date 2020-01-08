<?php
/**
 * Plugin Name: E2E Disable jQuery Migrate
 * Description: Plugin for disabling jQuery migrate during E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

add_action(
	'wp_default_scripts',
	function ( WP_Scripts $scripts ) {
		$scripts->remove( 'jquery' );
		$scripts->add( 'jquery', false, array( 'jquery-core' ), $scripts->registered['jquery-core']->ver );
	}
);
