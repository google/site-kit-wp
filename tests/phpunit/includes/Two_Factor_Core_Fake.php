<?php
/**
 * Two_Factor_Core_Fake
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

/**
 * Stands in for the Two-Factor plugin's Two_Factor_Core class.
 *
 * The plugin isn't part of the test environment. Two_Factor_Plugin_Trait
 * aliases this class to Two_Factor_Core so the plugin counts as active.
 *
 * The provider lookup applies the same two filters, in the same order, as
 * Two_Factor_Core, including the fallback to emailed codes. Both filters decide
 * whether the plugin challenges the user, so this fake keeps both. A fake with
 * only one would let a test pass that the real plugin fails.
 *
 * @since 1.185.0
 * @access private
 * @ignore
 */
class Two_Factor_Core_Fake {

	/**
	 * User meta key the Two-Factor plugin stores the enabled providers under.
	 *
	 * @since 1.185.0
	 * @var string
	 */
	const ENABLED_PROVIDERS_USER_META_KEY = '_two_factor_enabled_providers';

	/**
	 * Provider the Two-Factor plugin turns on when a user's stored providers
	 * resolve to nothing, so a user who asked for two-factor never loses it.
	 *
	 * @since 1.185.0
	 * @var string
	 */
	const FALLBACK_PROVIDER = 'Two_Factor_Email';

	/**
	 * Checks whether the given user has to pass a two-factor challenge.
	 *
	 * @since 1.185.0
	 *
	 * @param int $user_id Optional. User ID. Default null.
	 * @return bool True when the user has a provider enabled, false otherwise.
	 */
	public static function is_user_using_two_factor( $user_id = null ) {
		return '' !== self::get_primary_provider_for_user( $user_id );
	}

	/**
	 * Gets the provider that runs the challenge for the given user.
	 *
	 * @since 1.185.0
	 *
	 * @param int $user_id User ID.
	 * @return string Provider key, or an empty string when the user has none.
	 */
	private static function get_primary_provider_for_user( $user_id ) {
		$available = self::get_available_providers_for_user( $user_id );
		if ( empty( $available ) ) {
			return '';
		}

		$provider = apply_filters( 'two_factor_primary_provider_for_user', reset( $available ), $user_id );

		return in_array( $provider, $available, true ) ? $provider : '';
	}

	/**
	 * Gets the providers the given user can pass a challenge with.
	 *
	 * @since 1.185.0
	 *
	 * @param int $user_id User ID.
	 * @return string[] Provider keys.
	 */
	private static function get_available_providers_for_user( $user_id ) {
		$stored = get_user_meta( $user_id, self::ENABLED_PROVIDERS_USER_META_KEY, true );
		$stored = is_array( $stored ) ? $stored : array();

		$enabled = apply_filters( 'two_factor_enabled_providers_for_user', $stored, $user_id );

		// The plugin falls back to emailed codes rather than let a user who
		// turned two-factor on end up with no challenge at all.
		if ( empty( $enabled ) && ! empty( $stored ) ) {
			$enabled = array( self::FALLBACK_PROVIDER );
		}

		return $enabled;
	}
}
