<?php
/**
 * Class Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Easy_Digital_Downloads
 *
 * @package   Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers;

use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Events_Provider;

/**
 * Class for handling Easy Digital Downloads conversion events.
 *
 * @since 1.130.0
 * @access private
 * @ignore
 */
class Easy_Digital_Downloads extends Conversion_Events_Provider {

	const CONVERSION_EVENT_PROVIDER_SLUG = 'easy-digital-downloads';

	/**
	 * Checks if the Easy Digital Downloads plugin is active.
	 *
	 * @since 1.130.0
	 *
	 * @return bool True if Easy Digital Downloads is active, false otherwise.
	 */
	public function is_active() {
		return defined( 'EDD_VERSION' );
	}

	/**
	 * Gets the conversion event names that are tracked by this provider.
	 *
	 * @since 1.130.0
	 *
	 * @return array List of event names.
	 */
	public function get_event_names() {
		return array( 'add_to_cart' );
	}

	/**
	 * Registers the script for the provider.
	 *
	 * @since 1.130.0
	 *
	 * @return Script Script instance.
	 */
	public function register_script() {
		$script = new Script(
			'gsk-cep-' . self::CONVERSION_EVENT_PROVIDER_SLUG,
			array(
				'src'          => $this->context->url( 'dist/assets/js/easy-digital-downloads.js' ),
				'execution'    => 'defer',
				'dependencies' => array( 'edd-ajax' ),
			)
		);

		$script->register( $this->context );

		return $script;
	}

}
