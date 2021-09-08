<?php
/**
 * Plugin Name: E2E Tests Idea Hub Mocks Plugin
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Provides mocks for the Idea Hub module.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

add_filter(
	'googlesitekit_is_feature_enabled',
	function( $enabled, $feature_flag ) {
		if ( 'ideaHubModule' === $feature_flag ) {
			return true;
		}

		return $enabled;
	},
	PHP_INT_MAX,
	2
);
