<?php
/**
 * Trait Google\Site_Kit\Core\Storage\User_Aware
 *
 * @package   Google\Site_Kit\Core\Storage
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

/**
 * Trait for user aware entities.
 *
 * @since 1.18.0
 * @access private
 * @ignore
 */
trait User_Aware_Trait {

	/**
	 * User ID.
	 *
	 * @since 1.18.0
	 * @var int
	 */
	private $user_id;

	/**
	 * Gets the associated user ID.
	 *
	 * @since 1.18.0
	 *
	 * @return int User ID.
	 */
	public function get_user_id() {
		return (int) $this->user_id;
	}

	/**
	 * Switches the current user to the one with the given ID.
	 *
	 * This method exists to exchange the user that is set as the current user in WordPress on the fly. In most cases
	 * it is preferred to create a new instance of the class when dealing with multiple users. This method should only
	 * be applied when the entire chain of class main instances need to be updated to rely on another user, i.e. when
	 * the current WordPress user has changed.
	 *
	 * @since 1.18.0
	 *
	 * @param int $user_id User ID.
	 * @return callable A closure to switch back to the original user.
	 */
	public function switch_user( $user_id ) {
		$prev_user_id = $this->user_id;

		$this->user_id = (int) $user_id;

		return function() use ( $prev_user_id ) {
			$this->user_id = $prev_user_id;
		};
	}

}
