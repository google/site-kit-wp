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
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\WooCommerce;
use InvalidArgumentException;

/**
 * Class for managing conversion tracking.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Conversion_Tracking {

	/**
	 * Context object.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Supported conversion event providers.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	public static $conversion_event_providers = array(
		WooCommerce::CONVERSION_EVENT_PROVIDER_SLUG => WooCommerce::class,
	);

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Registers the class functionality.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_action(
			'wp_enqueue_scripts',
			function() {
				$active_conversion_event_providers = $this->get_active_conversion_event_providers();

				array_walk(
					$active_conversion_event_providers,
					function( Conversion_Events_Provider $active_conversion_event_provider ) {
						$script_asset = $active_conversion_event_provider->register_script();
						$script_asset->enqueue();
					}
				);
			}
		);
	}

	/**
	 * Gets the instances of active conversion event providers.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of active Conversion_Events_Provider instances.
	 * @throws InvalidArgumentException Thrown if an invalid conversion event provider class name is provided.
	 */
	public function get_active_conversion_event_providers() {
		$active_conversion_event_providers = array();

		foreach ( self::$conversion_event_providers as $conversion_event_provider_slug => $conversion_event_provider_class ) {
			if ( ! is_string( $conversion_event_provider_class ) || ! $conversion_event_provider_class ) {
				throw new InvalidArgumentException( 'A conversion event provider class name is required to instantiate a conversion event provider.' );
			}

			if ( ! class_exists( $conversion_event_provider_class ) ) {
				throw new InvalidArgumentException( "No class exists for '$conversion_event_provider_class'" );
			}

			if ( ! is_subclass_of( $conversion_event_provider_class, Conversion_Events_Provider::class ) ) {
				throw new InvalidArgumentException(
					sprintf( 'All conversion event provider classes must extend the base conversion event provider class: %s', Conversion_Events_Provider::class )
				);
			}

			$instance = new $conversion_event_provider_class( $this->context );

			if ( $instance->is_active() ) {
				$active_conversion_event_providers[ $conversion_event_provider_slug ] = $instance;
			}
		}

		return $active_conversion_event_providers;
	}
}
