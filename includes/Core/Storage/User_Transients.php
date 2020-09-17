<?php
/**
 * Class Google\Site_Kit\Core\Storage\User_Transients
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

use Google\Site_Kit\Context;

/**
 * Class providing access to per-user transients.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class User_Transients implements User_Aware_Interface {

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * User_Options object.
	 *
	 * @since n.e.x.t
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 * @param int     $user_id Optional. User ID for whom transients should be managed. Default is the current user.
	 */
	public function __construct( Context $context, $user_id = 0 ) {
		$this->context      = $context;
		$this->user_options = new User_Options( $context, $user_id );
	}

	/**
	 * Gets the associated user ID.
	 *
	 * @since n.e.x.t
	 *
	 * @return int User ID.
	 */
	public function get_user_id() {
		return $this->user_options->get_user_id();
	}

	/**
	 * Switches the current user to the one with the given ID.
	 *
	 * This method exists to exchange the user that is set as the current user in WordPress on the fly. In most cases
	 * it is preferred to create a new instance of the class when dealing with multiple users. This method should only
	 * be applied when the entire chain of class main instances need to be updated to rely on another user, i.e. when
	 * the current WordPress user has changed.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $user_id User ID.
	 * @return callable A closure to switch back to the original user.
	 */
	public function switch_user( $user_id ) {
		return $this->user_options->switch_user( $user_id );
	}

}
