<?php
/**
 * Class Google\Site_Kit\Core\User\Email_Reporting
 *
 * @package   Google\Site_Kit\Core\User
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User;

use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class for handling email reporting settings rest routes.
 *
 * @since 1.162.0
 * @access private
 * @ignore
 */
class Email_Reporting {

	/**
	 * Email_Reporting_Settings instance.
	 *
	 * @since 1.162.0
	 * @var Email_Reporting_Settings
	 */
	private $email_reporting_settings;

	/**
	 * REST_Email_Reporting_Controller instance.
	 *
	 * @since 1.162.0
	 * @var REST_Email_Reporting_Controller
	 */
	private $rest_controller;

	/**
	 * Constructor.
	 *
	 * @since 1.162.0
	 *
	 * @param User_Options $user_options User_Options instance.
	 */
	public function __construct( User_Options $user_options ) {
		$this->email_reporting_settings = new Email_Reporting_Settings( $user_options );
		$this->rest_controller          = new REST_Email_Reporting_Controller( $this->email_reporting_settings );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.162.0
	 */
	public function register() {
		$this->email_reporting_settings->register();
		$this->rest_controller->register();
	}
}
