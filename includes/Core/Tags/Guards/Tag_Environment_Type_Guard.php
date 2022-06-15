<?php
/**
 * Class Google\Site_Kit\Core\Tags\Guards\Tag_Production_Guard
 *
 * @package   Google\Site_Kit\Core\Tags\Guards
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags\Guards;

use Google\Site_Kit\Core\Guards\Guard_Interface;

/**
 * Guard that verifies if we're in a production environment.
 *
 * @since 1.38.0
 * @access private
 * @ignore
 */
class Tag_Production_Guard implements Guard_Interface {
	/**
	 * Determines whether the guarded tag can be activated or not.
	 *
	 * @since 1.38.0
	 *
	 * @return bool TRUE if guarded tag can be activated, otherwise FALSE.
	 */
	public function can_activate() {
		if ( ! function_exists( 'wp_get_environment_type' ) ) {
			return true;
		}
		return 'production' === wp_get_environment_type();
	}
}
