<?php
/**
 * FakeContentEventProvider_Active
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Providers;

use Google\Site_Kit\Core\Assets\Script;

class FakeContentEventProvider_Active extends FakeConversionEventProvider {

	const CONVERSION_EVENT_PROVIDER_SLUG = 'fake-content-event-provider-active';

	/**
	 * Checks if the provider is active.
	 *
	 * @since 1.186.0
	 *
	 * @return bool True if the provider is active, false otherwise.
	 */
	public function is_active() {
		return true;
	}

	/**
	 * Gets the provider category.
	 *
	 * @since 1.186.0
	 *
	 * @return string Provider category.
	 */
	public function get_category() {
		return self::CATEGORY_CONTENT;
	}

	/**
	 * Gets the event names.
	 *
	 * @since 1.186.0
	 *
	 * @return array List of event names.
	 */
	public function get_event_names() {
		return array();
	}

	/**
	 * Gets the enhanced conversion event names.
	 *
	 * @since 1.186.0
	 *
	 * @return array List of enhanced conversion event names.
	 */
	public function get_enhanced_event_names() {
		return array();
	}

	/**
	 * Registers the script for the provider.
	 *
	 * @since 1.186.0
	 */
	public function register_script() {
		$base_url = $this->context->url( 'dist/assets/' );

		$script_asset = new Script(
			'gsk-cep-' . self::CONVERSION_EVENT_PROVIDER_SLUG,
			array(
				'src'       => $base_url . 'js/fake-content-provider-active.js',
				'execution' => 'defer',
			)
		);
		$script_asset->register( $this->context );

		return $script_asset;
	}
}
