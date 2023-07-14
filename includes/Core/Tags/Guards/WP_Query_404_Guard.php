<?php
/**
 * Class Google\Site_Kit\Core\Tags\Guards\WP_Query_404_Guard
 *
 * @package   Google\Site_Kit\Core\Tags\Guards
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags\Guards;

use Google\Site_Kit\Core\Guards\Guard_Interface;

/**
 * Class for WP_Query 404 guard.
 *
 * @since 1.105.0
 * @access private
 * @ignore
 */
class WP_Query_404_Guard implements Guard_Interface {
	/**
	 * Determines whether the guarded tag can be activated or not.
	 *
	 * @since 1.105.0
	 *
	 * @return bool TRUE if guarded tag can be activated, otherwise FALSE or an error.
	 */
	public function can_activate() {
		return ! is_404();
	}

}
