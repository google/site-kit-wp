<?php
/**
 * Class Google\Site_Kit\Core\Consent_Mode\Consent_Mode
 *
 * @package   Google\Site_Kit\Core\Consent_Mode
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Consent_Mode;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\BC_Functions;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Plugin_Upgrader;
use Plugin_Installer_Skin;

/**
 * Class for handling Consent Mode.
 *
 * @since 1.122.0
 * @access private
 * @ignore
 */
class Consent_Mode {
	use Method_Proxy_Trait;

	/**
	 * Context instance.
	 *
	 * @since 1.132.0
	 * @var Context
	 */
	protected $context;

	/**
	 * Consent_Mode_Settings instance.
	 *
	 * @since 1.122.0
	 * @var Consent_Mode_Settings
	 */
	protected $consent_mode_settings;

	/**
	 * REST_Consent_Mode_Controller instance.
	 *
	 * @since 1.122.0
	 * @var REST_Consent_Mode_Controller
	 */
	protected $rest_controller;

	/**
	 * Constructor.
	 *
	 * @since 1.122.0
	 * @since 1.142.0 Introduced Modules instance as an argument.
	 *
	 * @param Context $context Plugin context.
	 * @param Modules $modules Modules instance.
	 * @param Options $options Optional. Option API instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Modules $modules,
		Options $options = null
	) {
		$this->context               = $context;
		$options                     = $options ?: new Options( $context );
		$this->consent_mode_settings = new Consent_Mode_Settings( $options );
		$this->rest_controller       = new REST_Consent_Mode_Controller(
			$modules,
			$this->consent_mode_settings,
			$options
		);
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.122.0
	 */
	public function register() {
		$this->consent_mode_settings->register();
		$this->rest_controller->register();

		// Declare that the plugin is compatible with the WP Consent API.
		$plugin = GOOGLESITEKIT_PLUGIN_BASENAME;
		add_filter( "wp_consent_api_registered_{$plugin}", '__return_true' );

		$consent_mode_enabled = $this->consent_mode_settings->is_consent_mode_enabled();

		if ( $consent_mode_enabled ) {
			// The `wp_head` action is used to ensure the snippets are printed in the head on the front-end only, not admin pages.
			add_action(
				'wp_head',
				$this->get_method_proxy( 'render_gtag_consent_data_layer_snippet' ),
				1 // Set priority to 1 to ensure the snippet is printed with top priority in the head.
			);

			add_action( 'wp_enqueue_scripts', fn () => $this->register_and_enqueue_script() );
		}

		add_filter(
			'googlesitekit_consent_mode_status',
			function () use ( $consent_mode_enabled ) {
				return $consent_mode_enabled ? 'enabled' : 'disabled';
			}
		);

		add_filter( 'googlesitekit_inline_base_data', $this->get_method_proxy( 'inline_js_base_data' ) );

		add_action( 'wp_ajax_install_activate_wp_consent_api', array( $this, 'install_activate_wp_consent_api' ) );
	}

	/**
	 * AJAX callback that installs and activates the WP Consent API plugin.
	 *
	 * This function utilizes an AJAX approach instead of the standardized REST approach
	 * due to the requirement of the Plugin_Upgrader class, which relies on functions
	 * from `admin.php` among others. These functions are properly loaded during the
	 * AJAX callback, ensuring the installation and activation processes can execute correctly.
	 *
	 * @since 1.132.0
	 */
	public function install_activate_wp_consent_api() {
		check_ajax_referer( 'updates' );

		$slug   = 'wp-consent-api';
		$plugin = "$slug/$slug.php";

		if ( ! current_user_can( 'activate_plugin', $plugin ) ) {
			wp_send_json( array( 'error' => __( 'You do not have permission to activate plugins on this site.', 'google-site-kit' ) ) );
		}

		/** WordPress Administration Bootstrap */
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php'; // For Plugin_Upgrader and Plugin_Installer_Skin.
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php'; // For plugins_api.

		$api = plugins_api(
			'plugin_information',
			array(
				'slug'   => $slug,
				'fields' => array(
					'sections' => false,
				),
			)
		);

		if ( is_wp_error( $api ) ) {
			wp_send_json( array( 'error' => $api->get_error_message() ) );
		}

		$title = '';
		$nonce = 'install-plugin_' . $plugin;
		$url   = 'update.php?action=install-plugin&plugin=' . rawurlencode( $plugin );

		$upgrader       = new Plugin_Upgrader( new Plugin_Installer_Skin( compact( 'title', 'url', 'nonce', 'plugin', 'api' ) ) );
		$install_plugin = $upgrader->install( $api->download_link );

		if ( is_wp_error( $install_plugin ) ) {
			wp_send_json( array( 'error' => $install_plugin->get_error_message() ) );
		}

		$activated = activate_plugin( $plugin );

		if ( is_wp_error( $activated ) ) {
			wp_send_json( array( 'error' => $activated->get_error_message() ) );
		}

		wp_send_json( array( 'success' => true ) );
	}

	/**
	 * Registers and Enqueues the consent mode script.
	 *
	 * @since 1.132.0
	 */
	protected function register_and_enqueue_script() {
		$consent_mode_script = new Script(
			'googlesitekit-consent-mode',
			array(
				'src' => $this->context->url( 'dist/assets/js/googlesitekit-consent-mode.js' ),
			)
		);
		$consent_mode_script->register( $this->context );
		$consent_mode_script->enqueue();
	}

	/**
	 * Prints the gtag consent snippet.
	 *
	 * @since 1.122.0
	 * @since 1.132.0 Refactored core script to external js file transpiled with webpack.
	 */
	protected function render_gtag_consent_data_layer_snippet() {
		/**
		 * Filters the consent mode defaults.
		 *
		 * Allows these defaults to be modified, thus allowing users complete control over the consent mode parameters.
		 *
		 * @since 1.126.0
		 *
		 * @param array $consent_mode_defaults Default values for consent mode.
		 */
		$consent_defaults = apply_filters(
			'googlesitekit_consent_defaults',
			array(
				'ad_personalization'      => 'denied',
				'ad_storage'              => 'denied',
				'ad_user_data'            => 'denied',
				'analytics_storage'       => 'denied',
				'functionality_storage'   => 'denied',
				'security_storage'        => 'denied',
				'personalization_storage' => 'denied',
				// TODO: The value for `region` should be retrieved from $this->consent_mode_settings->get_regions(),
				// but we'll need to migrate/clean up the incorrect values that were set from the initial release.
				// See https://github.com/google/site-kit-wp/issues/8444.
				'region'                  => Regions::get_regions(),
				'wait_for_update'         => 500, // Allow 500ms for Consent Management Platforms (CMPs) to update the consent status.
			)
		);

		/**
		 * Filters the consent category mapping.
		 *
		 * @since 1.124.0
		 *
		 * @param array $consent_category_map Default consent category mapping.
		 */
		$consent_category_map = apply_filters(
			'googlesitekit_consent_category_map',
			array(
				'statistics'  => array( 'analytics_storage' ),
				'marketing'   => array( 'ad_storage', 'ad_user_data', 'ad_personalization' ),
				'functional'  => array( 'functionality_storage', 'security_storage' ),
				'preferences' => array( 'personalization_storage' ),
			)
		);

		// The core Consent Mode code is in assets/js/consent-mode/consent-mode.js.
		// Only code that passes data from PHP to JS should be in this file.
		printf( "<!-- %s -->\n", esc_html__( 'Google tag (gtag.js) Consent Mode dataLayer added by Site Kit', 'google-site-kit' ) );
		BC_Functions::wp_print_inline_script_tag(
			join(
				"\n",
				array(
					'window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}',
					sprintf( "gtag('consent', 'default', %s);", wp_json_encode( $consent_defaults ) ),
					sprintf( 'window._googlesitekitConsentCategoryMap = %s;', wp_json_encode( $consent_category_map ) ),
					sprintf( 'window._googlesitekitConsents = %s;', wp_json_encode( $consent_defaults ) ),
				)
			),
			array( 'id' => 'google_gtagjs-js-consent-mode-data-layer' )
		);
		printf( "<!-- %s -->\n", esc_html__( 'End Google tag (gtag.js) Consent Mode dataLayer added by Site Kit', 'google-site-kit' ) );
	}

	/**
	 * Extends base data with a static list of consent mode regions.
	 *
	 * @since 1.128.0
	 *
	 * @param array $data Inline base data.
	 * @return array Filtered $data.
	 */
	protected function inline_js_base_data( $data ) {
		$data['consentModeRegions'] = Regions::get_regions();

		return $data;
	}
}
