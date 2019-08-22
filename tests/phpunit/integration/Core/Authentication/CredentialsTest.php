<?php
/**
 * CredentialsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Authentication
 */
class CredentialsTest extends TestCase {

	public function test_get() {
		$options           = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$encrypted_options = new Encrypted_Options( $options );
		$credentials       = new Credentials( $options );

		$this->assertFalse( $encrypted_options->get( Credentials::OPTION ) );
		$this->assertEqualSets(
			array(
				'oauth2_client_id'     => '',
				'oauth2_client_secret' => '',
			),
			$credentials->get()
		);

		$encrypted_options->set( Credentials::OPTION, array( 'oauth2_client_id' => 'test-client-id' ) );

		// Defaults are merged before returning
		$this->assertEqualSets(
			array(
				'oauth2_client_id'     => 'test-client-id',
				'oauth2_client_secret' => '',
			),
			$credentials->get()
		);

		$encrypted_options->set( Credentials::OPTION, array(
			'oauth2_client_id'     => 'test-client-id',
			'oauth2_client_secret' => 'test-client-secret',
		) );

		$this->assertEqualSets(
			array(
				'oauth2_client_id'     => 'test-client-id',
				'oauth2_client_secret' => 'test-client-secret',
			),
			$credentials->get()
		);
	}

	public function test_set() {
		$options           = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$encrypted_options = new Encrypted_Options( $options );
		$credentials       = new Credentials( $options );

		$this->assertFalse( $encrypted_options->get( Credentials::OPTION ) );
		$this->assertTrue( $credentials->set( array( 'test-credentials' ) ) );
		$this->assertEquals( array( 'test-credentials' ), $encrypted_options->get( Credentials::OPTION ) );
	}

	public function test_has() {
		$options           = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$encrypted_options = new Encrypted_Options( $options );
		$credentials       = new Credentials( $options );

		$this->assertFalse( $options->get( Credentials::OPTION ) );
		$this->assertFalse( $credentials->has() );
		// Credentials missing all required keys are considered missing
		// Test dummy credentials
		$this->assertTrue( $credentials->set( array( 'test-credentials' ) ) );
		$this->assertFalse( $credentials->has() );
		// Test client id only
		$encrypted_options->set( Credentials::OPTION, array( 'oauth2_client_id' => 'test-client-id' ) );
		$this->assertFalse( $credentials->has() );
		// Test client secret only
		$encrypted_options->set( Credentials::OPTION, array( 'oauth2_client_secret' => 'test-client-secret' ) );
		$this->assertFalse( $credentials->has() );
		// Test client id and empty secret
		$encrypted_options->set( Credentials::OPTION, array(
			'oauth2_client_id'     => 'test-client-id',
			'oauth2_client_secret' => ''
		) );
		$this->assertFalse( $credentials->has() );
		// Test empty client id with a secret
		$encrypted_options->set( Credentials::OPTION, array(
			'oauth2_client_id'     => '',
			'oauth2_client_secret' => 'test-client-secret'
		) );
		$this->assertFalse( $credentials->has() );
		// Test with provided client id and secret
		$encrypted_options->set( Credentials::OPTION, array(
			'oauth2_client_id'     => 'test-client-id',
			'oauth2_client_secret' => 'test-client-secret'
		) );
		$this->assertTrue( $credentials->has() );
	}
}
