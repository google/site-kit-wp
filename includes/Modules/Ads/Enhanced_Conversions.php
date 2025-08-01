<?php
/**
 * Class Google\Site_Kit\Modules\Ads\Enhanced_Conversions
 *
 * @package   Google\Site_Kit\Modules\Ads
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Ads;

/**
 * Class Enhanced_Conversions.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Enhanced_Conversions {

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
	}

	/**
	 * Gets the user data for Enhanced Conversions.
	 *
	 * @since n.e.x.t
	 *
	 * @return array User data.
	 */
	public function get_user_data() {
		return array();
	}

	/**
	 * Conditionally enqueues the necessary script for Enhanced Conversions.
	 *
	 * @since n.e.x.t
	 */
	public function maybe_enqueue_gtag_user_data() {
	}

	/**
	 * Normalizes a value for Enhanced Conversions.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $value The value to normalize.
	 * @return string Normalized value.
	 */
	public static function get_normalized_value( string $value ) {
		return strtolower( trim( $value ) );
	}

	/**
	 * Normalizes an email address for Enhanced Conversions.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $email The email address to normalize.
	 * @return string Normalized email address.
	 */
	public static function get_normalized_email( string $email ) {
		$email = self::get_normalized_value( $email );

		$at_pos = strrpos( $email, '@' );

		// If there is no '@' in the email, return it as is.
		if ( false === $at_pos ) {
			return $email;
		}

		$domain = substr( $email, $at_pos + 1 );

		// Check if it is a 'gmail.com' or 'googlemail.com' address.
		if ( in_array( $domain, array( 'gmail.com', 'googlemail.com' ), true ) ) {
			$prefix = substr( $email, 0, $at_pos );

			// Remove dots from the prefix.
			$prefix = str_replace( '.', '', $prefix );

			$email = $prefix . '@' . $domain;
		}

		return $email;
	}

	/**
	 * Hashes a value for Enhanced Conversions.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $value The value to hash.
	 * @return string Hashed value.
	 */
	public static function get_hashed_value( string $value ) {
		return hash( 'sha256', $value );
	}
}
