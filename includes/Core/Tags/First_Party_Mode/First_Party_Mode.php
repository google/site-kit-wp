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
	}

	/**
	 * Registers the settings and REST controller.
	 *
	 * @since 1.141.0
	 */
	public function register() {
		$this->first_party_mode_settings->register();
		$this->rest_controller->register();
	}

	/**
	 * Gets a healthcheck debug field display value.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	public function get_debug_fields() {
		$settings = $this->first_party_mode_settings->get();

		return array(
			'first_party_mode_is_enabled'               => array(
				'label' => __( 'First-Party Mode: Enabled', 'google-site-kit' ),
				'value' => $settings['isEnabled'] ? __( 'Yes', 'google-site-kit' ) : __( 'No', 'google-site-kit' ),
				'debug' => $settings['isEnabled'] ? 'yes' : 'no',
			),
			'first_party_mode_is_fpm_healthy'           => array(
				'label' => __( 'First Party Mode: Service healthy', 'google-site-kit' ),
				'value' => $this->health_check_debug_field_value( $settings['isFPMHealthy'] ),
				'debug' => $this->health_check_debug_field_debug( $settings['isFPMHealthy'] ),
			),
			'first_party_mode_is_script_access_enabled' => array(
				'label' => __( 'First Party Mode: Script accessible', 'google-site-kit' ),
				'value' => $this->health_check_debug_field_value( $settings['isScriptAccessEnabled'] ),
				'debug' => $this->health_check_debug_field_debug( $settings['isScriptAccessEnabled'] ),
			),
		);
	}
}
