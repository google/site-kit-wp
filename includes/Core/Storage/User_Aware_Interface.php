<?php
/**
 * Interface Google\Site_Kit\Core\Storage\User_Aware_Interface
 *
 * @package   Google\Site_Kit\Core\Storage
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

/**
 * Interface for Options implementations.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
interface User_Aware_Interface {

	/**
	 * Gets user ID.
	 *
	 * @since n.e.x.t
	 *
	 * @return int User ID.
	 */
	public function get_user_id();

	/**
	 * Switches users.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $user_id User ID.
	 * @return callable A closure to switch back to the original user.
	 */
	public function switch_user( $user_id );

}
