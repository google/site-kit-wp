<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\WooCommerce_Event_List
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events;

use WC_Product;
use WC_Cart;
use WC_Order;

/**
 * Class for containing tracking event information for WooCommerce plugin.
 *
 * @since n.e.x.t.
 * @access private
 * @ignore
 */
final class WooCommerce_Event_List extends Measurement_Event_List {

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t.
	 */
	public function register() {
		add_action(
			'woocommerce_after_shop_loop_item', // Fires after a non-single product is loaded.
			function() {
				global $product;
				$this->collect_wc_shop_item( $product );
			}
		);
		add_action(
			'woocommerce_after_single_product',  // Fires after a single product is loaded.
			function() {
				global $product;
				$this->collect_wc_single_item( $product );
			}
		);
		add_action(
			'woocommerce_after_cart', // Fires after the cart's contents are rendered.
			function() {
				$this->create_wc_cart_events( WC()->cart );
			}
		);
		add_filter(
			'woocommerce_cart_item_product', // Fires when a cart item is being rendered.
			function( $product, $cart_item ) {
				$this->collect_wc_cart_item( $product, $cart_item['quantity'] );
				return $product;
			},
			10,
			2
		);
		add_action(
			'woocommerce_after_checkout_form', // Fires after checkout form is loaded.
			function() {
				$this->create_wc_checkout_event( WC()->cart );
			}
		);
		add_action(
			'woocommerce_thankyou', // Fires when a WooCommerce order is received.
			function( $order_id ) {
				$order = wc_get_order( $order_id );
				$this->create_wc_purchase_event( $order );
			}
		);

	}

	/**
	 * Creates relevant Measurement_Event objects when a WooCommerce shop item is rendered.
	 *
	 * @since n.e.x.t.
	 *
	 * @param \WC_Product $product The WooCommerce product that is being rendered.
	 * @throws \Exception Thrown when invalid keys or value type.
	 */
	private function collect_wc_shop_item( \WC_Product $product ) {
		$item = $this->parse_product_into_item( $product, 1 );

		$add_to_cart_meta          = $this->parse_product_into_base_metadata( $product );
		$add_to_cart_items         = array();
		$add_to_cart_items[]       = $item;
		$add_to_cart_meta['items'] = $add_to_cart_items;
		$add_to_cart_event         = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'action'     => 'add_to_cart',
				'selector'   => '.woocommerce-page .add_to_cart_button[data-product_id="' . $product->get_id() . '"]',
				'on'         => 'click',
				'metadata'   => $add_to_cart_meta,
			)
		);
		$this->add_event( $add_to_cart_event );

	}

	/**
	 * Creates relevant Measurement_Event objects when a single WooCommerce item is rendered.
	 *
	 * @since n.e.x.t.
	 *
	 * @param \WC_Product $product The WooCommerce product that is being rendered.
	 * @throws \Exception Thrown when invalid keys or value type.
	 */
	private function collect_wc_single_item( \WC_Product $product ) {
		// TODO: Get the quantity of the item from the frontend.
		$item = $this->parse_product_into_item( $product, 1 );

		$add_to_cart_meta          = $this->parse_product_into_base_metadata( $product );
		$add_to_cart_items         = array();
		$add_to_cart_items[]       = $item;
		$add_to_cart_meta['items'] = $add_to_cart_items;
		$add_to_cart_event         = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'action'     => 'add_to_cart',
				'selector'   => '.woocommerce-page .single_add_to_cart_button[value="' . $product->get_id() . '"]',
				'on'         => 'click',
				'metadata'   => $add_to_cart_meta,
			)
		);
		$this->add_event( $add_to_cart_event );


		$view_item_meta                   = array();
		$view_item_meta['event_category'] = 'ecommerce';
		$view_item_items                  = array();
		$view_item_items[]                = $item;
		$view_item_meta['items']          = $view_item_items;
		$view_item_event                  = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'action'     => 'view_item',
				'on'         => 'DOMContentLoaded',
				'metadata'   => $view_item_meta,
			)
		);
		$this->add_event( $view_item_event );
	}

	/**
	 * Creates the relevant cart events after the cart contents are rendered.
	 *
	 * @since n.e.x.t.
	 *
	 * @param \WC_Cart $cart The WooCommerce cart instance.
	 * @throws \Exception Thrown when invalid keys or value type.
	 */
	private function create_wc_cart_events( \WC_Cart $cart ) {
		$view_cart_meta                   = array();
		$view_cart_meta['event_category'] = 'ecommerce';
		$view_cart_meta['event_label']    = $cart->get_subtotal();

		$view_cart_event = new Measurement_Event(
			array(
				'pluginName' => 'WooCoomerce',
				'action'     => 'view_cart',
				'on'         => 'DOMContentLoaded',
				'metadata'   => $view_cart_meta,
			)
		);
		$this->add_event( $view_cart_event );

		$update_cart_meta                   = array();
		$update_cart_meta['event_category'] = 'ecommerce';
		$update_cart_event                  = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'action'     => 'update_cart',
				'selector'   => '.woocommerce-cart-form__contents .button[name="update_cart"]',
				'on'         => 'click',
				'metadata'   => $update_cart_meta,
			)
		);
		$this->add_event( $update_cart_event );
	}

	/**
	 * Creates relevant Measurement_Event objects when a WooCommerce cart item is rendered.
	 *
	 * @since n.e.x.t.
	 *
	 * @param \WC_Product $product The WooCommerce product that is being rendered.
	 * @param number      $quantity The quantity of the product that is in the cart.
	 * @throws \Exception Thrown when invalid keys or value type.
	 */
	private function collect_wc_cart_item( \WC_Product $product, $quantity ) {
		$item = $this->parse_product_into_item( $product, $quantity );

		$remove_from_cart_meta          = $this->parse_product_into_base_metadata( $product );
		$remove_from_cart_meta['value'] = strval( floatval( $product->get_price() ) * floatval( $quantity ) );
		$remove_from_cart_items         = array();
		$remove_from_cart_items[]       = $item;
		$remove_from_cart_meta['items'] = $remove_from_cart_items;
		$remove_from_cart_event         = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'action'     => 'remove_from_cart',
				'selector'   => '.woocommerce-page .remove[data-product_id="' . $product->get_id() . '"]',
				'on'         => 'click',
				'metadata'   => $remove_from_cart_meta,
			)
		);
		$this->add_event( $remove_from_cart_event );
	}

	/**
	 * Creates begin_checkout Measurement_Event object when the checkout page is loaded.
	 *
	 * @since n.e.x.t.
	 *
	 * @param \WC_Cart $cart The WooCommerce cart instance.
	 * @throws \Exception Thrown when invalid keys or value type.
	 */
	private function create_wc_checkout_event( \WC_Cart $cart ) {
		$items = array();
		foreach ( $cart->get_cart() as $cart_item ) {
			$product = $cart_item['data'];
			$item    = $this->parse_product_into_item( $product, $cart_item['quantity'] );
			$items[] = $item;
		}

		$checkout_meta                   = array();
		$checkout_meta['event_category'] = 'ecommerce';
		$checkout_meta['value']          = $cart->get_subtotal();
		$checkout_meta['currency']       = get_woocommerce_currency();
		$checkout_meta['items']          = $items;
		$checkout_event                  = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'action'     => 'begin_checkout',
				'on'         => 'DOMContentLoaded',
				'metadata'   => $checkout_meta,
			)
		);
		$this->add_event( $checkout_event );
	}

	/**
	 * Creates a purchase Measurement_Event object when an order is received.
	 *
	 * @since n.e.x.t.
	 *
	 * @param \WC_Order $order The WooCommerce order.
	 * @throws \Exception Thrown when invalid keys or value type.
	 */
	private function create_wc_purchase_event( \WC_Order $order ) {
		$items       = array();
		$order_items = $order->get_items( apply_filters( 'woocommerce_purchase_order_item_types', 'line_item' ) );
		foreach ( $order_items as $item_id => $item ) {
			$product       = $item->get_product();
			$purchase_item = $this->parse_product_into_item( $product, $item->get_quantity() );
			$items[]       = $purchase_item;
		}

		$order_data = $order->get_data();

		$purchase_meta                   = array();
		$purchase_meta['event_category'] = 'ecommerce';
		$transaction_id                  = $order->get_transaction_id();
		$purchase_meta['transaction_id'] = empty( $transaction_id ) ? 'not_paid' : $transaction_id;
		$purchase_meta['value']          = $order->get_subtotal();
		$purchase_meta['currency']       = get_woocommerce_currency();
		$purchase_meta['tax']            = strval( floatval( $order_data['cart_tax'] ) + floatval( $order_data['shipping_tax'] ) );
		$purchase_meta['shipping']       = $order_data['shipping_total'];
		$purchase_meta['items']          = $items;
		$place_order_event               = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'action'     => 'purchase',
				'on'         => 'DOMContentLoaded',
				'metadata'   => $purchase_meta,
			)
		);
		$this->add_event( $place_order_event );
	}

	/**
	 * Parses a WooCommerce product for relevant 'item' metadata.
	 *
	 * @since n.e.x.t.
	 *
	 * @param \WC_Product $product The WooCommerce product being parsed.
	 * @param number      $quantity The quantity of this product.
	 * @return array The item metadata object.
	 */
	private function parse_product_into_item( \WC_Product $product, $quantity ) {
		$item             = array();
		$category_ids     = $product->get_category_ids();
		$item['category'] = implode(
			'/',
			array_filter(
				array_map(
					function( $category_id ) {
						$category_obj = get_term( $category_id );
						if ( $category_obj instanceof \WP_Term ) {
							return $category_obj->name;
						}
						return '';
					},
					$category_ids
				)
			)
		);
		$item['id']       = $product->get_sku();
		$item['name']     = $product->get_name();
		$item['price']    = $product->get_price();
		$item['quantity'] = $quantity;
		return $item;
	}

	/**
	 * Parses a WooCommerce product into the base metadata object.
	 *
	 * @since n.e.x.t.
	 *
	 * @param \WC_Product $product The WooCommerce product used to create the base metadata object.
	 * @return array The base metadata object.
	 */
	private function parse_product_into_base_metadata( \WC_Product $product ) {
		$metadata                   = array();
		$metadata['event_category'] = 'ecommerce';
		$metadata['value']          = $product->get_price();
		$metadata['currency']       = get_woocommerce_currency();
		return $metadata;
	}
}
