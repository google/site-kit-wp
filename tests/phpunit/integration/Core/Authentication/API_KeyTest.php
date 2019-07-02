<?php
/**
 * API_KeyTest
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\API_Key;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Authentication
 */
class API_KeyTest extends TestCase {

	public function test_get() {
		$options           = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$encrypted_options = new Encrypted_Options( $options );
		$api_key           = new API_Key( $options );

		$this->assertFalse( $options->get( API_Key::OPTION ) );
		$this->assertFalse( $api_key->get() );

		$encrypted_options->set( API_Key::OPTION, 'test-api-key' );
		$this->assertNotEmpty( $options->get( API_Key::OPTION ) );
		$this->assertEquals( 'test-api-key', $api_key->get() );
	}

	public function test_has() {
		$options           = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$encrypted_options = new Encrypted_Options( $options );
		$api_key           = new API_Key( $options );

		$this->assertFalse( $options->get( API_Key::OPTION ) );
		$this->assertFalse( $api_key->has() );

		// Test that API Key must be encrypted
		$options->set( API_Key::OPTION, 'test-api-key' );
		$this->assertFalse( $api_key->has() );
		$encrypted_options->set( API_Key::OPTION, 'test-api-key' );
		$this->assertTrue( $api_key->has() );
	}

	public function test_set() {
		$api_key = new API_Key( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$this->assertFalse( $api_key->get() );

		$api_key->set( 'test-api-key' );

		$this->assertEquals( 'test-api-key', $api_key->get() );
	}
}
