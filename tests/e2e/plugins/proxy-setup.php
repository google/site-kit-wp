<?php
/**
 * Plugin Name: E2E Tests Proxy Setup
 * Description: Utility plugin for mocking site registration requests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

add_filter(
	'pre_http_request',
	function ( $preempt, $args, $url ) {
		if ( $preempt ) {
			return $preempt;
		}

		// Fake a successful site registration.
		if ( 'https://sitekit.withgoogle.com/o/oauth2/site/' === $url ) {
			$redirect_uri = add_query_arg(
				array(
					'oauth2callback'        => '1',
					'code'                  => 'valid-test-code',
					'e2e-site-verification' => '1',
				),
				admin_url( 'index.php' )
			);

			return array(
				'headers'  => array(
					'Redirect-To' => $redirect_uri,
				),
				'body'     => json_encode( array() ),
				'response' => array(
					'code' => 200,
				),
			);
		}

		return $preempt;
	},
	10,
	3
);
