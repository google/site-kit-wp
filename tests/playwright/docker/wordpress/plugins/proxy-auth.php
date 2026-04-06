<?php
/**
 * Plugin Name: E2E Tests Auto-Authentication Plugin
 * Description: Utility plugin for bypassing set up and authentication during E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Storage\Data_Encryption;
use Google\Site_Kit\Modules\Search_Console\Settings as Search_Console_Settings;
use Google\Site_Kit\Plugin;

/**
 * Load proxy credentials.
 */
require_once __DIR__ . '/proxy-credentials.php';

/**
 * Provide a placeholder access token to fake an authenticated state.
 */
add_filter(
	'get_user_option_googlesitekit_access_token',
	function () {
		return ( new Data_Encryption() )->encrypt( 'test-access-token' );
	}
);

/**
 * Set Search Console property ID to localhost:9002 and fake site verification.
 */
add_action(
	'init',
	function () {
		$settings = get_option( Search_Console_Settings::OPTION );
		if ( empty( $settings['propertyID'] ) || 'http://localhost:9002' !== $settings['propertyID'] ) {
			$settings['propertyID'] = 'http://localhost:9002';
			update_option( Search_Console_Settings::OPTION, $settings );
		}

		update_user_option(
			get_current_user_id(),
			'googlesitekit_site_verified_meta',
			'verified'
		);
	}
);

/**
 * Fake all required scopes have been granted.
 */
$_force_all_scopes = function () {
	global $_force_all_scopes;

	// Remove the filter hook to prevent an infinite loop in the case where the `googlesitekit_auth_scopes`
	// option is retrieved again during the call to `get_required_scopes()`.
	remove_filter( 'get_user_option_googlesitekit_auth_scopes', $_force_all_scopes );

	$required_scopes = ( new OAuth_Client( Plugin::instance()->context() ) )->get_required_scopes();

	// Restore the filter hook for future calls to retrieve the option.
	add_filter( 'get_user_option_googlesitekit_auth_scopes', $_force_all_scopes );

	return $required_scopes;
};

// Ensure the filter hook is initially applied.
add_filter( 'get_user_option_googlesitekit_auth_scopes', $_force_all_scopes );
