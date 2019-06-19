<?php
/**
 * API_Key_ClientTest
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\API_Key;
use Google\Site_Kit\Core\Authentication\Clients\API_Key_Client;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Authentication
 */
class API_Key_ClientTest extends TestCase {

	public function test_get_client() {
		$client = new API_Key_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertInstanceOf( 'Google_Client', $client->get_client() );
	}

	public function test_get_api_key() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$client = new API_Key_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_filters( 'googlesitekit_api_key' );
		$this->assertFalse( get_option( API_Key::OPTION ) );

		// Returns false if not filtered, and no key set.
		$this->assertFalse( $client->get_api_key() );

		add_filter( 'googlesitekit_api_key', function () {
			return 'test-api-key';
		} );

		$this->assertEquals( 'test-api-key', $client->get_api_key() );
	}

	public function test_set_api_key() {
		$client = new API_Key_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_filters( 'googlesitekit_api_key' );
		$google_client_mock = $this->getMock( 'Google_Client', array( 'setDeveloperKey' ) );
		$google_client_mock->expects( $this->once() )->method( 'setDeveloperKey' )->with( 'test-set-api-key' );
		$this->force_set_property( $client, 'google_client', $google_client_mock );

		$this->assertFalse( get_option( API_Key::OPTION ) );
		$this->assertTrue( $client->set_api_key( 'test-set-api-key' ) );
		$this->assertNotEmpty( get_option( API_Key::OPTION ) );
		$this->assertEquals( 'test-set-api-key', $client->get_api_key() );
		// Repetitive calls with same key do are not passed on to internal client
		$this->assertTrue( $client->set_api_key( 'test-set-api-key' ) );
		$this->assertTrue( $client->set_api_key( 'test-set-api-key' ) );
	}
}
