<?php
/**
 * Class Google\Site_Kit\Core\Tags\First_Party_Mode\First_Party_Mode
 *
 * @package   Google\Site_Kit\Core\Tags\First_Party_Mode
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags\First_Party_Mode;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module_With_Debug_Fields;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Tags\First_Party_Mode\First_Party_Mode_Cron;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class for handling First Party Mode.
 *
 * @since 1.141.0
 * @access private
 * @ignore
 */
class First_Party_Mode implements Module_With_Debug_Fields {
	use Method_Proxy_Trait;

	/**
	 * Context instance.
	 *
	 * @since 1.141.0
	 * @var Context
	 */
	protected $context;

	/**
	 * First_Party_Mode_Settings instance.
	 *
	 * @since 1.141.0
	 * @var First_Party_Mode_Settings
	 */
	protected $first_party_mode_settings;

	/**
	 * REST_First_Party_Mode_Controller instance.
	 *
	 * @since 1.141.0
	 * @var REST_First_Party_Mode_Controller
	 */
	protected $rest_controller;

	/**
	 * First_Party_Mode_Cron instance.
	 *
	 * @since 1.142.0
	 * @var First_Party_Mode_Cron
	 */
	private $cron;

	/**
	 * Constructor.
	 *
	 * @since 1.141.0
	 *
	 * @param Context $context Plugin context.
	 * @param Options $options Optional. Option API instance. Default is a new instance.
	 */
	public function __construct( Context $context, Options $options = null ) {
		$this->context                   = $context;
		$options                         = $options ?: new Options( $context );
		$this->first_party_mode_settings = new First_Party_Mode_Settings( $options );
		$this->rest_controller           = new REST_First_Party_Mode_Controller( $this, $this->first_party_mode_settings );
		$this->cron                      = new First_Party_Mode_Cron(
			$this->first_party_mode_settings,
			array( $this, 'healthcheck' )
		);
	}

	/**
	 * Registers the settings and REST controller.
	 *
	 * @since 1.141.0
	 */
	public function register() {
		$this->first_party_mode_settings->register();
		$this->rest_controller->register();
		$this->cron->register();

		add_action( 'admin_init', fn () => $this->on_admin_init() );
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
	 *
	 * @return array
	 */
	public function get_debug_fields() {
		$settings = $this->first_party_mode_settings->get();

		return array(
			'first_party_mode_is_enabled'               => array(
				'label' => __( 'First-party mode: Enabled', 'google-site-kit' ),
				'value' => $this->health_check_debug_field_value( $settings['isEnabled'] ),
				'debug' => $this->health_check_debug_field_debug( $settings['isEnabled'] ),
			),
			'first_party_mode_is_fpm_healthy'           => array(
				'label' => __( 'First-party mode: Service healthy', 'google-site-kit' ),
				'value' => $this->health_check_debug_field_value( $settings['isFPMHealthy'] ),
				'debug' => $this->health_check_debug_field_debug( $settings['isFPMHealthy'] ),
			),
			'first_party_mode_is_script_access_enabled' => array(
				'label' => __( 'First-party mode: Script accessible', 'google-site-kit' ),
				'value' => $this->health_check_debug_field_value( $settings['isScriptAccessEnabled'] ),
				'debug' => $this->health_check_debug_field_debug( $settings['isScriptAccessEnabled'] ),
			),
		);
	}

	/**
	 * Checks the health of First Party Mode server requirements.
	 *
	 * @since 1.142.0
	 *
	 * @return void
	 */
	public function healthcheck() {
		$is_fpm_healthy           = $this->is_endpoint_healthy( 'https://g-1234.fps.goog/mpath/healthy' );
		$is_script_access_enabled = $this->is_endpoint_healthy( add_query_arg( 'healthCheck', '1', plugins_url( 'fpm/measurement.php', GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );

		$this->first_party_mode_settings->merge(
			array(
				'isFPMHealthy'          => $is_fpm_healthy,
				'isScriptAccessEnabled' => $is_script_access_enabled,
			)
		);
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
	 * @since 1.142.0 Relocated from REST_First_Party_Mode_Controller.
	 * @since 1.144.0 Uses Google\FirstPartyLibrary\RequestHelper to send requests.
	 *
	 * @param string $endpoint The endpoint to check.
	 * @return bool True if the endpoint is healthy, false otherwise.
	 */
	protected function is_endpoint_healthy( $endpoint ) {
		if ( ! defined( 'IS_FIRST_PARTY_MODE_TEST' ) ) {
			// TODO: This is a workaround to allow the measurement.php file to be loaded without making a
			// request, in order to use the RequestHelper class that it defines. We should find a better
			// solution in the future, but this will involve changes to the measurement.php file.
			define( 'IS_FIRST_PARTY_MODE_TEST', true );
		}

		require_once GOOGLESITEKIT_PLUGIN_DIR_PATH . 'fpm/measurement.php';

		$request_helper = new \Google\FirstPartyLibrary\RequestHelper();

		$response = $request_helper->sendRequest( $endpoint );

		if ( 200 !== $response['statusCode'] ) {
			return false;
		}

		if ( 'ok' !== $response['body'] ) {
			return false;
		}

		return true;
	}
}
