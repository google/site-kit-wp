<?php
/**
 * Plugin Name: E2E Tests Setup Bypass Plugin
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Bypasses the plugin setup.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Modules\Search_Console\Settings;

add_filter(
	'googlesitekit_proxy_setup_url_params',
	function( $params ) {
		add_filter(
			'wp_redirect',
			function() {
				$url = add_query_arg(
					array(
						'oauth2callback'        => '1',
						'code'                  => 'valid-test-code',
						'e2e-site-verification' => '1',
					),
					admin_url( 'index.php' )
				);

				$settings               = get_option( Settings::OPTION );
				$settings['propertyID'] = 'http://localhost:9002/';
				update_option( Settings::OPTION, $settings );

				return $url;
			}
		);

		return $params;
	}
);
