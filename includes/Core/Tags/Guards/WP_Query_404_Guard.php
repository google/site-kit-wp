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
 * Base class for a module tag guard.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class WP_Query_404_Guard implements Guard_Interface {
	/**
	 * Determines whether the guarded tag can be activated or not.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool TRUE if guarded tag can be activated, otherwise FALSE or an error.
	 */
	public function can_activate() {
		return ! is_404();
	}

}
