<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Email_Reporting
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Email_Reporting_Settings as User_Email_Reporting_Settings;

/**
 * Base class for Email Reporting feature.
 *
 * @since 1.162.0
 * @access private
 * @ignore
 */
class Email_Reporting {

	/**
	 * Context instance.
	 *
	 * @since 1.162.0
	 * @var Context
	 */
	protected $context;

	/**
	 * Email_Reporting_Settings instance.
	 *
	 * @since 1.162.0
	 * @var Email_Reporting_Settings
	 */
	protected $settings;

	/**
	 * User_Options instance.
	 *
	 * @since 1.166.0
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * User_Email_Reporting_Settings instance.
	 *
	 * @since 1.166.0
	 * @var User_Email_Reporting_Settings
	 */
	protected $user_settings;

	/**
	 * REST_Email_Reporting_Controller instance.
	 *
	 * @since 1.162.0
	 * @var REST_Email_Reporting_Controller
	 */
	protected $rest_controller;

	/**
	 * Email_Log instance.
	 *
	 * @since 1.166.0
	 * @var Email_Log
	 */
	protected $email_log;

	/**
	 * Constructor.
	 *
	 * @since 1.162.0
	 *
	 * @param Context      $context Plugin context.
	 * @param Options|null $options Optional. Options instance. Default is a new instance.
	 */
	public function __construct( Context $context, ?Options $options = null ) {
		$this->context         = $context;
		$options               = $options ?: new Options( $this->context );
		$this->settings        = new Email_Reporting_Settings( $options );
		$this->user_options    = new User_Options( $context );
		$this->user_settings   = new User_Email_Reporting_Settings( $this->user_options );
		$this->rest_controller = new REST_Email_Reporting_Controller( $this->settings );
		$this->email_log       = new Email_Log( $this->context );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.162.0
	 */
	public function register() {
		$this->settings->register();
		$this->rest_controller->register();

		// Register WP admin pointer for Email Reporting onboarding.
		( new Email_Reporting_Pointer( $this->context, $this->user_options, $this->user_settings ) )->register();
		$this->email_log->register();
	}
}
