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
		$this->assertEquals( 'test-value', $encrypted_options->get( 'test-option' ) );

		update_option( 'test-serialized-option', base64_encode( serialize( array( 'test-value' ) ) ) );
		$this->assertEquals( array( 'test-value' ), $encrypted_options->get( 'test-serialized-option' ) );

		update_option( 'test-unserialized-array-option', array( 'test-value' ) );
		$this->assertEquals( array( 'test-value' ), $encrypted_options->get( 'test-unserialized-array-option' ) );
	}

	public function test_set() {
		$encrypted_options = $this->new_encrypted_options();
		$this->assertFalse( get_option( 'test-option' ) );
		$this->assertFalse( get_option( 'test-serialized-option' ) );

		$encrypted_options->set( 'test-option', 'test-value' );
		$this->assertEquals( base64_encode( 'test-value' ), get_option( 'test-option' ) );

		$encrypted_options->set( 'test-serialized-option', array( 'test-value' ) );
		$this->assertEquals( base64_encode( serialize( array( 'test-value' ) ) ), get_option( 'test-serialized-option' ) );
	}

	public function test_delete() {
		$encrypted_options = $this->new_encrypted_options();

		// Use add_option to assert that the option was in fact deleted. (true means option did not exist before)
		update_option( 'test-option', 'test-value' );
		$this->assertFalse( add_option( 'test-option', 'irrelevant-value' ) );
		$this->assertTrue( $encrypted_options->delete( 'test-option' ) );
		$this->assertTrue( add_option( 'test-option', 'irrelevant-value' ) );

		update_option( 'test-serialized-option', 'test-serialized-value' );
		$this->assertFalse( add_option( 'test-serialized-option', 'irrelevant-value' ) );
		$this->assertTrue( $encrypted_options->delete( 'test-serialized-option' ) );
		$this->assertTrue( add_option( 'test-serialized-option', 'irrelevant-value' ) );
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
