<?php
/**
 * Plugin Name: E2E Tests Site Verification Plugin
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for bypassing site verification during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

/**
 * Fake a verified site state.
 * Verification checks for metadata existence so must filter get metadata instead of user option.
 * @see \metadata_exists
 */
add_filter(
	'get_user_metadata',
	function ( $null_verification, $object_id, $meta_key ) {
		if (
			preg_match( '/googlesitekit_site_verified_meta$/', $meta_key )
			&& get_current_user_id() === $object_id
		) {
			return '1';
		}
		return $null_verification;
	},
	10,
	3
);
