<?php
/**
 * FakeConversionEventProvider_Active
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Providers;

use Google\Site_Kit\Core\Assets\Script;

class FakeConversionEventProvider_Active extends FakeConversionEventProvider {

	const CONVERSION_EVENT_PROVIDER_SLUG = 'fake-conversion-event-provider-active';

	const ENHANCED_CONVERSION_EVENTS = array(
		'fake_event_active_2',
	);

	/**
	 * Checks if the provider is active.
	 *
	 * @since 1.126.0
	 *
	 * @return bool True if the provider is active, false otherwise.
	 */
	public function is_active() {
		return true;
	}

	/**
	 * Gets the event names.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of event names.
	 */
	public function get_event_names() {
		return array(
			'fake_event_active_1',
			'fake_event_active_2',
		);
	}

	/**
	 * Registers the script for the provider.
	 *
	 * @since 1.126.0
	 */
	public function register_script() {
		$base_url = $this->context->url( 'dist/assets/' );

		$script_asset = new Script(
			'gsk-cep-' . self::CONVERSION_EVENT_PROVIDER_SLUG,
			array(
				'src'       => $base_url . 'js/fake-conversion-provider-active.js',
				'execution' => 'async',
			)
		);
		$script_asset->register( $this->context );

		return $script_asset;
	}
}
