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

	/**
	 * Checks if the provider is active.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if the provider is active, false otherwise.
	 */
	public function is_active() {
		return true;
	}

	/**
	 * Registers the script for the provider.
	 *
	 * @since n.e.x.t
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
