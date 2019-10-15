<?php
/**
 * Plugin Name: E2E Tests No Proxy Plugin
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for bypassing authentication proxy usage during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

add_filter(
	'googlesitekit_oauth_secret',
	function( $credentials_json ) {
		// If there are no credentials, set random non-proxy client ID to bypass proxy usage.
		if ( ! get_option( 'googlesitekit_credentials' ) ) {
			$credentials_json = '{"web":{"client_id":"notaproxysiteid","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_secret":""}}';
		}
		return $credentials_json;
	},
	9999
);
