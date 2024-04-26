<?php
/**
 * Class Google\Site_Kit\Core\Conversion_Tracking\Conversion_Events_Providers\WooCommerce
 *
 * @package   Google\Site_Kit\Core\Conversion_Tracking\Conversion_Events_Providers
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Conversion_Tracking\Conversion_Events_Providers;

use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Events_Provider;

/**
 * Class for handling WooCommerce conversion events.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class WooCommerce extends Conversion_Events_Provider {

	const CONVERSION_EVENT_PROVIDER_SLUG = 'woocommerce';

	/**
	 * Checks if the WooCommerce plugin is active.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if WooCommerce is active, false otherwise.
	 */
	public function is_active() {
		return did_action( 'woocommerce_loaded' );
	}

	/**
	 * Gets the conversion event names that are tracked by this provider.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of event names.
	 */
	public function get_event_names() {
		return array( 'add_to_cart', 'purchase' );
	}

	/**
	 * Registers the script for the provider.
	 *
	 * @since n.e.x.t
	 *
	 * @return Script Script instance.
	 */
	public function register_script() {
		$base_url = $this->context->url( 'dist/assets/' );

		$script = new Script(
			'gsk-cep-' . self::CONVERSION_EVENT_PROVIDER_SLUG,
			array(
				'src'          => $base_url . 'js/woocommerce.js',
				'execution'    => 'async',
				'dependencies' => array( 'woocommerce' ),
			)
		);

		$script->register( $this->context );

		return $script;
	}

}
