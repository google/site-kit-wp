<?php
/**
 * Class Google\Site_Kit\Core\Key_Metrics\Key_Metrics
 *
 * @package   Google\Site_Kit\Core\Key_Metrics
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Key_Metrics;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class for handling Key_Metrics.
 *
 * @since 1.93.0
 * @access private
 * @ignore
 */
class Key_Metrics {

	/**
	 * Key_Metrics_Settings instance.
	 *
	 * @since 1.93.0
	 * @var Key_Metrics_Settings
	 */
	protected $key_metrics_settings;

	/**
	 * REST_Key_Metrics_Controller instance.
	 *
	 * @since 1.93.0
	 * @var REST_Key_Metrics_Controller
	 */
	protected $rest_controller;

	/**
	 * Constructor.
	 *
	 * @since 1.93.0
	 *
	 * @param Context      $context Plugin context.
	 * @param User_Options $user_options Optional. User option API. Default is a new instance.
	 */
	public function __construct( Context $context, User_Options $user_options = null ) {
		$this->key_metrics_settings = new Key_Metrics_Settings( $user_options ?: new User_Options( $context ) );
		$this->rest_controller      = new REST_Key_Metrics_Controller( $this->key_metrics_settings );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.93.0
	 */
	public function register() {
		$this->key_metrics_settings->register();
		$this->rest_controller->register();
	}

}
