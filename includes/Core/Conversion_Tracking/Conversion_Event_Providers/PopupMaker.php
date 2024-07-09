<?php
/**
 * Class Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\PopupMaker
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
 * Class for handling PopupMaker conversion events.
 *
 * @since 1.127.0
 * @access private
 * @ignore
 */
class PopupMaker extends Conversion_Events_Provider {

	const CONVERSION_EVENT_PROVIDER_SLUG = 'popup-maker';

	/**
	 * Checks if the PopupMaker plugin is active.
	 *
	 * @since 1.127.0
	 *
	 * @return bool True if PopupMaker is active, false otherwise.
	 */
	public function is_active() {
		return defined( 'POPMAKE_VERSION' );
	}

	/**
	 * Gets the conversion event names that are tracked by this provider.
	 *
	 * @since 1.127.0
	 *
	 * @return array List of event names.
	 */
	public function get_event_names() {
		return array( 'submit_lead_form' );
	}

	/**
	 * Registers the script for the provider.
	 *
	 * @since 1.127.0
	 *
	 * @return Script Script instance.
	 */
	public function register_script() {
		$script = new Script(
			'googlesitekit-events-provider-' . self::CONVERSION_EVENT_PROVIDER_SLUG,
			array(
				'src'          => $this->context->url( 'dist/assets/js/googlesitekit-events-provider-popup-maker.js' ),
				'dependencies' => array( 'popup-maker-site' ),
				'execution'    => 'defer',
			)
		);

		$script->register( $this->context );

		return $script;
	}
}
