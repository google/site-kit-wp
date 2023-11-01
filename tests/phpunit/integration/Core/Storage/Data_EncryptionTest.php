<?php
/**
 * Data_EncryptionTest
 *
 * @package   Google\Site_Kit\Tests\Core\Storage
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Storage;

use Google\Site_Kit\Core\Storage\Data_Encryption;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Storage
 * @requires extension openssl
 */
class Data_EncryptionTest extends TestCase {
	const METHOD = 'aes-256-ctr';

	public function test_encrypt() {
		$encryption = new Data_Encryption();
		$this->force_set_property( $encryption, 'key', 'test-key' );
		$this->force_set_property( $encryption, 'salt', 'test-salt' );

		// The result is base64_encoded.
		$encrypted       = $encryption->encrypt( 'test-value' );
		$base_64_decoded = base64_decode( $encrypted, true );
		$this->assertNotFalse( $base_64_decoded );

		// Decrypt.
		$iv_len    = openssl_cipher_iv_length( self::METHOD );
		$iv        = substr( $base_64_decoded, 0, $iv_len );
		$raw_value = substr( $base_64_decoded, $iv_len );
		$decrypted = openssl_decrypt( $raw_value, self::METHOD, 'test-key', 0, $iv );
		$value     = substr( $decrypted, 0, -strlen( 'test-salt' ) );

		$this->assertEquals( 'test-value', $value );
	}

	public function test_decrypt() {
		$encryption = new Data_Encryption();
		$this->force_set_property( $encryption, 'key', 'test-key' );
		$this->force_set_property( $encryption, 'salt', 'test-salt' );

		// Encrypt 'test-value' and ensure that it is decrypted successfully.
		$iv_len          = openssl_cipher_iv_length( self::METHOD );
		$iv              = openssl_random_pseudo_bytes( $iv_len );
		$encrypted       = openssl_encrypt( 'test-value' . 'test-salt', self::METHOD, 'test-key', 0, $iv ); // phpcs:ignore Generic.Strings.UnnecessaryStringConcat.Found
		$encrypted_value = base64_encode( $iv . $encrypted );
		$decrypted_value = $encryption->decrypt( $encrypted_value );

		$this->assertEquals( 'test-value', $decrypted_value );

		// Test with non string value, it should return the original value.
		$array_value     = array( 'key' => 'value' );
		$decrypted_value = $encryption->decrypt( $array_value );

		$this->assertEquals( $array_value, $decrypted_value );

		// Non-encrypted strings should be returned unmodified, without errors.
		$string_value    = 'test-value';
		$decrypted_value = $encryption->decrypt( $string_value );

		$this->assertEquals( $string_value, $decrypted_value );
	}
}
