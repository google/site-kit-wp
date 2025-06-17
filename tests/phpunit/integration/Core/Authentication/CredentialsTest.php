<?php
/**
 * CredentialsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// phpcs:disable PHPCS.PHPUnit.RequireAssertionMessage.MissingAssertionMessage -- Ignoring assertion message rule, messages to be added in #10760

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;

/**
 * @group Authentication
 */
class CredentialsTest extends TestCase {
	use Fake_Site_Connection_Trait;

	private $registered_default = array(
		'oauth2_client_id'     => '',
		'oauth2_client_secret' => '',
	);

	public function test_get() {
		$options           = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$encrypted_options = new Encrypted_Options( $options );
		$credentials       = new Credentials( $encrypted_options );

		$this->assertEqualSets(
			$this->registered_default,
			$encrypted_options->get( Credentials::OPTION )
		);
		$this->assertEqualSets(
			$this->registered_default,
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

		$encrypted_options->set(
			Credentials::OPTION,
			array(
				'oauth2_client_id'     => 'test-client-id',
				'oauth2_client_secret' => 'test-client-secret',
			)
		);

		$this->assertEqualSets(
			array(
				'oauth2_client_id'     => 'test-client-id',
				'oauth2_client_secret' => 'test-client-secret',
			),
			$credentials->get()
		);
	}

	public function test_using_proxy() {
		$options           = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$encrypted_options = new Encrypted_Options( $options );
		$credentials       = new Credentials( $encrypted_options );

		// Use proxy by default.
		$this->assertTrue( $credentials->using_proxy() );

		// Don't use proxy when regular OAuth client ID is used.
		$this->fake_site_connection();
		$this->assertFalse( $credentials->using_proxy() );

		// Use proxy when proxy site ID is used.
		$this->fake_proxy_site_connection();
		$this->assertTrue( $credentials->using_proxy() );
	}

	public function test_set() {
		$options           = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$encrypted_options = new Encrypted_Options( $options );
		$credentials       = new Credentials( $encrypted_options );

		$this->assertEqualSets( $this->registered_default, $encrypted_options->get( Credentials::OPTION ) );
		$this->assertTrue( $credentials->set( array( 'test-credentials' ) ) );
		$this->assertEquals( array( 'test-credentials' ), $encrypted_options->get( Credentials::OPTION ) );
	}

	public function test_has() {
		$options           = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$encrypted_options = new Encrypted_Options( $options );
		$credentials       = new Credentials( $encrypted_options );

		$this->assertFalse( $options->has( Credentials::OPTION ) );
		$this->assertFalse( $encrypted_options->has( Credentials::OPTION ) );
		$this->assertFalse( $credentials->has() );
		// Credentials missing all required keys are considered missing
		// Test placeholder credentials
		$this->assertTrue( $credentials->set( array( 'test-credentials' ) ) );
		$this->assertFalse( $credentials->has() );
		// Test client id only
		$encrypted_options->set( Credentials::OPTION, array( 'oauth2_client_id' => 'test-client-id' ) );
		$this->assertFalse( $credentials->has() );
		// Test client secret only
		$encrypted_options->set( Credentials::OPTION, array( 'oauth2_client_secret' => 'test-client-secret' ) );
		$this->assertFalse( $credentials->has() );
		// Test client id and empty secret
		$encrypted_options->set(
			Credentials::OPTION,
			array(
				'oauth2_client_id'     => 'test-client-id',
				'oauth2_client_secret' => '',
			)
		);
		$this->assertFalse( $credentials->has() );
		// Test empty client id with a secret
		$encrypted_options->set(
			Credentials::OPTION,
			array(
				'oauth2_client_id'     => '',
				'oauth2_client_secret' => 'test-client-secret',
			)
		);
		$this->assertFalse( $credentials->has() );
		// Test with provided client id and secret
		$encrypted_options->set(
			Credentials::OPTION,
			array(
				'oauth2_client_id'     => 'test-client-id',
				'oauth2_client_secret' => 'test-client-secret',
			)
		);
		$this->assertTrue( $credentials->has() );
	}
}
