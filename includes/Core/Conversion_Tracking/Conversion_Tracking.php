<?php
/**
 * Class Google\Site_Kit\Core\Conversion_Tracking
 *
 * @package   Google\Site_Kit\Core\Modules
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Conversion_Tracking;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Contact_Form_7;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Easy_Digital_Downloads;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Mailchimp;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Ninja_Forms;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\OptinMonster;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\PopupMaker;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\WooCommerce;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\WPForms;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Tags\GTag;
use Google\Site_Kit\Core\Tracking\Feature_Metrics_Trait;
use Google\Site_Kit\Core\Tracking\Provides_Feature_Metrics;
use Google\Site_Kit\Core\Util\Feature_Flags;
use LogicException;

/**
 * Class for managing conversion tracking.
 *
 * @since 1.126.0
 * @access private
 * @ignore
 */
class Conversion_Tracking implements Provides_Feature_Metrics {

	use Feature_Metrics_Trait;

	/**
	 * Context object.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Conversion_Tracking_Settings instance.
	 *
	 * @since 1.127.0
	 * @var Conversion_Tracking_Settings
	 */
	protected $conversion_tracking_settings;

	/**
	 * REST_Conversion_Tracking_Controller instance.
	 *
	 * @since 1.127.0
	 * @var REST_Conversion_Tracking_Controller
	 */
	protected $rest_conversion_tracking_controller;

	/**
	 * Supported conversion event providers.
	 *
	 * @since 1.126.0
	 * @since 1.130.0 Added Ninja Forms class.
	 * @var array
	 */
	public static $providers = array(
		Contact_Form_7::CONVERSION_EVENT_PROVIDER_SLUG => Contact_Form_7::class,
		Easy_Digital_Downloads::CONVERSION_EVENT_PROVIDER_SLUG => Easy_Digital_Downloads::class,
		Mailchimp::CONVERSION_EVENT_PROVIDER_SLUG      => Mailchimp::class,
		Ninja_Forms::CONVERSION_EVENT_PROVIDER_SLUG    => Ninja_Forms::class,
		OptinMonster::CONVERSION_EVENT_PROVIDER_SLUG   => OptinMonster::class,
		PopupMaker::CONVERSION_EVENT_PROVIDER_SLUG     => PopupMaker::class,
		WooCommerce::CONVERSION_EVENT_PROVIDER_SLUG    => WooCommerce::class,
		WPForms::CONVERSION_EVENT_PROVIDER_SLUG        => WPForms::class,
	);

	/**
	 * Constructor.
	 *
	 * @since 1.126.0
	 *
	 * @param Context $context Plugin context.
	 * @param Options $options Optional. Option API instance. Default is a new instance.
	 */
	public function __construct( Context $context, ?Options $options = null ) {
		$this->context                             = $context;
		$options                                   = $options ?: new Options( $context );
		$this->conversion_tracking_settings        = new Conversion_Tracking_Settings( $options );
		$this->rest_conversion_tracking_controller = new REST_Conversion_Tracking_Controller( $this->conversion_tracking_settings );
	}

	/**
	 * Registers the class functionality.
	 *
	 * @since 1.126.0
	 */
	public function register() {
		$this->conversion_tracking_settings->register();
		$this->rest_conversion_tracking_controller->register();
		$this->register_feature_metrics();

		add_action( 'wp_enqueue_scripts', fn () => $this->maybe_enqueue_scripts(), 30 );

		$active_providers = $this->get_active_providers();

		array_walk(
			$active_providers,
			function ( Conversion_Events_Provider $active_provider ) {
				$active_provider->register_hooks();
			}
		);
	}

	/**
	 * Enqueues conversion tracking scripts if conditions are satisfied.
	 */
	protected function maybe_enqueue_scripts() {
		if (
			// Do nothing if neither Ads nor Analytics *web* snippet has been inserted.
			! ( did_action( 'googlesitekit_ads_init_tag' ) || did_action( 'googlesitekit_analytics-4_init_tag' ) )
			|| ! $this->conversion_tracking_settings->is_conversion_tracking_enabled()
		) {
			return;
		}

		$active_providers = $this->get_active_providers();

		array_walk(
			$active_providers,
			function ( Conversion_Events_Provider $active_provider ) {
				$script_asset = $active_provider->register_script();
				if ( $script_asset instanceof Script ) {
					$script_asset->enqueue();
				}
			}
		);

		$gtag_event = '
			window._googlesitekit = window._googlesitekit || {};
			window._googlesitekit.throttledEvents = [];
			window._googlesitekit.gtagEvent = (name, data) => {
				var key = JSON.stringify( { name, data } );

				if ( !! window._googlesitekit.throttledEvents[ key ] ) {
					return;
				}
				window._googlesitekit.throttledEvents[ key ] = true;
				setTimeout( () => {
					delete window._googlesitekit.throttledEvents[ key ];
				}, 5 );

				gtag( "event", name, { ...data, event_source: "site-kit" } );
			};
		';

		if ( function_exists( 'edd_get_currency' ) ) {
			$gtag_event .= "window._googlesitekit.easyDigitalDownloadsCurrency = '" . edd_get_currency() . "';";
		}

		if ( Feature_Flags::enabled( 'gtagUserData' ) ) {
			$gtag_event .= 'window._googlesitekit.gtagUserData = true;';
		}

		wp_add_inline_script( GTag::HANDLE, preg_replace( '/\s+/', ' ', $gtag_event ) );
	}

	/**
	 * Gets the instances of active conversion event providers.
	 *
	 * @since 1.126.0
	 *
	 * @return array List of active Conversion_Events_Provider instances.
	 * @throws LogicException Thrown if an invalid conversion event provider class name is provided.
	 */
	public function get_active_providers() {
		$active_providers = array();

		foreach ( self::$providers as $provider_slug => $provider_class ) {
			if ( ! is_string( $provider_class ) || ! $provider_class ) {
				throw new LogicException(
					sprintf(
						/* translators: %s: provider slug */
						__( 'A conversion event provider class name is required to instantiate a provider: %s', 'google-site-kit' ),
						$provider_slug
					)
				);
			}

			if ( ! class_exists( $provider_class ) ) {
				throw new LogicException(
					sprintf(
						/* translators: %s: provider classname */
						__( "The '%s' class does not exist", 'google-site-kit' ),
						$provider_class
					)
				);
			}

			if ( ! is_subclass_of( $provider_class, Conversion_Events_Provider::class ) ) {
				throw new LogicException(
					sprintf(
						/* translators: 1: provider classname 2: Conversion_Events_Provider classname */
						__( "The '%1\$s' class must extend the base conversion event provider class: %2\$s", 'google-site-kit' ),
						$provider_class,
						Conversion_Events_Provider::class
					)
				);
			}

			$instance = new $provider_class( $this->context );

			if ( $instance->is_active() ) {
				$active_providers[ $provider_slug ] = $instance;
			}
		}

		return $active_providers;
	}

	/**
	 * Returns events supported by active providers from the conversion tracking infrastructure.
	 *
	 * @since 1.163.0 Moved this method here from the Ads class.
	 *
	 * @return array Array of supported conversion events, or empty array.
	 */
	public function get_supported_conversion_events() {
		$providers = $this->get_active_providers();

		if ( empty( $providers ) ) {
			return array();
		}

		$events = array();

		foreach ( $providers as $provider ) {
			$events = array_merge( $events, array_values( $provider->get_event_names() ) );
		}

		return array_unique( $events );
	}

	/**
	 * Gets an array of internal feature metrics.
	 *
	 * @since 1.163.0
	 *
	 * @return array
	 */
	public function get_feature_metrics() {
		return array(
			'conversion_tracking_enabled'   => $this->conversion_tracking_settings->is_conversion_tracking_enabled(),
			'conversion_tracking_providers' => array_keys( $this->get_active_providers() ),
			'conversion_tracking_events'    => $this->get_supported_conversion_events(),
		);
	}
}
