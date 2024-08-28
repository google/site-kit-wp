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
 * @since 1.134.0
 * @access private
 * @ignore
 */
class Audience_Segmentation {

	/**
	 * Audience_Settings instance.
	 *
	 * @since 1.134.0
	 * @var Audience_Settings
	 */
	private $audience_settings;

	/**
	 * REST_Audience_Settings_Controller instance.
	 *
	 * @since 1.134.0
	 * @var REST_Audience_Settings_Controller
	 */
	private $rest_controller;

	/**
	 * Constructor.
	 *
	 * @since 1.134.0
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
	 * @since 1.134.0
	 */
	public function register() {
		$this->audience_settings->register();
		$this->rest_controller->register();
	}
}
