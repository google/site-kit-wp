<?php
/**
 * Class Google\Site_Kit\Core\Util\WP_Context_Switcher
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Class for temporarily switching WordPress context, e.g. from admin to frontend.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class WP_Context_Switcher {
	const CONTEXT_FRONT = 'front';
	const CONTEXT_ADMIN = 'admin';

	/**
	 * Stack of original contexts switched from.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	private static $context_stack = array();

	/**
	 * Switches WordPress context if necessary.
	 *
	 * Context is only switched if WordPress is not already in the given context. Context should only ever be switched
	 * temporarily. Call {@see WP_Context_Switcher::restore_context()} as soon as possible after to restore the
	 * original context.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $context WordPress context to switch to. Either 'front' or 'admin'.
	 * @return boolean True if context was switched, false otherwise.
	 */
	public static function switch_context( $context ) {
		global $current_screen;

		switch ( $context ) {
			case self::CONTEXT_ADMIN:
				if ( is_admin() ) {
					return false;
				}
				self::load_wp_screen_api();
				self::$context_stack[] = $current_screen;
				$current_screen        = \WP_Screen::get( 'index' ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
				return true;
			case self::CONTEXT_FRONT:
				if ( ! is_admin() ) {
					return false;
				}
				self::load_wp_screen_api();
				self::$context_stack[] = $current_screen;
				$current_screen        = \WP_Screen::get( 'front' ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
				return true;
		}

		return false;
	}

	/**
	 * Restores previous WordPress context if it has been switched.
	 *
	 * @since n.e.x.t
	 *
	 * @return boolean True if context was restored, false otherwise.
	 */
	public static function restore_context() {
		global $current_screen;

		if ( empty( self::$context_stack ) ) {
			return false;
		}

		$current_screen = array_pop( self::$context_stack ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		return true;
	}

	/**
	 * Loads the WordPress Screen API if needed.
	 *
	 * @since n.e.x.t
	 */
	private static function load_wp_screen_api() {
		if ( class_exists( 'WP_Screen' ) && function_exists( 'get_current_screen' ) ) {
			return;
		}

		require_once ABSPATH . 'wp-admin/includes/class-wp-screen.php';
		require_once ABSPATH . 'wp-admin/includes/screen.php';
	}
}
