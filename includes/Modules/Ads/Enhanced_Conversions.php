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

use Google\Site_Kit\Core\Tags\GTag;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class Enhanced_Conversions.
 *
 * @since 1.159.0
 * @access private
 * @ignore
 */
class Enhanced_Conversions {
	use Method_Proxy_Trait;

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.159.0
	 */
	public function register() {
		add_action( 'googlesitekit_setup_gtag', $this->get_method_proxy( 'maybe_enqueue_gtag_user_data' ) );
	}

	/**
	 * Gets the user data for Enhanced Conversions.
	 *
	 * @since 1.159.0
	 *
	 * @return array User data.
	 */
	protected function get_user_data() {
		$user_data = array();

		if ( ! is_user_logged_in() ) {
			return $user_data;
		}

		$user = wp_get_current_user();

		$first_name = $user->user_firstname;
		$last_name  = $user->user_lastname;
		$email      = $user->user_email;

		if ( ! empty( $email ) ) {
			$user_data['sha256_email_address'] = self::get_formatted_email( $email );
		}

		if ( ! empty( $first_name ) ) {
			$user_data['address']['sha256_first_name'] = self::get_formatted_value( $first_name );
		}

		if ( ! empty( $last_name ) ) {
			$user_data['address']['sha256_last_name'] = self::get_formatted_value( $last_name );
		}

		return $user_data;
	}

	/**
	 * Conditionally enqueues the necessary script for Enhanced Conversions.
	 *
	 * @since 1.159.0
	 * @since 1.160.0 Add the hashed user data to the GTag if it exists.
	 *
	 * @param GTag $gtag GTag instance.
	 */
	public function maybe_enqueue_gtag_user_data( GTag $gtag ) {
		$user_data = $this->get_user_data();

		if ( empty( $user_data ) ) {
			return;
		}

		$gtag->add_command( 'set', array( 'user_data', $user_data ) );
	}

	/**
	 * Gets the formatted value for Enhanced Conversions.
	 *
	 * @since 1.160.0
	 *
	 * @param string $value The value to format.
	 * @return string Formatted value.
	 */
	public static function get_formatted_value( $value ) {
		$value = self::get_normalized_value( $value );
		$value = self::get_hashed_value( $value );
		return $value;
	}

	/**
	 * Gets the formatted email for Enhanced Conversions.
	 *
	 * @since 1.160.0
	 *
	 * @param string $email The email address to format.
	 * @return string Formatted email address.
	 */
	public static function get_formatted_email( $email ) {
		$email = self::get_normalized_email( $email );
		$email = self::get_hashed_value( $email );
		return $email;
	}

	/**
	 * Normalizes a value for Enhanced Conversions.
	 *
	 * @since 1.160.0
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
	 * @since 1.160.0
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
	 * @since 1.160.0
	 *
	 * @param string $value The value to hash.
	 * @return string Hashed value.
	 */
	public static function get_hashed_value( string $value ) {
		return hash( 'sha256', $value );
	}
}
