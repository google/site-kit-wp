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
use LogicException;

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
	public static $providers = array();

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
				$active_providers = $this->get_active_providers();

				array_walk(
					$active_providers,
					function( Conversion_Events_Provider $active_provider ) {
						$script_asset = $active_provider->register_script();
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
	 * @throws LogicException Thrown if an invalid conversion event provider class name is provided.
	 */
	public function get_active_providers() {
		$active_providers = array();

		foreach ( self::$providers as $provider_slug => $provider_class ) {
			if ( ! is_string( $provider_class ) || ! $provider_class ) {
				throw new LogicException( __( 'A conversion event provider class name is required to instantiate a conversion event provider.', 'google-site-kit' ) );
			}

			if ( ! class_exists( $provider_class ) ) {
				throw new LogicException( sprintf( "%s '%s'", __( 'No class exists for', 'google-site-kit' ), $provider_class ) );
			}

			if ( ! is_subclass_of( $provider_class, Conversion_Events_Provider::class ) ) {
				throw new LogicException(
					sprintf( '%s: %s', __( 'All conversion event provider classes must extend the base conversion event provider class', 'google-site-kit' ), Conversion_Events_Provider::class )
				);
			}

			$instance = new $provider_class( $this->context );

			if ( $instance->is_active() ) {
				$active_providers[ $provider_slug ] = $instance;
			}
		}

		return $active_providers;
	}
}
