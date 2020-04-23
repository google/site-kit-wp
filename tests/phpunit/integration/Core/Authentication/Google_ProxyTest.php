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
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\MethodSpy;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;

class Google_ProxyTest extends TestCase {

	public function test_get_site_fields() {
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$google_proxy = new Google_Proxy( $context );

		$this->assertEqualSetsWithIndex(
			array(
				'url'          => home_url(),
				'action_uri'   => admin_url( 'index.php' ),
				'name'         => get_bloginfo( 'name' ),
				'return_uri'   => $context->admin_url( 'splash' ),
				'admin_root'   => parse_url( admin_url( '/' ), PHP_URL_PATH ),
				'redirect_uri' => add_query_arg( 'oauth2callback', 1, admin_url( 'index.php' ) ),
			),
			$google_proxy->get_site_fields()
		);
	}

	public function test_sync_site_fields() {
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$google_proxy = new Google_Proxy( $context );
		$credentials  = new Credentials( new Options( $context ) );

		add_filter( // Fake "using proxy"
			'googlesitekit_oauth_secret',
			function () {
				return array(
					'web' => array(
						'client_id'     => '12345678.apps.sitekit.withgoogle.com',
						'client_secret' => 'test-client-secret',
					),
				);
			}
		);

		$spy = new MethodSpy();
		add_action( 'http_api_debug', array( $spy, 'callback' ), 10, 5 );

		$google_proxy->sync_site_fields( $credentials );

		$this->assertCount( 1, $spy->invocations['callback'] );
		list( $response, , , $args, $url ) = $spy->invocations['callback'][0];
		// Ensure the request was blocked by WP_HTTP_BLOCK_EXTERNAL.
		$this->assertWPError( $response );
		$this->assertEquals( 'http_request_not_executed', $response->get_error_code() );
		// Ensure the request was made with the proper URL and body parameters.
		$this->assertEquals( $google_proxy->url( Google_Proxy::OAUTH2_SITE_URI ), $url );
		$this->assertEquals( 'POST', $args['method'] );
		$this->assertEqualSets(
			array(
				'site_id',
				'site_secret',
				'nonce',
				'url',
				'name',
				'admin_root',
				'return_uri',
				'action_uri',
				'redirect_uri',
			),
			array_keys( $args['body'] )
		);
	}

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
