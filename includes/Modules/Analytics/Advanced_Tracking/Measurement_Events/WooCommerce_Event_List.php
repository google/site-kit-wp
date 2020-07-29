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
			},
			15
		);
		add_action(
			'woocommerce_after_single_product',  // Fires after a single product is loaded.
			function() {
				global $product;
				$this->collect_wc_single_item( $product );
			},
			15
		);
		add_action(
			'woocommerce_after_cart', // Fires after the cart's contents are rendered.
			function() {
				$this->create_wc_cart_events( WC()->cart );
			},
			15
		);
		add_filter(
			'woocommerce_cart_item_product', // Fires when a cart item is being rendered.
			function( $product, $cart_item ) {
				$this->collect_wc_cart_item( $product, $cart_item['quantity'] );
				return $product;
			},
			15,
			2
		);
		add_action(
			'woocommerce_after_checkout_form',
			function() {
				$this->create_wc_checkout_event( WC()->cart );
			},
			15
		);
		add_action(
			'woocommerce_thankyou', // Fires when a WooCommerce order is received.
			function( $order_id ) {
				$order = wc_get_order( $order_id );
				$this->create_wc_purchase_event( $order );
			},
			15
		);

	}

	/**
	 * Creates relevant Measurement_Event objects when a WooCommerce shop item is rendered.
	 *
	 * @since n.e.x.t.
	 *
	 * @param WC_Product $product The WooCommerce product that is being rendered.
	 * @throws \Exception Thrown when invalid keys or value type.
	 */
	private function collect_wc_shop_item( $product ) {
		$product_name = $product->get_name();
		$product_id   = $product->get_id();
		$item         = array();
		// TODO: Figure out more robust way to collect product category.
		$category_id      = $product->get_category_ids()[0];
		$item['category'] = get_term_by( 'id', $category_id, 'product_cat' )->name;
		$item['id']       = $product->get_sku();
		$item['name']     = $product_name;
		$item['price']    = $product->get_price();
		$item['quantity'] = 1;

		$add_to_cart_meta                   = array();
		$add_to_cart_meta['event_category'] = 'ecommerce';
		$add_to_cart_meta['value']          = $product->get_price();
		$add_to_cart_meta['currency']       = get_woocommerce_currency();
		$add_to_cart_items                  = array();
		$add_to_cart_items[]                = $item;
		$add_to_cart_meta['items']          = $add_to_cart_items;
		$add_to_cart_event                  = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'action'     => 'add_to_cart',
				'selector'   => '.woocommerce-page .add_to_cart_button[data-product_id="' . $product_id . '"]',
				'on'         => 'click',
				'metadata'   => $add_to_cart_meta,
			)
		);
		$this->add_event( $add_to_cart_event );

		$view_cart_meta                   = array();
		$view_cart_meta['event_category'] = 'ecommerce';
		$view_cart_meta['event_label']    = WC()->cart->get_subtotal();
		$view_cart_event                  = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'action'     => 'view_cart',
				'selector'   => '.woocommerce-page .add_to_cart_button[data-product_id="' . $product_id . '"] ~ a',
				'on'         => 'click',
				'metadata'   => $view_cart_meta,
			)
		);
		$this->add_event( $view_cart_event );

	}

	/**
	 * Creates relevant Measurement_Event objects when a single WooCommerce item is rendered.
	 *
	 * @since n.e.x.t.
	 *
	 * @param WC_Product $product The WooCommerce product that is being rendered.
	 * @throws \Exception Thrown when invalid keys or value type.
	 */
	private function collect_wc_single_item( $product ) {
		$product_name     = $product->get_name();
		$item             = array();
		$category_id      = $product->get_category_ids()[0];
		$item['category'] = get_term_by( 'id', $category_id, 'product_cat' )->name;
		$item['id']       = $product->get_sku();
		$item['name']     = $product_name;
		$item['price']    = $product->get_price();
		// TODO: Get the quantity of the item from the frontend.

		$add_to_cart_meta                   = array();
		$add_to_cart_meta['event_category'] = 'ecommerce';
		$add_to_cart_meta['value']          = $product->get_price();
		$add_to_cart_meta['currency']       = get_woocommerce_currency();
		$add_to_cart_items                  = array();
		$add_to_cart_items[]                = $item;
		$add_to_cart_meta['items']          = $add_to_cart_items;
		$add_to_cart_event                  = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'action'     => 'add_to_cart',
				'selector'   => '.woocommerce-page .single_add_to_cart_button',
				'on'         => 'click',
				'metadata'   => $add_to_cart_meta,
			)
		);
		$this->add_event( $add_to_cart_event );

		$view_cart_meta                   = array();
		$view_cart_meta['event_category'] = 'ecommerce';
		$view_cart_meta['event_label']    = WC()->cart->get_subtotal();
		$view_cart_event                  = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'action'     => 'view_cart',
				'selector'   => 'div.woocommerce-message a.wc-forward',
				'on'         => 'click',
				'metadata'   => $view_cart_meta,
			)
		);
		$this->add_event( $view_cart_event );

		$view_item_meta                   = array();
		$view_item_meta['event_category'] = 'ecommerce';
		$view_item_items                  = array();
		$view_item_items[]                = $item;
		$view_item_meta['items']          = $view_item_items;
		$view_item_event                  = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'action'     => 'view_item',
				'selector'   => '',
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
	 * @param WC_Cart $cart The WooCommerce cart instance.
	 * @throws \Exception Thrown when invalid keys or value type.
	 */
	private function create_wc_cart_events( $cart ) {
		$view_cart_meta                   = array();
		$view_cart_meta['event_category'] = 'ecommerce';
		$view_cart_meta['event_label']    = $cart->get_subtotal();

		$view_cart_event = new Measurement_Event(
			array(
				'pluginName' => 'WooCoomerce',
				'action'     => 'view_cart',
				'selector'   => '',
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
	 * @param WC_Product $product The WooCommerce product that is being rendered.
	 * @param number     $quantity The quantity of the product that is in the cart.
	 * @throws \Exception Thrown when invalid keys or value type.
	 */
	private function collect_wc_cart_item( $product, $quantity ) {
		$product_name     = $product->get_name();
		$product_id       = $product->get_id();
		$item             = array();
		$category_id      = $product->get_category_ids()[0];
		$item['category'] = get_term_by( 'id', $category_id, 'product_cat' )->name;
		$item['id']       = $product->get_sku();
		$item['name']     = $product_name;
		$item['price']    = $product->get_price();
		$item['quantity'] = $quantity;

		$remove_from_cart_meta                   = array();
		$remove_from_cart_meta['event_category'] = 'ecommerce';
		$remove_from_cart_meta['value']          = strval( floatval( $product->get_price() ) * floatval( $quantity ) );
		$remove_from_cart_meta['currency']       = get_woocommerce_currency();
		$remove_from_cart_items                  = array();
		$remove_from_cart_items[]                = $item;
		$remove_from_cart_meta['items']          = $remove_from_cart_items;
		$remove_from_cart_event                  = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'action'     => 'remove_from_cart',
				'selector'   => '.woocommerce-page .remove[data-product_id="' . $product_id . '"]',
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
	 * @param WC_Cart $cart The WooCommerce cart instance.
	 * @throws \Exception Thrown when invalid keys or value type.
	 */
	private function create_wc_checkout_event( $cart ) {
		$items = array();
		foreach ( $cart->get_cart() as $cart_item ) {
			$product          = $cart_item['data'];
			$item             = array();
			$category_id      = $product->get_category_ids()[0];
			$item['category'] = get_term_by( 'id', $category_id, 'product_cat' )->name;
			$item['id']       = $product->get_sku();
			$item['name']     = $product->get_name();
			$item['price']    = $product->get_price();
			$item['quantity'] = $cart_item['quantity'];
			$items[]          = $item;
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
				'selector'   => '',
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
	 * @param WC_Order $order The WooCommerce order.
	 * @throws \Exception Thrown when invalid keys or value type.
	 */
	private function create_wc_purchase_event( $order ) {
		$items       = array();
		$order_items = $order->get_items( apply_filters( 'woocommerce_purchase_order_item_types', 'line_item' ) );
		foreach ( $order_items as $item_id => $item ) {
			$product                   = $item->get_product();
			$purchase_item             = array();
			$category_id               = $product->get_category_ids()[0];
			$purchase_item['category'] = get_term_by( 'id', $category_id, 'product_cat' )->name;
			$purchase_item['id']       = $product->get_sku();
			$purchase_item['name']     = $product->get_name();
			$purchase_item['price']    = $product->get_price();
			$purchase_item['quantity'] = $item->get_quantity();
			$items[]                   = $purchase_item;
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
				'selector'   => '',
				'on'         => 'DOMContentLoaded',
				'metadata'   => $purchase_meta,
			)
		);
		$this->add_event( $place_order_event );
	}
}
