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

use Google\Site_Kit\Core\Storage\Data_Encryption;

/**
 * Provide dummy client configuration, normally provided in step 1 of the set up.
 * We need to filter the credentials option here due to `isSiteKitConnected`'s dependence
 * on `Credentials` in `\Google\Site_Kit\Core\Authentication\Authentication::inline_js_setup_data`
 * which is option-based.
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
