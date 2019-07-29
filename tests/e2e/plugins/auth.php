<?php
/**
 * Plugin Name: E2E Tests Auth Plugin
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for bypassing set up and authentication during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 */

use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Storage\Data_Encryption;
use Google\Site_Kit\Plugin;

/**
 * Provide dummy client configuration, normally provided in step 1 of the set up.
 */
add_filter( 'pre_option_googlesitekit_credentials', function () {
	return ( new Data_Encryption() )->encrypt(
		serialize(
			array(
				'oauth2_client_id'     => '1234567890-asdfasdfasdfasdfzxcvzxcvzxcvzxcv.apps.googleusercontent.com',
				'oauth2_client_secret' => 'x_xxxxxxxxxxxxxxxxxxxxxx',
			)
		)
	);
} );

/**
 * Provide a dummy access token to fake an authenticated state.
 */
add_filter( 'get_user_option_googlesitekit_access_token', function () {
	return ( new Data_Encryption() )->encrypt(
		serialize( array( 'access_token' => 'test-access-token' ) )
	);
} );

/**
 * Fake a verified site state.
 */
add_filter( 'get_user_option_googlesitekit_site_verified_meta', function () {
	return 'verified';
} );

/**
 * Fake all required scopes have been granted.
 */
add_filter( 'get_user_option_googlesitekit_auth_scopes', function () {
	return ( new OAuth_Client( Plugin::instance()->context() ) )->get_required_scopes();
} );
