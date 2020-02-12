<?php
/**
 * Class Google\Site_Kit\Tests\Core\Authentication\Google_ProxyTest
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;

class Google_ProxyTest extends TestCase {
	public function test_exchange_site_code() {
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$google_proxy = new Google_Proxy( $context );

		$expected_credentials = array(
			'site_id'     => 'test-site-id.apps.sitekit.withgoogle.com',
			'site_secret' => 'test-site-secret',
		);

		// Stub the response to the proxy oauth API.
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $google_proxy, $expected_credentials ) {
				if ( $google_proxy->url( Google_Proxy::OAUTH2_SITE_URI ) !== $url ) {
					return $preempt;
				}

				return array(
					'headers'       => array(),
					'body'          => json_encode(
						$expected_credentials
					),
					'response'      => array(
						'code'    => 200,
						'message' => 'OK',
					),
					'cookies'       => array(),
					'http_response' => null,
				);
			},
			10,
			3
		);

		$credentials = $google_proxy->exchange_site_code( 'test-site-code', 'test-undelegated-code' );
		$this->assertEqualSetsWithIndex(
			$expected_credentials,
			$credentials
		);
	}
}
