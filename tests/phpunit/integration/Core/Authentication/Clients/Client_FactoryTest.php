<?php
/**
 * Client_FactoryTest.php
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication\Clients
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication\Clients;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Clients\Client_Factory;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Proxy_Client;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Authentication
 */
class Client_FactoryTest extends TestCase {

	public function test_create_client() {
		$client_id       = 'test1234.apps.sitekit.withgoogle.com';
		$client_secret   = '0987654321';
		$redirect_uri    = 'https://example.org/wp-admin/index.php?oauth2callback=1';
		$token           = array(
			'access_token'  => 'test-access-token',
			'expires_in'    => 3600,
			'created'       => 649724400,
			'refresh_token' => 'test-refresh-token',
		);
		$required_scopes = array( 'openid', 'https://www.googleapis.com/auth/userinfo.profile' );
		$login_hint      = 'demo@gmail.com';

		$client = Client_Factory::create_client(
			array(
				'client_id'        => $client_id,
				'client_secret'    => $client_secret,
				'redirect_uri'     => $redirect_uri,
				'token'            => $token,
				'required_scopes'  => $required_scopes,
				'login_hint_email' => $login_hint,
			)
		);

		$this->assertInstanceOf( Google_Site_Kit_Proxy_Client::class, $client, 'Created client should be a Site Kit proxy client.' );
		$this->assertEquals( 3, $client->getConfig( 'retry' )['retries'], 'Client should use the default retry count.' );
		$this->assertEquals( Google_Proxy::get_application_name(), $client->getHttpClient()->getConfig( 'headers' )['User-Agent'], 'Client user agent should use the proxy application name.' );
		$this->assertEquals( $client_id, $client->getClientId(), 'Client ID should match the provided value.' );
		$this->assertEquals( $client_secret, $client->getClientSecret(), 'Client secret should match the provided value.' );
		$this->assertEquals( $redirect_uri, $client->getRedirectUri(), 'Redirect URI should match the provided value.' );
		$this->assertEquals( 'offline', $client->getConfig( 'access_type' ), 'Client access type defaults to offline.' );
		$this->assertEquals( 'consent', $client->getConfig( 'prompt' ), 'Client prompt defaults to consent.' );
		$this->assertEquals( $required_scopes, $client->getScopes(), 'Client scopes should match the required scopes.' );
		$this->assertEquals( $token, $client->getAccessToken(), 'Client access token should match the provided token.' );
		$this->assertEquals( $login_hint, $client->getConfig( 'login_hint' ), 'Client login hint should match the provided email.' );
	}

	/**
	 * @dataProvider data_config_ip_resolve_values
	 */
	public function test_client_ip_resolve_config_options( $ip_resolve, $expected_value ) {
		add_filter(
			'googlesitekit_force_ip_resolve',
			function () use ( $ip_resolve ) {
				return $ip_resolve;
			}
		);

		$client = Client_Factory::create_client( array() );
		$this->assertEquals( $expected_value, $client->getHttpClient()->getConfig( 'force_ip_resolve' ), 'Client IP resolve value should match the expected value.' );
	}

	public function data_config_ip_resolve_values() {
		return array(
			'null' => array( null, null ),
			'v4'   => array( 'v4', 'v4' ),
			'v6'   => array( 'v6', 'v6' ),
			'xyz'  => array( 'xyz', null ),
		);
	}
}
