<?php
/**
 * Trait Google\Site_Kit\Tests\Two_Factor_Plugin_Trait
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

/**
 * Trait for testing against the optional Two-Factor plugin.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Two_Factor_Plugin_Trait {

	/**
	 * Two-factor provider the test users turn on.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	const TWO_FACTOR_PROVIDER = 'Two_Factor_Totp';

	/**
	 * Makes the Two-Factor plugin count as active.
	 *
	 * PHP keeps a class for the rest of the process, so a test calling this
	 * needs the runInSeparateProcess annotation. Without it the alias reaches
	 * the tests that expect the plugin to be absent.
	 *
	 * @since n.e.x.t
	 */
	protected function activate_two_factor_plugin() {
		if ( ! class_exists( 'Two_Factor_Core' ) ) {
			class_alias( Two_Factor_Core_Fake::class, 'Two_Factor_Core' );
		}
	}

	/**
	 * Sets the given user's enabled two-factor provider, so the user counts as using two-factor authentication.
	 *
	 * Picks a provider other than the one the plugin falls back to, so a test
	 * can tell the user's own choice apart from the fallback.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $user_id User ID.
	 */
	protected function enable_two_factor_for_user( $user_id ) {
		update_user_meta( $user_id, Two_Factor_Core_Fake::ENABLED_PROVIDERS_USER_META_KEY, array( self::TWO_FACTOR_PROVIDER ) );
	}

	/**
	 * Gets the two-factor providers the given user has turned on.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $user_id User ID.
	 * @return string[]|string Provider keys, or an empty string when the user turned none on.
	 */
	protected function get_two_factor_providers_for_user( $user_id ) {
		return get_user_meta( $user_id, Two_Factor_Core_Fake::ENABLED_PROVIDERS_USER_META_KEY, true );
	}

	/**
	 * Checks whether the Two-Factor plugin would challenge the given user.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $user_id User ID.
	 * @return bool True when the plugin would run its challenge, false otherwise.
	 */
	protected function two_factor_challenges_user( $user_id ) {
		return Two_Factor_Core_Fake::is_user_using_two_factor( $user_id );
	}
}
