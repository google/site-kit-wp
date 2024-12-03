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
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Core\Tags\First_Party_Mode\First_Party_Mode_Cron;

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
	 * @since n.e.x.t
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
		$this->rest_controller           = new REST_First_Party_Mode_Controller( $this->first_party_mode_settings );
		$this->cron                      = new First_Party_Mode_Cron( array( $this, 'healthcheck' ) );
	}

	/**
	 * Registers the settings and REST controller.
	 *
	 * @since 1.141.0
	 */
	public function register() {
		$this->first_party_mode_settings->register();
		$this->rest_controller->register();
		add_action( 'admin_init', fn () => $this->on_admin_init() );
	}

	/**
	 * Gets an array of debug field definitions.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	public function get_debug_fields() {
		$settings = $this->first_party_mode_settings->get();

		return array(
			'first_party_mode_is_enabled' => array(
				'label' => __( 'First-Party Mode: Enabled', 'google-site-kit' ),
				'value' => $settings['isEnabled'] ? __( 'Yes', 'google-site-kit' ) : __( 'No', 'google-site-kit' ),
				'debug' => $settings['isEnabled'] ? 'yes' : 'no',
			),
		);
	}

	/**
	 * Checks the health of First Party Mode server requirements.
	 *
	 * @since n.e.x.t
	 *
	 * @return void
	 */
	public function healthcheck() {
		$is_fpm_healthy           = $this->rest_controller->is_endpoint_healthy( 'https://g-1234.fps.goog/mpath/healthy' );
		$is_script_access_enabled = $this->rest_controller->is_endpoint_healthy( add_query_arg( 'healthCheck', '1', plugins_url( 'fpm/measurement.php', GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );

		$settings    = $this->first_party_mode_settings->get();
		$fpm_enabled = $settings['isEnabled'];

		$this->first_party_mode_settings->merge(
			array(
				'isEnabled'             => $fpm_enabled ? $is_fpm_healthy && $is_script_access_enabled : $fpm_enabled,
				'isFPMHealthy'          => $is_fpm_healthy,
				'isScriptAccessEnabled' => $is_script_access_enabled,
			)
		);
	}

	/**
	 * Schedule cron on admin init.
	 *
	 * @since n.e.x.t
	 */
	public function on_admin_init() {
		$this->cron->maybe_schedule_cron();
	}
}
