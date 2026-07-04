<?php
/**
 * Plugin Name: E2E Tests Mock Analytics Scopes Revoked
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Mocks required Analytics scopes as being revoked by the user.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Modules\Analytics_4;

add_filter(
	'get_user_option_googlesitekit_auth_scopes',
	function ( $scopes ) {
		if ( ! is_array( $scopes ) ) {
			return $scopes;
		}

		return array_diff( $scopes, array( Analytics_4::READONLY_SCOPE, Analytics_4::EDIT_SCOPE ) );
	},
	20
);
