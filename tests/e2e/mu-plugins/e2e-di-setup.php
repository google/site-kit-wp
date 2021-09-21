<?php
/**
 * Plugin Name: E2E DI setup
 * Description: Sets up DI container for E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

if ( ! defined( 'WP_ENVIRONMENT_TYPE' ) ) :
	define( 'WP_ENVIRONMENT_TYPE', 'development' );
endif;

if ( ! function_exists( 'wp_get_environment_type' ) ) :
	function wp_get_environment_type() {
		return WP_ENVIRONMENT_TYPE;
	}
endif;
