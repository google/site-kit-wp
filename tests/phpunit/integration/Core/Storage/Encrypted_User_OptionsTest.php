<?php
/**
 * Encrypted_User_OptionsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Storage
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * phpcs:disable PHPCS.Commenting.RequireDocTagDescription -- Pre-existing violations; tracked for follow-up cleanup.
 */
namespace Google\Site_Kit\Tests\Core\Storage;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Encrypted_User_Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\TestCase;

// phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize

/**
 * @group Storage
 */
class Encrypted_User_OptionsTest extends TestCase {

	public function test_get() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$encrypted_user_options = $this->new_encrypted_user_options();

		// Get returns the decrypted value.
		update_user_option( $user_id, 'test-option', base64_encode( 'test-value' ) );
		$this->assertEquals( 'test-value', $encrypted_user_options->get( 'test-option' ), 'Encrypted user option should be decrypted when read.' );

		// Get returns the unserialized value.
		update_user_option( $user_id, 'test-serialized-option', base64_encode( serialize( array( 'test-value' ) ) ) );
		$this->assertEquals( array( 'test-value' ), $encrypted_user_options->get( 'test-serialized-option' ), 'Serialized encrypted user option should be decrypted and unserialized when read.' );
	}

	public function test_set() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$encrypted_user_options = $this->new_encrypted_user_options();

		$this->assertFalse(
			get_user_option( 'test-option', $user_id ),
			'Scalar user option should not exist before it is stored.'
		);
		$this->assertFalse(
			get_user_option( 'test-serialized-option', $user_id ),
			'Array user option should not exist before it is stored.'
		);

		// Set encrypts the raw value before persisting it.
		$encrypted_user_options->set( 'test-option', 'test-value' );
		$this->assertEquals(
			base64_encode( 'test-value' ),
			get_user_option( 'test-option', $user_id ),
			'Scalar user option should be encrypted before storage.'
		);

		// Non-scalar values are serialized before encrypting.
		$encrypted_user_options->set( 'test-serialized-option', array( 'test-value' ) );
		$this->assertEquals(
			base64_encode( serialize( array( 'test-value' ) ) ),
			get_user_option( 'test-serialized-option', $user_id ),
			'Array user option should be serialized and encrypted before storage.'
		);
	}

	public function test_delete() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		$encrypted_user_options = $this->new_encrypted_user_options();

		// Delete has no special behavior for encrypted options.
		update_user_option( $user_id, 'test-option', 'test-value' );
		$this->assertNotEmpty(
			get_user_option( 'test-option', $user_id ),
			'Scalar user option should exist before deletion.'
		);
		$this->assertTrue(
			$encrypted_user_options->delete( 'test-option' ),
			'Deleting an existing scalar user option should succeed.'
		);
		$this->assertFalse(
			get_user_option( 'test-option', $user_id ),
			'Scalar user option should no longer exist after deletion.'
		);

		update_user_option( $user_id, 'test-serialized-option', base64_encode( serialize( array( 'test-value' ) ) ) );
		$this->assertNotEmpty(
			get_user_option( 'test-serialized-option', $user_id ),
			'Serialized user option should exist before deletion.'
		);
		$this->assertTrue(
			$encrypted_user_options->delete( 'test-serialized-option' ),
			'Deleting an existing serialized user option should succeed.'
		);
		$this->assertFalse(
			get_user_option( 'test-serialized-option', $user_id ),
			'Serialized user option should no longer exist after deletion.'
		);
	}

	/**
	 * Get a new instance of Encrypted_User_Options for testing.
	 *
	 * Replaces the normal secure encryption class with a predictable base64-based encryption mechanism for assertions.
	 *
	 * @return Encrypted_User_Options
	 * @throws \ReflectionException
	 */
	protected function new_encrypted_user_options() {
		$instance = new Encrypted_User_Options( new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );

		$this->force_set_property( $instance, 'encryption', new Base64_Encryption() );

		return $instance;
	}
}
