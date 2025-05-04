<?php
/**
 * Class Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\WPForms
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
 * Class for handling WPForms conversion events.
 *
 * @since 1.127.0
 * @access private
 * @ignore
 */
class WPForms extends Conversion_Events_Provider {

	const CONVERSION_EVENT_PROVIDER_SLUG = 'wpforms';

	/**
	 * Checks if the WPForms plugin is active.
	 *
	 * @since 1.127.0
	 *
	 * @return bool True if WPForms is active, false otherwise.
	 */
	public function is_active() {
		return defined( 'WPFORMS_VERSION' );
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
				'src'       => $this->context->url( 'dist/assets/js/googlesitekit-events-provider-wpforms.js' ),
				'execution' => 'defer',
			)
		);

		$script->register( $this->context );

		return $script;
	}
}
