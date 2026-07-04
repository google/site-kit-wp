<?php
/**
 * Class Google\Site_Kit\Core\Util\Current_Screen
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use WP_Screen;

/**
 * Helper for safely accessing the current `WP_Screen`.
 *
 * @since 1.182.0
 * @access private
 * @ignore
 */
class Current_Screen {

	/**
	 * Returns the current `WP_Screen`, or `null` when called outside the admin
	 * (where `wp-admin/includes/screen.php` has not been loaded and
	 * `get_current_screen()` is not defined).
	 *
	 * @since 1.182.0
	 *
	 * @return WP_Screen|null Current `WP_Screen` instance, or null when called outside the admin.
	 */
	public static function get(): ?WP_Screen {
		if ( ! function_exists( 'get_current_screen' ) ) {
			return null;
		}

		$screen = get_current_screen();

		return $screen instanceof WP_Screen ? $screen : null;
	}
}
