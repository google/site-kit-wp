<?php
/**
 * Class Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Provider_Registry
 *
 * @package   Google\Site_Kit\Core\Modules
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Conversion_Tracking;

use InvalidArgumentException;

/**
 * Class for managing conversion event provider registration.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Conversion_Event_Provider_Registry {
	/**
	 * Registered conversion event providers.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	private $registry = array();

	/**
	 * Registers a conversion event provider class on the registry.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $conversion_event_provider_classname Fully-qualified conversion event provider class name to register.
	 * @throws InvalidArgumentException Thrown if an invalid conversion event provider class name is provided.
	 */
	public function register( $conversion_event_provider_classname ) {
		if ( ! is_string( $conversion_event_provider_classname ) || ! $conversion_event_provider_classname ) {
			throw new InvalidArgumentException( 'A conversion event provider class name is required to instantiate a conversion event provider.' );
		}

		if ( ! class_exists( $conversion_event_provider_classname ) ) {
			throw new InvalidArgumentException( "No class exists for '$conversion_event_provider_classname'" );
		}

		if ( ! is_subclass_of( $conversion_event_provider_classname, Conversion_Events_Provider::class ) ) {
			throw new InvalidArgumentException(
				sprintf( 'All conversion event provider classes must extend the base conversion event provider class: %s', Conversion_Events_Provider::class )
			);
		}

		$this->registry[ $conversion_event_provider_classname ] = $conversion_event_provider_classname;
	}

	/**
	 * Gets all registered conversion event provider class names.
	 *
	 * @since n.e.x.t
	 *
	 * @return string[] Registered conversion event provider class names.
	 */
	public function get_all() {
		return array_keys( $this->registry );
	}
}
