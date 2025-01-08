<?php
/**
 * Class Google\Site_Kit\Core\User\Conversion_Reporting
 *
 * @package   Google\Site_Kit\Core\User
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User;

use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class for handling conversion reporting settings rest routes.
 *
 * @since 1.144.0
 * @access private
 * @ignore
 */
class Conversion_Reporting {

	/**
	 * Conversion_Reporting_Settings instance.
	 *
	 * @since 1.144.0
	 * @var Conversion_Reporting_Settings
	 */
	private $conversion_reporting_settings;

	/**
	 * REST_Conversion_Reporting_Controller instance.
	 *
	 * @since 1.144.0
	 * @var REST_Conversion_Reporting_Controller
	 */
	private $rest_controller;

	/**
	 * Constructor.
	 *
	 * @since 1.144.0
	 *
	 * @param User_Options $user_options User_Options instance.
	 */
	public function __construct( User_Options $user_options ) {
		$this->conversion_reporting_settings = new Conversion_Reporting_Settings( $user_options );
		$this->rest_controller               = new REST_Conversion_Reporting_Controller( $this->conversion_reporting_settings );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.144.0
	 */
	public function register() {
		$this->conversion_reporting_settings->register();
		$this->rest_controller->register();
	}
}
