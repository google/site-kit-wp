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
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class for handling Key_Metrics.
 *
 * @since 1.93.0
 * @access private
 * @ignore
 */
class Key_Metrics {

	use Method_Proxy_Trait;

	/**
	 * Key_Metrics_Settings instance.
	 *
	 * @since 1.93.0
	 * @var Key_Metrics_Settings
	 */
	protected $key_metrics_settings;

	/**
	 * Key_Metrics_Setup_Completed_By instance.
	 *
	 * @since 1.113.0
	 * @var Key_Metrics_Setup_Completed_By
	 */
	protected $key_metrics_setup_completed_by;

	/**
	 * REST_Key_Metrics_Controller instance.
	 *
	 * @since 1.93.0
	 * @var REST_Key_Metrics_Controller
	 */
	protected $rest_controller;

	/**
	 * Key_Metrics_Setup_New instance.
	 *
	 * @since 1.115.0
	 * @var Key_Metrics_Setup_New
	 */
	protected $key_metrics_setup_new;

	/**
	 * Constructor.
	 *
	 * @since 1.93.0
	 *
	 * @param Context      $context Plugin context.
	 * @param User_Options $user_options Optional. User option API. Default is a new instance.
	 * @param Options      $options        Optional. Option API instance. Default is a new instance.
	 */
	public function __construct( Context $context, User_Options $user_options = null, Options $options = null ) {
		$this->key_metrics_settings           = new Key_Metrics_Settings( $user_options ?: new User_Options( $context ) );
		$this->key_metrics_setup_completed_by = new Key_Metrics_Setup_Completed_By( $options ?: new Options( $context ) );
		$this->key_metrics_setup_new          = new Key_Metrics_Setup_New( new Transients( $context ) );
		$this->rest_controller                = new REST_Key_Metrics_Controller( $this->key_metrics_settings, $this->key_metrics_setup_completed_by );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.93.0
	 */
	public function register() {
		$this->key_metrics_settings->register();
		$this->key_metrics_setup_completed_by->register();
		$this->key_metrics_setup_new->register();
		$this->rest_controller->register();

		add_filter( 'googlesitekit_inline_base_data', $this->get_method_proxy( 'inline_js_base_data' ) );
	}

	/**
	 * Adds the status of the Key Metrics widget setup to the inline JS data.
	 *
	 * @since 1.108.0
	 * @since 1.113.0 Add keyMetricsSetupCompletedBy (id) instead of keyMetricsSetupCompleted boolean.
	 *
	 * @param array $data Inline JS data.
	 * @return array Filtered $data.
	 */
	private function inline_js_base_data( $data ) {
		$data['keyMetricsSetupCompletedBy'] = (int) $this->key_metrics_setup_completed_by->get();

		return $data;
	}
}
