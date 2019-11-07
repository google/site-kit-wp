<?php
/**
 * Plugin Name: E2E Tests GCP Credentials Plugin
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for forcing legacy Google Cloud Project OAuth credentials during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

/**
 * Provide dummy client configuration, normally provided in step 1 of the set up.
 */
add_filter(
	'googlesitekit_oauth_secret',
	function () {
		return json_encode(
			array(
				'web' => array(
					'client_id'                   => '1234567890-asdfasdfasdfasdfzxcvzxcvzxcvzxcv.apps.googleusercontent.com',
					'client_secret'               => 'x_xxxxxxxxxxxxxxxxxxxxxx',
					'auth_uri'                    => 'https://accounts.google.com/o/oauth2/auth',
					'token_uri'                   => 'https://oauth2.googleapis.com/token',
					'auth_provider_x509_cert_url' => 'https://www.googleapis.com/oauth2/v1/certs',
					'redirect_uris'               => array( add_query_arg( 'oauth2callback', '1', home_url() ) ),
				),
			)
		);
	}
);
