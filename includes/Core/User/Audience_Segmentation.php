<?php
/**
 * Class Google\Site_Kit\Core\User\Audience_Segmentation
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
class Audience_Segmentation {

	/**
	 * Audience_Settings instance.
	 *
	 * @since n.e.x.t
	 * @var Audience_Settings
	 */
	private $audience_settings;

	/**
	 * REST_Audience_Settings_Controller instance.
	 *
	 * @since n.e.x.t
	 * @var REST_Audience_Settings_Controller
	 */
	private $rest_controller;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param User_Options $user_options User_Options instance.
	 */
	public function __construct( User_Options $user_options ) {
		$this->audience_settings = new Audience_Settings( $user_options );
		$this->rest_controller   = new REST_Audience_Settings_Controller( $this->audience_settings );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		$this->audience_settings->register();
		$this->rest_controller->register();
	}
}
