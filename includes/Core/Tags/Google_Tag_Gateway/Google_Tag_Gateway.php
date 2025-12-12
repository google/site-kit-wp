<?php
/**
 * Class Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway
 *
 * @package   Google\Site_Kit\Core\Tags\Google_Tag_Gateway
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags\Google_Tag_Gateway;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module_With_Debug_Fields;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway_Cron;
use Google\Site_Kit\Core\Tracking\Feature_Metrics_Trait;
use Google\Site_Kit\Core\Tracking\Provides_Feature_Metrics;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class for handling Google Tag Gateway.
 *
 * @since 1.141.0
 * @since 1.157.0 Renamed from First_Party_Mode to Google_Tag_Gateway.
 * @access private
 * @ignore
 */
class Google_Tag_Gateway implements Module_With_Debug_Fields, Provides_Feature_Metrics {
	use Method_Proxy_Trait;
	use Feature_Metrics_Trait;

	/**
	 * Context instance.
	 *
	 * @since 1.141.0
	 * @var Context
	 */
	protected $context;

	/**
	 * Google_Tag_Gateway_Settings instance.
	 *
	 * @since 1.141.0
	 * @var Google_Tag_Gateway_Settings
	 */
	protected $google_tag_gateway_settings;

	/**
	 * Google_Tag_Gateway_Health instance.
	 *
	 * @since n.e.x.t
	 * @var Google_Tag_Gateway_Health
	 */
	protected $health_state;

	/**
	 * REST_Google_Tag_Gateway_Controller instance.
	 *
	 * @since 1.141.0
	 * @var REST_Google_Tag_Gateway_Controller
	 */
	protected $rest_controller;

	/**
	 * Google_Tag_Gateway_Cron instance.
	 *
	 * @since 1.142.0
	 * @var Google_Tag_Gateway_Cron
	 */
	private $cron;

	/**
	 * Constructor.
	 *
	 * @since 1.141.0
	 * @since n.e.x.t Added health state instance.
	 *
	 * @param Context $context Plugin context.
	 * @param Options $options Optional. Option API instance. Default is a new instance.
	 */
	public function __construct( Context $context, ?Options $options = null ) {
		$this->context                     = $context;
		$options                           = $options ?: new Options( $context );
		$this->google_tag_gateway_settings = new Google_Tag_Gateway_Settings( $options );
		$this->health_state                = new Google_Tag_Gateway_Health( $options );
		$this->rest_controller             = new REST_Google_Tag_Gateway_Controller( $this, $this->google_tag_gateway_settings, $this->health_state );
		$this->cron                        = new Google_Tag_Gateway_Cron(
			$this->google_tag_gateway_settings,
			array( $this, 'healthcheck' )
		);
	}

	/**
	 * Registers the settings and REST controller.
	 *
	 * @since 1.141.0
	 * @since n.e.x.t Register health state.
	 */
	public function register() {
		$this->google_tag_gateway_settings->register();
		$this->health_state->register();
		$this->rest_controller->register();
		$this->cron->register();
		$this->register_feature_metrics();

		add_action( 'admin_init', fn () => $this->on_admin_init() );
	}

	/**
	 * Gets an array of internal feature metrics.
	 *
	 * @since 1.162.0
	 * @since n.e.x.t Updated to use separated health state.
	 *
	 * @return array
	 */
	public function get_feature_metrics() {
		$settings    = $this->google_tag_gateway_settings->get();
		$health_data = $this->health_state->get();

		return array(
			'gtg_enabled' => (bool) isset( $settings['isEnabled'] ) && $settings['isEnabled'],
			'gtg_healthy' => $this->get_health_check_feature_metric( $settings, $health_data ),
		);
	}

	/**
	 * Maps a combination of GTG settings to a suitable string
	 * for internal feature metrics tracking.
	 *
	 * @since 1.162.0
	 * @since n.e.x.t Updated to use separated health data.
	 *
	 * @param mixed $settings    Settings array.
	 * @param mixed $health_data Health data array.
	 * @return string
	 */
	private function get_health_check_feature_metric( $settings, $health_data ) {
		if ( ! isset( $settings['isEnabled'] ) || ! $settings['isEnabled'] ) {
			return '';
		}

		if (
			isset( $health_data['isUpstreamHealthy'] ) &&
			true === $health_data['isUpstreamHealthy'] &&
			isset( $health_data['isMpathHealthy'] ) &&
			true === $health_data['isMpathHealthy']
		) {
			return 'yes';
		}

		return 'no';
	}

	/**
	 * Gets a healthcheck debug field display value.
	 *
	 * @since 1.142.0
	 *
	 * @param mixed $setting_value Setting value.
	 * @return string
	 */
	private function health_check_debug_field_value( $setting_value ) {
		if ( true === $setting_value ) {
			return __( 'Yes', 'google-site-kit' );
		} elseif ( false === $setting_value ) {
			return __( 'No', 'google-site-kit' );
		}
		return '-';
	}

	/**
	 * Gets a healthcheck debug field debug value.
	 *
	 * @since 1.142.0
	 *
	 * @param mixed $setting_value Setting value.
	 * @return string
	 */
	private function health_check_debug_field_debug( $setting_value ) {
		if ( true === $setting_value ) {
			return 'yes';
		} elseif ( false === $setting_value ) {
			return 'no';
		}
		return '-';
	}

	/**
	 * Gets an array of debug field definitions.
	 *
	 * @since 1.142.0
	 * @since 1.162.0 Updated to use Google_Tag_Gateway_Settings->is_google_tag_gateway_active()
	 * instead of inline logic to determine effective GTG status.
	 * @since n.e.x.t Updated to use separated health state.
	 *
	 * @return array
	 */
	public function get_debug_fields() {
		$health_data = $this->health_state->get();

		// Determine effective GTG status based on settings and health checks.
		$is_gtg_effectively_enabled = $this->is_ready_and_active();

		return array(
			'google_tag_gateway_is_enabled'          => array(
				'label' => __( 'Google tag gateway for advertisers', 'google-site-kit' ),
				'value' => $is_gtg_effectively_enabled ? __( 'Enabled', 'google-site-kit' ) : __( 'Disabled', 'google-site-kit' ),
				'debug' => $this->health_check_debug_field_debug( $is_gtg_effectively_enabled ),
			),
			'google_tag_gateway_is_upstream_healthy' => array(
				'label' => __( 'Google tag gateway for advertisers: Service healthy', 'google-site-kit' ),
				'value' => $this->health_check_debug_field_value( $health_data['isUpstreamHealthy'] ),
				'debug' => $this->health_check_debug_field_debug( $health_data['isUpstreamHealthy'] ),
			),
			'google_tag_gateway_is_mpath_healthy'    => array(
				'label' => __( 'Google tag gateway for advertisers: Script accessible', 'google-site-kit' ),
				'value' => $this->health_check_debug_field_value( $health_data['isMpathHealthy'] ),
				'debug' => $this->health_check_debug_field_debug( $health_data['isMpathHealthy'] ),
			),
		);
	}

	/**
	 * Checks the health of Google Tag Gateway server requirements.
	 *
	 * @since 1.142.0
	 * @since n.e.x.t Updated to save health data to health state.
	 *
	 * @return void
	 */
	public function healthcheck() {
		$is_upstream_healthy = $this->is_endpoint_healthy( 'https://g-1234.fps.goog/mpath/healthy' );
		$is_mpath_healthy    = $this->is_endpoint_healthy( add_query_arg( 'healthCheck', '1', plugins_url( 'gtg/measurement.php', GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );

		$this->health_state->merge(
			array(
				'isUpstreamHealthy' => $is_upstream_healthy,
				'isMpathHealthy'    => $is_mpath_healthy,
			)
		);
	}

	/**
	 * Checks if Google Tag Gateway is ready and active.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if GTG is ready and active, false otherwise.
	 */
	public function is_ready_and_active() {
		$settings = $this->google_tag_gateway_settings->get();

		// Check if GTG is enabled in settings.
		if ( ! isset( $settings['isEnabled'] ) || ! $settings['isEnabled'] ) {
			return false;
		}

		// Check if health checks pass.
		return $this->health_state->is_healthy();
	}

	/**
	 * Schedule cron on admin init.
	 *
	 * @since 1.142.0
	 */
	public function on_admin_init() {
		$this->cron->maybe_schedule_cron();
	}

	/**
	 * Checks if an endpoint is healthy. The endpoint must return a `200 OK` response with the body `ok`.
	 *
	 * @since 1.141.0
	 * @since 1.142.0 Relocated from REST_Google_Tag_Gateway_Controller.
	 * @since 1.144.0 Uses Google\GoogleTagGatewayLibrary\RequestHelper to send requests.
	 * @since 1.163.0 Uses Google\GoogleTagGatewayLibrary\Http\RequestHelper to send requests.
	 *
	 * @param string $endpoint The endpoint to check.
	 * @return bool True if the endpoint is healthy, false otherwise.
	 */
	protected function is_endpoint_healthy( $endpoint ) {
		if ( ! defined( 'GOOGLESITEKIT_GTG_ENDPOINT_HEALTH_CHECK' ) ) {
			// TODO: This is a workaround to allow the measurement.php file to be loaded without making a
			// request, in order to use the RequestHelper class that it defines. We should find a better
			// solution in the future, but this will involve changes to the measurement.php file.
			define( 'GOOGLESITEKIT_GTG_ENDPOINT_HEALTH_CHECK', true );
		}

		require_once GOOGLESITEKIT_PLUGIN_DIR_PATH . 'gtg/measurement.php';

		$request_helper = new \Google\GoogleTagGatewayLibrary\Http\RequestHelper();

		$response = $request_helper->sendRequest( 'GET', $endpoint );

		if ( 200 !== $response['statusCode'] ) {
			return false;
		}

		if ( 'ok' !== $response['body'] ) {
			return false;
		}

		return true;
	}
}
