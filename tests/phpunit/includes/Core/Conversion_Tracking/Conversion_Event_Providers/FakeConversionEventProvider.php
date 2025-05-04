<?php
/**
 * FakeConversionEventProvider
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Providers;

use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Events_Provider;

class FakeConversionEventProvider extends Conversion_Events_Provider {

	const CONVERSION_EVENT_PROVIDER_SLUG = 'fake-conversion-event-provider';

	/**
	 * Gets the event names.
	 *
	 * @since 1.126.0
	 *
	 * @return array List of event names.
	 */
	public function get_event_names() {
		return array(
			'test-event',
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
				'src'       => $base_url . 'js/fake-conversion-provider.js',
				'execution' => 'async',
			)
		);
		$script_asset->register( $this->context );

		return $script_asset;
	}

	/**
	 * Registers any actions/hooks for this provider.
	 *
	 * @since 1.129.0
	 */
	public function register_hooks() {
		// Register a fake action.
		add_action( 'fake_provider_action', '__return_true' );
	}
}
