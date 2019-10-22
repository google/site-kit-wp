<?php
/**
 * Plugin Name: E2E Tests Auth Plugin
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for bypassing set up and authentication during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Storage\Data_Encryption;
use Google\Site_Kit\Plugin;

/**
 * Provide dummy client configuration, normally provided in step 1 of the set up.
 */
require_once __DIR__ . '/gcp-credentials.php';

/**
 * Provide a dummy access token to fake an authenticated state.
 */
add_filter( 'get_user_option_googlesitekit_access_token', function () {
	return ( new Data_Encryption() )->encrypt(
		serialize( array( 'access_token' => 'test-access-token' ) )
	);
} );

/**
 * Fake all required scopes have been granted.
 */
add_filter( 'get_user_option_googlesitekit_auth_scopes', function () {
	return ( new OAuth_Client( Plugin::instance()->context() ) )->get_required_scopes();
} );
