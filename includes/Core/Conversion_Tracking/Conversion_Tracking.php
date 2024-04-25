<?php
/**
 * Class Google\Site_Kit\Core\Modules\Conversion_Tracking
 *
 * @package   Google\Site_Kit\Core\Modules
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Conversion_Tracking;

use Google\Site_Kit\Context;

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
	 * Conversion_Event_Provider_Registry instance.
	 *
	 * @since n.e.x.t
	 * @var Conversion_Event_Provider_Registry
	 */
	private $registry;

	/**
	 * Supported conversion event providers.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	public static $conversion_event_providers = array();

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
		$active_conversion_event_providers = $this->get_active_conversion_event_providers();

		array_walk(
			$active_conversion_event_providers,
			function( Conversion_Events_Provider $active_conversion_event_provider ) {
				$script_asset = $active_conversion_event_provider->register_script();
				$script_asset->enqueue();
			}
		);
	}

	/**
	 * Gets the instances of active conversion event providers.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of active Conversion_Events_Provider instances.
	 */
	public function get_active_conversion_event_providers() {
		$active_conversion_event_providers = array();
		$conversion_event_provider_classes = $this->get_registry()->get_all();

		foreach ( $conversion_event_provider_classes as $conversion_event_provider_class ) {
			$instance = new $conversion_event_provider_class( $this->context );

			if ( $instance->is_active() ) {
				$active_conversion_event_providers[ $instance::CONVERSION_EVENT_PROVIDER_SLUG ] = $instance;
			}
		}

		return $active_conversion_event_providers;
	}

	/**
	 * Gets the configured conversion event provider registry instance.
	 *
	 * @since n.e.x.t
	 *
	 * @return Conversion_Event_Provider_Registry
	 */
	protected function get_registry() {
		if ( ! $this->registry instanceof Conversion_Event_Provider_Registry ) {
			$this->registry = $this->setup_registry();
		}

		return $this->registry;
	}

	/**
	 * Sets up a fresh conversion event provider registry instance.
	 *
	 * @since n.e.x.t
	 *
	 * @return Conversion_Event_Provider_Registry
	 */
	protected function setup_registry() {
		$registry = new Conversion_Event_Provider_Registry();

		array_walk(
			self::$conversion_event_providers,
			function( $conversion_event_provider ) use ( $registry ) {
				$registry->register( $conversion_event_provider );
			}
		);

		return $registry;
	}
}
