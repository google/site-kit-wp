<?php
/**
 * Class Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\WooCommerce
 *
 * @package   Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers;

use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Events_Provider;
use Google\Site_Kit\Core\Util\BC_Functions;

/**
 * Class for handling WooCommerce conversion events.
 *
 * @since 1.127.0
 * @access private
 * @ignore
 */
class WooCommerce extends Conversion_Events_Provider {

	const CONVERSION_EVENT_PROVIDER_SLUG = 'woocommerce';

	/**
	 * Checks if the WooCommerce plugin is active.
	 *
	 * @since 1.127.0
	 *
	 * @return bool True if WooCommerce is active, false otherwise.
	 */
	public function is_active() {
		return did_action( 'woocommerce_loaded' ) > 0;
	}

	/**
	 * Gets the conversion event names that are tracked by this provider.
	 *
	 * @since 1.127.0
	 *
	 * @return array List of event names.
	 */
	public function get_event_names() {
		return array( 'add_to_cart', 'purchase' );
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
				'src'          => $this->context->url( 'dist/assets/js/googlesitekit-events-provider-woocommerce.js' ),
				'execution'    => 'defer',
				'dependencies' => array( 'woocommerce' ),
			)
		);

		$script->register( $this->context );

		return $script;
	}

	/**
	 * Adds a hook for a purchase event.
	 *
	 * @since 1.129.0
	 */
	public function register_hooks() {
		$input = $this->context->input();

		add_action(
			'woocommerce_thankyou',
			function ( $order_id ) use ( $input ) {
				$order = wc_get_order( $order_id );

				// If there isn't a valid order for this ID, or if this order
				// already has a purchase event tracked for it, return early
				// and don't output the script tag to track the purchase event.
				if ( ! $order || $order->get_meta( '_googlesitekit_ga_purchase_event_tracked' ) === '1' ) {
					return;
				}

				// Ensure the order key in the query param is valid for this
				// order.
				$order_key = $input->filter( INPUT_GET, 'key' );

				// Don't output the script tag if the order key is invalid.
				if ( ! $order->key_is_valid( (string) $order_key ) ) {
					return;
				}

				// Mark the order as tracked by Site Kit.
				$order->update_meta_data( '_googlesitekit_ga_purchase_event_tracked', 1 );
				$order->save();

				// Output the script tag to track the purchase event in
				// Analytics.
				BC_Functions::wp_print_inline_script_tag( "window?._googlesitekit?.gtagEvent?.( 'purchase' );" );
			},
			10,
			1
		);
	}
}
