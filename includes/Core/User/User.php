<?php
/**
 * Class Google\Site_Kit\Core\User\User
 *
 * @package   Google\Site_Kit\Core\User
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User;

use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class for handling audience settings rest routes.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class User {

	/**
	 * Audience_Segmentation instance.
	 *
	 * @since n.e.x.t
	 * @var Audience_Segmentation
	 */
	private $audience_segmentation;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param User_Options $user_options User_Options instance.
	 */
	public function __construct( User_Options $user_options ) {
		$this->audience_segmentation = new Audience_Segmentation( $user_options );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		$this->audience_segmentation->register();
	}
}
