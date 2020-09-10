<?php
/**
 * Trait Google\Site_Kit\Core\Util\WP_Context_Switcher_Trait
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Trait for temporarily switching WordPress context, e.g. from admin to frontend.
 *
 * @since 1.16.0
 * @access private
 * @ignore
 */
trait WP_Context_Switcher_Trait {

	/**
	 * Switches to WordPress frontend context if necessary.
	 *
	 * Context is only switched if WordPress is not already in frontend context. Context should only ever be switched
	 * temporarily. Call the returned closure as soon as possible after to restore the original context.
	 *
	 * @since 1.16.0
	 *
	 * @return callable Closure that restores context.
	 */
	protected static function with_frontend_context() {
		$restore = self::get_restore_current_screen_closure();

		if ( ! is_admin() ) {
			return $restore;
		}

		self::switch_current_screen( 'front' );
		return $restore;
	}

	/**
	 * Switches the current WordPress screen via the given screen ID or hook name.
	 *
	 * @since 1.16.0
	 *
	 * @param string $screen_id WordPress screen ID.
	 */
	private static function switch_current_screen( $screen_id ) {
		global $current_screen;

		require_once ABSPATH . 'wp-admin/includes/class-wp-screen.php';
		require_once ABSPATH . 'wp-admin/includes/screen.php';

		$current_screen = \WP_Screen::get( $screen_id ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	}

	/**
	 * Returns the closure to restore the current screen.
	 *
	 * Calling the closure will restore the `$current_screen` global to what it was set to at the time of calling
	 * this method.
	 *
	 * @since 1.16.0
	 *
	 * @return callable Closure that restores context.
	 */
	private static function get_restore_current_screen_closure() {
		global $current_screen;

		$original_screen = $current_screen;

		return static function() use ( $original_screen ) {
			global $current_screen;

			$current_screen = $original_screen; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		};
	}
}
