<?php
/**
 * Class Google\Site_Kit\Modules\Ads
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Asset;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Assets\Script_Data;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Debug_Fields;
use Google\Site_Kit\Core\Modules\Module_With_Deactivation;
use Google\Site_Kit\Core\Modules\Module_With_Persistent_Registration;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Tag;
use Google\Site_Kit\Core\Modules\Module_With_Tag_Trait;
use Google\Site_Kit\Core\Modules\Tags\Module_Tag_Matchers;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Site_Health\Debug_Data;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway;
use Google\Site_Kit\Core\Util\Plugin_Status;
use Google\Site_Kit\Modules\Ads\PAX_Config;
use Google\Site_Kit\Modules\Ads\Settings;
use Google\Site_Kit\Modules\Ads\Has_Tag_Guard;
use Google\Site_Kit\Modules\Ads\Tag_Matchers;
use Google\Site_Kit\Modules\Ads\Web_Tag;
use Google\Site_Kit\Core\Tags\Guards\Tag_Environment_Type_Guard;
use Google\Site_Kit\Core\Tags\Guards\Tag_Verify_Guard;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Core\Util\URL;
use Google\Site_Kit\Modules\Ads\AMP_Tag;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking;
use Google\Site_Kit\Core\Tags\GTag;

/**
 * Class representing the Ads module.
 *
 * @since 1.121.0
 * @access private
 * @ignore
 */
final class Ads extends Module implements Module_With_Assets, Module_With_Debug_Fields, Module_With_Scopes, Module_With_Settings, Module_With_Tag, Module_With_Deactivation, Module_With_Persistent_Registration {
	use Module_With_Assets_Trait;
	use Module_With_Scopes_Trait;
	use Module_With_Settings_Trait;
	use Module_With_Tag_Trait;
	use Method_Proxy_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'ads';

	const SCOPE                 = 'https://www.googleapis.com/auth/adwords';
	const SUPPORT_CONTENT_SCOPE = 'https://www.googleapis.com/auth/supportcontent';

	/**
	 * Conversion_Tracking instance.
	 *
	 * @since 1.147.0
	 * @var Conversion_Tracking
	 */
	protected $conversion_tracking;

	/**
	 * Class constructor.
	 *
	 * @since 1.147.0
	 *
	 * @param Context             $context        Context object.
	 * @param Options|null        $options        Options object.
	 * @param User_Options|null   $user_options   User options object.
	 * @param Authentication|null $authentication Authentication object.
	 * @param Assets|null         $assets         Assets object.
	 */
	public function __construct( Context $context, Options $options = null, User_Options $user_options = null, Authentication $authentication = null, Assets $assets = null ) {
		parent::__construct( $context, $options, $user_options, $authentication, $assets );

		$this->conversion_tracking = new Conversion_Tracking( $context );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.121.0
	 */
	public function register() {
		$this->register_scopes_hook();
		// Ads tag placement logic.
		add_action( 'template_redirect', array( $this, 'register_tag' ) );
		add_filter( 'googlesitekit_inline_modules_data', $this->get_method_proxy( 'inline_modules_data' ) );
		add_filter(
			'googlesitekit_ads_measurement_connection_checks',
			function ( $checks ) {
				$checks[] = array( $this, 'check_ads_measurement_connection' );
				return $checks;
			},
			10
		);

		add_action( 'wp_enqueue_scripts', fn () => $this->maybe_enqueue_scripts(), 30 );
	}

	/**
	 * Enqueues the gtag user data script for the Ads module.
	 *
	 * @since n/a
	 */
	public function maybe_enqueue_scripts() {
		if ( ! Feature_Flags::enabled( 'ecEuID' ) ) {
			return;
		}

		// Do nothing if the Ads *web* snippet hasn't been inserted.
		if ( ! did_action( 'googlesitekit_ads_init_tag' ) ) {
			return;
		}

		// $accepted_customer_data_terms = $this->get_settings()->get()['acceptedCustomerDataTerms'];
		$accepted_customer_data_terms = true;

		if ( ! $accepted_customer_data_terms ) {
			return;
		}

		if ( is_user_logged_in() ) {
			$current_user = wp_get_current_user();

			$user_details = array(
				'user_id'  => $current_user->ID,
				'username' => $current_user->user_login,
				'email'    => $current_user->user_email,
			);

			$gtag_user_data = '
					gtag( "user_data", { event_source: "site-kit", user_details: ' . wp_json_encode( $user_details ) . ' } );
			';

			wp_add_inline_script( GTag::HANDLE, preg_replace( '/\s+/', ' ', $gtag_user_data ) );
		} else {
			// This is a PoC, but we should consider enqueing a script that provides a `sendUserData` function,
			// somewhat similarly to how we manage Consent Mode:
			// - assets/js/consent-mode/consent-mode.js
			// - https://github.com/google/site-kit-wp/blob/e1aaea63b443154d769c445529857799c83cb62f/includes/Core/Consent_Mode/Consent_Mode.php#L182-L191
			$gtag_user_data_callback = '
				window._googlesitekit = window._googlesitekit || {};
				window._googlesitekit.sendUserData = (userDetails) => {
					gtag( "user_data", { event_source: "site-kit", user_details: userDetails } );
				};
				';
			wp_add_inline_script( GTag::HANDLE, preg_replace( '/\s+/', ' ', $gtag_user_data_callback ) );
		}
	}

	/**
	 * Registers functionality independent of module activation.
	 *
	 * @since 1.148.0
	 */
	public function register_persistent() {
		add_filter( 'googlesitekit_inline_modules_data', fn ( $data ) => $this->persistent_inline_modules_data( $data ) );
	}

	/**
	 * Checks if the Ads module is connected and contributing to Ads measurement.
	 *
	 * @since 1.151.0
	 *
	 * @return bool True if the Ads module is connected, false otherwise.
	 */
	public function check_ads_measurement_connection() {
		return $this->is_connected();
	}

	/**
	 * Sets up the module's assets to register.
	 *
	 * @since 1.122.0
	 * @since 1.126.0 Added PAX assets.
	 *
	 * @return Asset[] List of Asset objects.
	 */
	protected function setup_assets() {
		$base_url = $this->context->url( 'dist/assets/' );

		$assets = array(
			new Script(
				'googlesitekit-modules-ads',
				array(
					'src'          => $base_url . 'js/googlesitekit-modules-ads.js',
					'dependencies' => array(
						'googlesitekit-vendor',
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-modules',
						'googlesitekit-notifications',
						'googlesitekit-datastore-site',
						'googlesitekit-datastore-user',
						'googlesitekit-components',
					),
				)
			),
		);

		if ( Feature_Flags::enabled( 'adsPax' ) ) {
			$input                      = $this->context->input();
			$is_googlesitekit_dashboard = 'googlesitekit-dashboard' === $input->filter( INPUT_GET, 'page' );
			$is_ads_slug                = 'ads' === $input->filter( INPUT_GET, 'slug' );
			$is_re_auth                 = $input->filter( INPUT_GET, 'reAuth' );

			$assets[] = new Script_Data(
				'googlesitekit-ads-pax-config',
				array(
					'global'        => '_googlesitekitPAXConfig',
					'data_callback' => function () {
						if ( ! current_user_can( Permissions::VIEW_AUTHENTICATED_DASHBOARD ) ) {
							return array();
						}

						$config = new PAX_Config( $this->context, $this->authentication->token() );

						return $config->get();
					},
				)
			);
			// Integrator should be included if either Ads module is connected already,
			// or we are on the Ads module setup screen.
			if (
				current_user_can( Permissions::VIEW_AUTHENTICATED_DASHBOARD ) &&
				(
					// Integrator should be included if either:
					// The Ads module is already connected.
					$this->is_connected() ||
					// Or the user is on the Ads module setup screen.
					( ( ( is_admin() && $is_googlesitekit_dashboard ) && $is_ads_slug ) && $is_re_auth )
				)
			) {
				$assets[] = new Script(
					'googlesitekit-ads-pax-integrator',
					array(
						// When updating, mirror the fixed version for google-pax-sdk in package.json.
						'src'          => 'https://www.gstatic.com/pax/1.1.6/pax_integrator.js',
						'execution'    => 'async',
						'dependencies' => array(
							'googlesitekit-ads-pax-config',
							'googlesitekit-modules-data',
						),
						'version'      => null,
					)
				);
			}
		}

		return $assets;
	}

	/**
	 * Populates module data needed independent of Ads module activation.
	 *
	 * @since 1.148.0
	 *
	 * @param array $modules_data Inline modules data.
	 * @return array Inline modules data.
	 */
	protected function persistent_inline_modules_data( $modules_data ) {
		if ( ! Feature_Flags::enabled( 'adsPax' ) ) {
			return $modules_data;
		}

		if ( empty( $modules_data['ads'] ) ) {
			$modules_data['ads'] = array();
		}

		$active_wc  = class_exists( 'WooCommerce' );
		$active_gla = defined( 'WC_GLA_VERSION' );

		$gla_ads_conversion_action = get_option( 'gla_ads_conversion_action' );

		$modules_data['ads']['plugins'] = array(
			'woocommerce'             => array(
				'active'    => $active_wc,
				'installed' => $active_wc || Plugin_Status::is_plugin_installed( 'woocommerce/woocommerce.php' ),
			),
			'google-listings-and-ads' => array(
				'active'       => $active_gla,
				'installed'    => $active_gla || Plugin_Status::is_plugin_installed( 'google-listings-and-ads/google-listings-and-ads.php' ),
				'adsConnected' => $active_gla && get_option( 'gla_ads_id' ),
				'conversionID' => is_array( $gla_ads_conversion_action ) ? $gla_ads_conversion_action['conversion_id'] : '',
			),
		);

		return $modules_data;
	}

	/**
	 * Populates module data to pass to JS via _googlesitekitModulesData.
	 *
	 * @since 1.126.0
	 *
	 * @param array $modules_data Inline modules data.
	 * @return array Inline modules data.
	 */
	private function inline_modules_data( $modules_data ) {
		if ( ! Feature_Flags::enabled( 'adsPax' ) ) {
			return $modules_data;
		}

		if ( empty( $modules_data['ads'] ) ) {
			$modules_data['ads'] = array();
		}

		$modules_data['ads']['supportedConversionEvents'] = $this->get_supported_conversion_events();

		return $modules_data;
	}

	/**
	 * Gets required Google OAuth scopes for the module.
	 *
	 * @since 1.126.0
	 *
	 * @return array List of Google OAuth scopes.
	 */
	public function get_scopes() {
		if ( Feature_Flags::enabled( 'adsPax' ) ) {
			$granted_scopes = $this->authentication->get_oauth_client()->get_granted_scopes();
			$options        = $this->get_settings()->get();

			if ( in_array( self::SCOPE, $granted_scopes, true ) || ! empty( $options['extCustomerID'] ) ) {
				return array( self::SCOPE, self::SUPPORT_CONTENT_SCOPE );
			}
		}

		return array();
	}

	/**
	 * Sets up information about the module.
	 *
	 * @since 1.121.0
	 *
	 * @return array Associative array of module info.
	 */
	protected function setup_info() {
		return array(
			'slug'        => 'ads',
			'name'        => _x( 'Ads', 'Service name', 'google-site-kit' ),
			'description' => Feature_Flags::enabled( 'adsPax' ) ? __( 'Grow sales, leads or awareness for your business by advertising with Google Ads', 'google-site-kit' ) : __( 'Track conversions for your existing Google Ads campaigns', 'google-site-kit' ),
			'homepage'    => __( 'https://google.com/ads', 'google-site-kit' ),
		);
	}

	/**
	 * Sets up the module's settings instance.
	 *
	 * @since 1.122.0
	 *
	 * @return Module_Settings
	 */
	protected function setup_settings() {
		return new Settings( $this->options );
	}

	/**
	 * Checks whether the module is connected.
	 *
	 * A module being connected means that all steps required as part of its activation are completed.
	 *
	 * @since 1.122.0
	 * @since 1.127.0 Add additional check to account for paxConversionID and extCustomerID as well when feature flag is enabled.
	 *
	 * @return bool True if module is connected, false otherwise.
	 */
	public function is_connected() {
		$options = $this->get_settings()->get();

		if ( Feature_Flags::enabled( 'adsPax' ) ) {
			if ( empty( $options['conversionID'] ) && empty( $options['paxConversionID'] ) && empty( $options['extCustomerID'] ) ) {
				return false;
			}

			return parent::is_connected();
		}

		if ( empty( $options['conversionID'] ) ) {
			return false;
		}

		return parent::is_connected();
	}

	/**
	 * Cleans up when the module is deactivated.
	 *
	 * @since 1.122.0
	 */
	public function on_deactivation() {
		$this->get_settings()->delete();
	}

	/**
	 * Registers the Ads tag.
	 *
	 * @since 1.124.0
	 */
	public function register_tag() {
		$ads_conversion_id = $this->get_settings()->get()['conversionID'];
		$pax_conversion_id = $this->get_settings()->get()['paxConversionID'];

		// The PAX-supplied Conversion ID should take precedence over the
		// user-supplied one, if both exist.
		if ( Feature_Flags::enabled( 'adsPax' ) && ! empty( $pax_conversion_id ) ) {
			$ads_conversion_id = $pax_conversion_id;
		}

		$tag = $this->context->is_amp()
			? new AMP_Tag( $ads_conversion_id, self::MODULE_SLUG )
			: new Web_Tag( $ads_conversion_id, self::MODULE_SLUG );

		if ( $tag->is_tag_blocked() ) {
			return;
		}

		$tag->use_guard( new Tag_Verify_Guard( $this->context->input() ) );
		$tag->use_guard( new Has_Tag_Guard( $ads_conversion_id ) );
		$tag->use_guard( new Tag_Environment_Type_Guard() );

		if ( ! $tag->can_register() ) {
			return;
		}

		$home_domain = URL::parse( $this->context->get_canonical_home_url(), PHP_URL_HOST );
		$tag->set_home_domain( $home_domain );

		$tag->register();
	}

	/**
	 * Gets an array of debug field definitions.
	 *
	 * @since 1.124.0
	 *
	 * @return array An array of all debug fields.
	 */
	public function get_debug_fields() {
		$settings = $this->get_settings()->get();

		$debug_fields = array(
			'ads_conversion_tracking_id' => array(
				'label' => __( 'Ads: Conversion ID', 'google-site-kit' ),
				'value' => $settings['conversionID'],
				'debug' => Debug_Data::redact_debug_value( $settings['conversionID'] ),
			),
		);

		// Add fields from Google tag gateway.
		// Note: fields are added in both Analytics and Ads so that the debug fields will show if either module is enabled.
		if ( Feature_Flags::enabled( 'googleTagGateway' ) ) {
			$google_tag_gateway             = new Google_Tag_Gateway( $this->context );
			$fields_from_google_tag_gateway = $google_tag_gateway->get_debug_fields();

			$debug_fields = array_merge( $debug_fields, $fields_from_google_tag_gateway );
		}

		return $debug_fields;
	}

	/**
	 * Returns the Module_Tag_Matchers instance.
	 *
	 * @since 1.124.0
	 *
	 * @return Module_Tag_Matchers Module_Tag_Matchers instance.
	 */
	public function get_tag_matchers() {
		return new Tag_Matchers();
	}

	/**
	 * Returns events supported by active providers from the conversion tracking infrastructure.
	 *
	 * @since 1.147.0
	 *
	 * @return array Array of supported conversion events, or empty array.
	 */
	public function get_supported_conversion_events() {
		$providers = $this->conversion_tracking->get_active_providers();

		if ( empty( $providers ) ) {
			return array();
		}

		$events = array();

		foreach ( $providers as $provider ) {
			$events = array_merge( $events, array_values( $provider->get_event_names() ) );
		}

		return array_unique( $events );
	}
}
