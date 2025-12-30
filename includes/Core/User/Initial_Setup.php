<?php
/**
 * Class Google\Site_Kit\Core\User\Initial_Setup
 *
 * @package   Google\Site_Kit\Core\User
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User;

use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class for handling initial setup rest routes.
 *
 * @since 1.164.0
 * @access private
 * @ignore
 */
class Initial_Setup {

	/**
	 * Initial_Setup_Settings instance.
	 *
	 * @since 1.164.0
	 * @var Initial_Setup_Settings
	 */
	private $initial_setup_settings;

	/**
	 * REST_Initial_Setup_Controller instance.
	 *
	 * @since 1.164.0
	 * @var REST_Initial_Setup_Controller
	 */
	private $rest_controller;

	/**
	 * Constructor.
	 *
	 * @since 1.164.0
	 *
	 * @param User_Options $user_options User_Options instance.
	 */
	public function __construct( User_Options $user_options ) {
		$this->initial_setup_settings = new Initial_Setup_Settings( $user_options );
		$this->rest_controller        = new REST_Initial_Setup_Controller( $this->initial_setup_settings );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.164.0
	 */
	public function register() {
		$this->initial_setup_settings->register();
		$this->rest_controller->register();
	}
}
