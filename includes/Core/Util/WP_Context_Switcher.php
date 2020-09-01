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

	/**
	 * Switches to WordPress frontend context if necessary.
	 *
	 * Context is only switched if WordPress is not already in frontend context. Context should only ever be switched
	 * temporarily. Call the returned closure as soon as possible after to restore the original context.
	 *
	 * @since n.e.x.t
	 *
	 * @return callable Closure that restores context and returns true if context was restored or false otherwise.
	 */
	public static function with_frontend_context() {
		global $current_screen;

		if ( ! is_admin() ) {
			return function() {
				return false;
			};
		}

		return self::switch_current_screen( 'front' );
	}

	/**
	 * Switches to WordPress admin context if necessary.
	 *
	 * Context is only switched if WordPress is not already in admin context. Context should only ever be switched
	 * temporarily. Call the returned closure as soon as possible after to restore the original context.
	 *
	 * @since n.e.x.t
	 *
	 * @return callable Closure that restores context and returns true if context was restored or false otherwise.
	 */
	public static function with_admin_context() {
		global $current_screen;

		if ( is_admin() ) {
			return function() {
				return false;
			};
		}

		return self::switch_current_screen( 'index' );
	}

	/**
	 * Switches the current WordPress screen via the given screen ID or hook name.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $screen_id WordPress screen ID.
	 * @return callable Closure that restores context and returns true.
	 */
	private static function switch_current_screen( $screen_id ) {
		global $current_screen;

		require_once ABSPATH . 'wp-admin/includes/class-wp-screen.php';
		require_once ABSPATH . 'wp-admin/includes/screen.php';

		$original_screen = $current_screen;
		$current_screen  = \WP_Screen::get( $screen_id ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		return static function() use ( $original_screen ) {
			global $current_screen;

			$current_screen = $original_screen; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			return true;
		};
	}
}
