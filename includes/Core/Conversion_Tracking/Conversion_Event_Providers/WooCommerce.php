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
	 * Avaialble products on the page.
	 *
	 * @var Array
	 *
	 * @since 1.153.0
	 */
	protected $products = array();

	/**
	 * Current product added to the cart.
	 *
	 * @since 1.153.0
	 * @var WC_Product
	 */
	protected $add_to_cart;

	/**
	 * Checks if the WooCommerce plugin is active.
	 *
	 * @since 1.127.0
	 *
	 * @return bool True if WooCommerce is active, false otherwise.
	 */
	public function is_active() {
		return class_exists( 'WooCommerce' );
	}

	/**
	 * Gets the conversion event names that are tracked by this provider, and Google Analytics for WooCommerce addon when active.
	 *
	 * @since 1.127.0
	 *
	 * @return array List of event names.
	 */
	public function get_event_names() {
		$wgai_event_names = $this->get_wgai_event_names();
		$events_to_track  = $this->events_to_track();

		return array_unique( array_merge( $events_to_track, $wgai_event_names ) );
	}

	/**
	 * Gets the conversion event names that are tracked by Google Analytics for WooCommerce provider.
	 *
	 * @since 1.154.0
	 *
	 * @return array List of event names.
	 */
	protected function get_wgai_event_names() {
		if ( ! class_exists( 'WC_Google_Analytics_Integration' ) ) {
			return array();
		}

		$settings    = get_option( 'woocommerce_google_analytics_settings' );
		$event_names = array();

		// If only product identifier is availabe in the saved settings, it means default options are used.
		// And by default all events are tracked.
		if ( isset( $settings['ga_product_identifier'] ) && count( $settings ) === 1 ) {
			return array(
				'purchase',
				'add_to_cart',
				'remove_from_cart',
				'view_item_list',
				'select_content',
				'view_item',
				'begin_checkout',
			);
		}

		$event_mapping = array(
			'ga_ecommerce_tracking_enabled'           => 'purchase',
			'ga_event_tracking_enabled'               => 'add_to_cart',
			'ga_enhanced_remove_from_cart_enabled'    => 'remove_from_cart',
			'ga_enhanced_product_impression_enabled'  => 'view_item_list',
			'ga_enhanced_product_click_enabled'       => 'select_content',
			'ga_enhanced_product_detail_view_enabled' => 'view_item',
			'ga_enhanced_checkout_process_enabled'    => 'begin_checkout',
		);

		$event_names = array();

		foreach ( $event_mapping as $setting_key => $event_name ) {
			if ( isset( $settings[ $setting_key ] ) && 'yes' === $settings[ $setting_key ] ) {
				$event_names[] = $event_name;
			}
		}

		return $event_names;
	}

	/**
	 * Gets the conversion event names that should be tracked by this provider.
	 *
	 * @since 1.154.0
	 *
	 * @return array List of event names.
	 */
	protected function events_to_track() {
		$event_names     = array( 'add_to_cart', 'purchase' );
		$wgai_event_name = $this->get_wgai_event_names();

		if ( ! empty( $wgai_event_name ) ) {
			return array_values( array_diff( $event_names, $wgai_event_name ) );
		}

		return $event_names;
	}

	/**
	 * Gets the conversion event names that are tracked by this provider.
	 *
	 * @since 1.154.0
	 *
	 * @return string Comma separated list of event names.
	 */
	public function get_debug_data() {
		if ( empty( $this->events_to_track() ) ) {
			return esc_html__( 'Events tracked through Analytics integration addon', 'google-site-kit' );
		}

		return parent::get_debug_data();
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
		add_filter(
			'woocommerce_loop_add_to_cart_link',
			function ( $button, $product ) {
				$this->products[] = $this->get_formatted_product( $product );

				return $button;
			},
			10,
			2
		);

		add_action(
			'woocommerce_add_to_cart',
			function ( $cart_item_key, $product_id, $quantity, $variation_id, $variation ) {
				$this->add_to_cart = $this->get_formatted_product(
					wc_get_product( $product_id ),
					$variation_id,
					$variation,
					$quantity
				);
			},
			10,
			5
		);

		add_action(
			'woocommerce_thankyou',
			fn( $order_id ) => $this->maybe_add_purchase_inline_script( $order_id, wp_is_block_theme() ),
			10,
			1
		);

		add_action(
			'wp_footer',
			function () {
				$script_slug = 'googlesitekit-events-provider-' . self::CONVERSION_EVENT_PROVIDER_SLUG;

				$events_to_track = $this->events_to_track();

				$inline_script = join(
					"\n",
					array(
						'window._googlesitekit.wcdata = window._googlesitekit.wcdata || {};',
						sprintf( 'window._googlesitekit.wcdata.products = %s;', wp_json_encode( $this->products ) ),
						sprintf( 'window._googlesitekit.wcdata.add_to_cart = %s;', wp_json_encode( $this->add_to_cart ) ),
						sprintf( 'window._googlesitekit.wcdata.currency = "%s";', esc_js( get_woocommerce_currency() ) ),
						sprintf( 'window._googlesitekit.wcdata.eventsToTrack = %s;', wp_json_encode( $events_to_track ) ),
					)
				);

				if ( is_wc_endpoint_url( 'order-received' ) && wp_is_block_theme() ) {
					$order_id = absint( get_query_var( 'order-received' ) );

					$this->maybe_add_purchase_inline_script( $order_id );
				}

				wp_add_inline_script( $script_slug, $inline_script, 'before' );
			}
		);
	}

	/**
	 * Returns an array of product data in the required format.
	 * Adapted from https://github.com/woocommerce/woocommerce-google-analytics-integration
	 *
	 * @since 1.153.0
	 *
	 * @param WC_Product $product The product to format.
	 * @param int        $variation_id Variation product ID.
	 * @param array|bool $variation An array containing product variation attributes to include in the product data.
	 * For the "variation" type products, we'll use product->get_attributes.
	 * @param bool|int   $quantity Quantity to include in the formatted product object.
	 *
	 * @return array
	 */
	public function get_formatted_product( $product, $variation_id = 0, $variation = false, $quantity = false ) {
		$product_id = $product->is_type( 'variation' ) ? $product->get_parent_id() : $product->get_id();
		$price      = $product->get_price();

		// Get product price from chosen variation if set.
		if ( $variation_id ) {
			$variation_product = wc_get_product( $variation_id );
			if ( $variation_product ) {
				$price = $variation_product->get_price();
			}
		}

		// Integration with Product Bundles.
		// Get the minimum price, as `get_price` may return 0 if the product is a bundle and the price is potentially a range.
		// Even a range containing a single value.
		if ( $product->is_type( 'bundle' ) && is_callable( array( $product, 'get_bundle_price' ) ) ) {
			$price = $product->get_bundle_price( 'min' );
		}

		$formatted = array(
			'id'         => $product_id,
			'name'       => $product->get_title(),
			'categories' => array_map(
				fn( $category ) => array( 'name' => $category->name ),
				wc_get_product_terms( $product_id, 'product_cat', array( 'number' => 5 ) )
			),
			'price'      => $this->get_formatted_price( $price ),
		);

		if ( $quantity ) {
			$formatted['quantity'] = (int) $quantity;
		}

		if ( $product->is_type( 'variation' ) ) {
			$variation = $product->get_attributes();
		}

		if ( is_array( $variation ) ) {
			$formatted['variation'] = implode(
				', ',
				array_map(
					function ( $attribute, $value ) {
							return sprintf(
								'%s: %s',
								str_replace( 'attribute_', '', $attribute ),
								$value
							);
					},
					array_keys( $variation ),
					array_values( $variation )
				)
			);
		}

		return $formatted;
	}

	/**
	 * Returns an array of order data in the required format.
	 * Adapted from https://github.com/woocommerce/woocommerce-google-analytics-integration
	 *
	 * @since 1.153.0
	 *
	 * @param WC_Abstract_Order $order An instance of the WooCommerce Order object.
	 *
	 * @return array
	 */
	public function get_formatted_order( $order ) {
		return array(
			'id'          => $order->get_id(),
			'affiliation' => get_bloginfo( 'name' ),
			'totals'      => array(
				'currency_code'  => $order->get_currency(),
				'tax_total'      => $this->get_formatted_price( $order->get_total_tax() ),
				'shipping_total' => $this->get_formatted_price( $order->get_total_shipping() ),
				'total_price'    => $this->get_formatted_price( $order->get_total() ),
			),
			'items'       => array_map(
				function ( $item ) {
					return array_merge(
						$this->get_formatted_product( $item->get_product() ),
						array(
							'quantity'                    => $item->get_quantity(),
							'price_after_coupon_discount' => $this->get_formatted_price( $item->get_total() ),
						)
					);
				},
				array_values( $order->get_items() ),
			),
		);
	}

	/**
	 * Formats a price the same way WooCommerce Blocks does.
	 * Taken from https://github.com/woocommerce/woocommerce-google-analytics-integration
	 *
	 * @since 1.153.0
	 *
	 * @param mixed $value The price value for format.
	 *
	 * @return int
	 */
	public function get_formatted_price( $value ) {
		return intval(
			round(
				( (float) wc_format_decimal( $value ) ) * ( 10 ** absint( wc_get_price_decimals() ) ),
				0
			)
		);
	}

	/**
	 * Prints the purchase event details.
	 *
	 * @since 1.154.0
	 *
	 * @param int  $order_id             The order ID.
	 * @param bool $skip_meta_value_save Whether to skip saving the _googlesitekit_ga_purchase_event_tracked meta value.
	 */
	protected function maybe_add_purchase_inline_script( $order_id, $skip_meta_value_save = false ) {
		$wgai_event_names = $this->get_wgai_event_names();
		// If purchase event is tracked by the Google Analytics for WooCommerce addon,
		// don't output the script tag to track the purchase event.
		if ( in_array( 'purchase', $wgai_event_names, true ) ) {
			return;
		}

		$input = $this->context->input();
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

		// In case we are on block theme, this hook running on thank you page will not attach the script.
		// So we need to skip it, and apply this on the later hook.
		if ( ! $skip_meta_value_save ) {
			// Mark the order as tracked by Site Kit.
			$order->update_meta_data( '_googlesitekit_ga_purchase_event_tracked', 1 );
			$order->save();
		}

		wp_add_inline_script(
			'googlesitekit-events-provider-' . self::CONVERSION_EVENT_PROVIDER_SLUG,
			join(
				"\n",
				array(
					'window._googlesitekit.wcdata = window._googlesitekit.wcdata || {};',
					sprintf( 'window._googlesitekit.wcdata.purchase = %s;', wp_json_encode( $this->get_formatted_order( $order ) ) ),
				)
			),
			'before'
		);
	}
}
