<?php
/**
 * Encrypted_OptionsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Storage
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Storage;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\TestCase;

// phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize

/**
 * @group Storage
 */
class Encrypted_OptionsTest extends TestCase {

	public function test_get() {
		$encrypted_options = $this->new_encrypted_options();

		update_option( 'test-option', base64_encode( 'test-value' ) );
		$this->assertEquals( 'test-value', $encrypted_options->get( 'test-option' ), 'Encrypted_Options::get should decode base64 string values.' );

		update_option( 'test-serialized-option', base64_encode( serialize( array( 'test-value' ) ) ) );
		$this->assertEquals( array( 'test-value' ), $encrypted_options->get( 'test-serialized-option' ), 'Encrypted_Options::get should handle serialized array values.' );

		update_option( 'test-unserialized-array-option', array( 'test-value' ) );
		$this->assertEquals( array( 'test-value' ), $encrypted_options->get( 'test-unserialized-array-option' ), 'Encrypted_Options::get should return arrays stored unencrypted.' );
	}

	public function test_set() {
		$encrypted_options = $this->new_encrypted_options();
		$this->assertFalse( get_option( 'test-option' ), 'Option should not exist before set.' );
		$this->assertFalse( get_option( 'test-serialized-option' ), 'Serialized option should not exist before set.' );

		$encrypted_options->set( 'test-option', 'test-value' );
		$this->assertEquals( base64_encode( 'test-value' ), get_option( 'test-option' ), 'Encrypted_Options::set should store base64 encoded string.' );

		$encrypted_options->set( 'test-serialized-option', array( 'test-value' ) );
		$this->assertEquals( base64_encode( serialize( array( 'test-value' ) ) ), get_option( 'test-serialized-option' ), 'Encrypted_Options::set should store base64 encoded serialized array.' );
	}

	public function test_delete() {
		$encrypted_options = $this->new_encrypted_options();

		// Use add_option to assert that the option was in fact deleted. (true means option did not exist before)
		update_option( 'test-option', 'test-value' );
		$this->assertFalse( add_option( 'test-option', 'irrelevant-value' ), 'Precondition: option should already exist before delete.' );
		$this->assertTrue( $encrypted_options->delete( 'test-option' ), 'Encrypted_Options::delete should return true on success.' );
		$this->assertTrue( add_option( 'test-option', 'irrelevant-value' ), 'Option should be deletable again after deletion.' );

		update_option( 'test-serialized-option', 'test-serialized-value' );
		$this->assertFalse( add_option( 'test-serialized-option', 'irrelevant-value' ), 'Precondition: serialized option should already exist before delete.' );
		$this->assertTrue( $encrypted_options->delete( 'test-serialized-option' ), 'Encrypted_Options::delete should return true on success for serialized option.' );
		$this->assertTrue( add_option( 'test-serialized-option', 'irrelevant-value' ), 'Serialized option should be deletable again after deletion.' );
	}

	/**
	 * Get a new instance of Encrypted_Options for testing.
	 *
	 * Replaces the normal secure encryption class with a predictable base64-based encryption mechanism for assertions.
	 *
	 * @return Encrypted_Options
	 * @throws \ReflectionException
	 */
	protected function new_encrypted_options() {
		$instance = new Encrypted_Options( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );

		$this->force_set_property( $instance, 'encryption', new Base64_Encryption() );

		return $instance;
	}
}
