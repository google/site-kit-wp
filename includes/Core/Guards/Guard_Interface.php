<?php
/**
 * Interface Google\Site_Kit\Core\Guards\Guard_Interface
 *
 * @package   Google\Site_Kit\Core\Guards
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Guards;

use WP_Error;

/**
 * Interface for a guard.
 *
 * @since 1.24.0
 * @access private
 * @ignore
 */
interface Guard_Interface {

	/**
	 * Determines whether the guarded entity can be activated or not.
	 *
	 * @since 1.24.0
	 *
	 * @return bool|WP_Error TRUE if guarded entity can be activated, otherwise FALSE or an error.
	 */
	public function can_activate();

}
