<?php
/**
 * Base64_Encryption
 *
 * @package   Google\Site_Kit\Tests\Core\Storage
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Storage;

/**
 * Class Base64_Encryption
 *
 * A placeholder encryption implementation for use in testing only.
 *
 * @package Google\Site_Kit\Tests\Core\Storage
 */
class Base64_Encryption {
	/**
	 * Encrypt the given value.
	 *
	 * @param mixed $value
	 *
	 * @return string
	 */
	public function encrypt( $value ) {
		return base64_encode( $value );
	}

	/**
	 * Decrypt the given value.
	 *
	 * @param mixed $value
	 *
	 * @return bool|string
	 */
	public function decrypt( $value ) {
		if ( ! is_string( $value ) ) {
			return $value;
		}

		return base64_decode( $value );
	}
}
