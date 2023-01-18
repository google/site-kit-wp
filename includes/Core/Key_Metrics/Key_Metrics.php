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
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Key_Metrics {

	/**
	 * Key_Metrics_Settings instance.
	 *
	 * @since n.e.x.t
	 * @var Key_Metrics_Settings
	 */
	protected $key_metrics_settings;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context      $context Plugin context.
	 * @param User_Options $user_options Optional. User option API. Default is a new instance.
	 */
	public function __construct( Context $context, User_Options $user_options = null ) {
		$this->key_metrics_settings = new Key_Metrics_Settings( $user_options ?: new User_Options( $context ) );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		$this->key_metrics_settings->register();
	}

}
