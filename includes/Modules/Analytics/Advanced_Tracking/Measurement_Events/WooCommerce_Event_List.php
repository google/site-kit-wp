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

/**
 * Class for containing tracking event information for WooCommerce plugin.
 *
 * @since n.e.x.t.
 * @access private
 * @ignore
 */
final class WooCommerce_Event_List extends Measurement_Event_List {
	// TODO: Implement metadata callbacks.

	/**
	 * WooCommerce_Event_List constructor.
	 *
	 * @since n.e.x.t.
	 */
	public function __construct() {
		$event = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'category'   => 'ecommerce',
				'action'     => 'add_to_cart',
				'selector'   => '.woocommerce-page .add_to_cart_button',
				'on'         => 'click',
				'metadata'   => <<<CALLBACK
function( params, element ) {
	var valueString = element.closest('li').querySelector('span.woocommerce-Price-amount').lastChild.textContent;
	var currency = woocommerceStoreData.currency;
	console.log(valueString);
	console.log(currency);
	params['value'] = parseFloat(valueString.replace(/,/g, ''));
	params['currency'] = currency;
	var items = [];
	var itemName = element.closest('li').querySelector('.woocommerce-loop-product__title').innerText;
	var item = woocommerceProducts[ itemName ];
	item['quantity'] = 1;
	items.push(item);
	params['items'] = items;
	return params;
}
CALLBACK
			,
			)
		);
		$this->add_event( $event );

		$event = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'category'   => 'ecommerce',
				'action'     => 'add_to_cart',
				'selector'   => '.woocommerce-page .single_add_to_cart_button',
				'on'         => 'click',
				'metadata'   => <<<CALLBACK
function( params, element ) {
	var quantity = document.querySelector('.woocommerce-page .product form.cart div.quantity input').valueAsNumber;
	var value = quantity * parseFloat(document.querySelector('.price span.woocommerce-Price-amount').lastChild.textContent.replace(/,/g, ''));
	var currency = woocommerceStoreData.currency;
	console.log(value);
	console.log(currency);
	params['value'] = value;
	params['currency'] = currency;
	var items = [];
	var itemName = document.querySelector('.woocommerce-page .product .product_title').innerText;
	var item = woocommerceProducts[ itemName ];
	item['quantity'] = quantity;
	items.push(item);
	params['items'] = items;
	return params;
}
CALLBACK
			,
			)
		);
		$this->add_event( $event );

		$event = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'category'   => 'ecommerce',
				'action'     => 'remove_from_cart',
				'selector'   => '.woocommerce-page .remove',
				'on'         => 'click',
				'metadata'   => <<<CALLBACK
function( params, element ) {
	var itemName = element.closest('tr').querySelector('td.product-name a').innerText;
	var quantity = woocommerceCartData.item_quantities[ itemName ];
	var value = quantity * parseFloat(element.closest('tr').querySelector('.product-price span.woocommerce-Price-amount').lastChild.textContent.replace(/,/g, ''));
	var currency = woocommerceStoreData.currency;
	console.log(value);
	console.log(currency);
	params['value'] = value;
	params['currency'] = currency;
	var items = [];
	var item = woocommerceProducts[ itemName ];
	item['quantity'] = quantity;
	items.push(item);
	params['items'] = items;
	return params;
}
CALLBACK
			,
			)
		);
		$this->add_event( $event );

		$event = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'category'   => 'ecommerce',
				'action'     => 'begin_checkout',
				'selector'   => 'div.wc-proceed-to-checkout .checkout-button',
				'on'         => 'click',
				'metadata'   => <<<CALLBACK
function( params, element ) {
	var currency = woocommerceStoreData.currency;
	params['currency'] = currency;
	var value = 0.0;
	items = [];
	cartItems = document.querySelectorAll( '.woocommerce-cart-form__cart-item' );
	for ( cartItem of cartItems ) {
		var productName = cartItem.querySelector( '.product-name a' ).innerText;
		var item = woocommerceProducts[ productName ];
		item['quantity'] = woocommerceCartData.item_quantities[ productName ];
		items.push( item );
		var productQuantity = woocommerceCartData.item_quantities[ productName ];
		value += productQuantity * parseFloat( item['price'] );
	}
	params['value'] = value;
	params['items'] = items;
	return params;
}
CALLBACK
			,
			)
		);
		$this->add_event( $event );

		$event = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'category'   => 'ecommerce',
				'action'     => 'view_cart',
				'selector'   => 'a.added_to_cart.wc-forward',
				'on'         => 'click',
			)
		);
		$this->add_event( $event );

		$event = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'category'   => 'ecommerce',
				'action'     => 'view_cart',
				'selector'   => 'div.woocommerce-message a.wc-forward',
				'on'         => 'click',
			)
		);
		$this->add_event( $event );

		$event = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'category'   => 'ecommerce',
				'action'     => 'view_cart',
				'selector'   => 'a.cart-contents',
				'on'         => 'click',
			)
		);
		$this->add_event( $event );

		$event = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'category'   => 'ecommerce',
				'action'     => 'update_cart',
				'selector'   => '.woocommerce-cart-form__contents .button[name="update_cart"]',
				'on'         => 'click',
				'metadata'   => <<<CALLBACK
function( params, element ) {
	cartItems = document.querySelectorAll( '.woocommerce-cart-form__cart-item' );
	for ( cartItem of cartItems ) {
		var productName = cartItem.querySelector( '.product-name a' ).innerText;
		var newQuantity = cartItem.querySelector( '.product-quantity input' ).valueAsNumber;
		woocommerceCartData.item_quantities[ productName ] = newQuantity;
	}
	return params;
}
CALLBACK
			,
			)
		);
		$this->add_event( $event );

		$event = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'category'   => 'ecommerce',
				'action'     => 'view_item',
				'selector'   => '.content-area a.woocommerce-LoopProduct-link',
				'on'         => 'click',
			)
		);
		$this->add_event( $event );

		// TODO: This event most likely needs to happen when the thank you page is loaded rather than when button is clicked.
		$event = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'category'   => 'ecommerce',
				'action'     => 'purchase',
				'selector'   => '.woocommerce-page form.woocommerce-checkout',
				'on'         => 'submit',
			)
		);
		$this->add_event( $event );

		$event = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'category'   => 'ecommerce',
				'action'     => 'view_item',
				'selector'   => '.woocommerce-page .woocommerce-cart-form .product-name a',
				'on'         => 'click',
			)
		);
		$this->add_event( $event );
	}

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
		$product_id = $product->get_id();
		$item = array();
		// TODO: Figure out more robust way to collect product category.
		$category_id = $product->get_category_ids()[0];
		$item['category'] = get_term_by( 'id', $category_id, 'product_cat' )->name;
		$item['id'] = $product->get_sku();
		$item['name'] = $product_name;
		$item['price'] = $product->get_price();
		$item['quantity'] = 1;

		$add_to_cart_meta = array();
		$add_to_cart_meta['event_category'] = 'ecommerce';
		$add_to_cart_meta['value'] = $product->get_price();
		$add_to_cart_meta['currency'] = get_woocommerce_currency();
		$add_to_cart_items = array();
		$add_to_cart_items[] = $item;
		$add_to_cart_meta['items'] = $add_to_cart_items;
		$add_to_cart_event = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'action' => 'add_to_cart',
				'selector' => '.woocommerce-page .add_to_cart_button[data-product_id="' . $product_id . '"]',
				'on' => 'click',
				'metadata' => $add_to_cart_meta,
			)
		);
		$this->add_event( $add_to_cart_event );

		$view_cart_meta = array();
		$view_cart_meta['event_category'] = 'ecommerce';
		$view_cart_meta['event_label'] = WC()->cart->get_subtotal();
		$view_cart_event = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'action' => 'view_cart',
				'selector' => '.woocommerce-page .add_to_cart_button[data-product_id="' . $product_id . '"] ~ a',
				'on' => 'click',
				'metadata' => $view_cart_meta,
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
		$product_name = $product->get_name();
		$item = array();
		$category_id = $product->get_category_ids()[0];
		$item['category'] = get_term_by( 'id', $category_id, 'product_cat' )->name;
		$item['id'] = $product->get_sku();
		$item['name'] = $product_name;
		$item['price'] = $product->get_price();
		// TODO: Get the quantity of the item from the frontend.

		$add_to_cart_meta = array();
		$add_to_cart_meta['event_category'] = 'ecommerce';
		$add_to_cart_meta['value'] = $product->get_price();
		$add_to_cart_meta['currency'] = get_woocommerce_currency();
		$add_to_cart_items = array();
		$add_to_cart_items[] = $item;
		$add_to_cart_meta['items'] = $add_to_cart_items;
		$add_to_cart_event = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'action' => 'add_to_cart',
				'selector' => '.woocommerce-page .single_add_to_cart_button',
				'on' => 'click',
				'metadata' => $add_to_cart_meta,
			)
		);
		$this->add_event( $add_to_cart_event );

		$view_cart_meta = array();
		$view_cart_meta['event_category'] = 'ecommerce';
		$view_cart_meta['event_label'] = WC()->cart->get_subtotal();
		$view_cart_event = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'action' => 'view_cart',
				'selector' => 'div.woocommerce-message a.wc-forward',
				'on' => 'click',
				'metadata' => $view_cart_meta,
			)
		);
		$this->add_event( $view_cart_event );

		$view_item_meta = array();
		$view_item_meta['event_category'] = 'ecommerce';
		$view_item_items = array();
		$view_item_items[] = $item;
		$view_item_meta['items'] = $view_item_items;
		$view_item_event = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'action' => 'view_item',
				'selector' => '',
				'on' => 'DOMContentLoaded',
				'metadata' => $view_item_meta,
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
		$view_cart_meta = array();
		$view_cart_meta['event_category'] = 'ecommerce';
		$view_cart_meta['event_label'] = $cart->get_subtotal();

		$view_cart_event = new Measurement_Event(
			array(
				'pluginName' => 'WooCoomerce',
				'action' => 'view_cart',
				'selector' => '',
				'on' => 'DOMContentLoaded',
				'metadata' => $view_cart_meta,
			)
		);
		$this->add_event( $view_cart_event );

		$update_cart_meta = array();
		$update_cart_meta['event_category'] = 'ecommerce';
		$update_cart_event = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'action' => 'update_cart',
				'selector' => '.woocommerce-cart-form__contents .button[name="update_cart"]',
				'on' => 'click',
				'metadata' => $update_cart_meta,
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
	 * @param number $quantity The quantity of the product that is in the cart.
	 * @throws \Exception Thrown when invalid keys or value type.
	 */
	private function collect_wc_cart_item( $product, $quantity ) {
		$product_name = $product->get_name();
		$product_id = $product->get_id();
		$item = array();
		$category_id = $product->get_category_ids()[0];
		$item['category'] = get_term_by( 'id', $category_id, 'product_cat' )->name;
		$item['id'] = $product->get_sku();
		$item['name'] = $product_name;
		$item['price'] = $product->get_price();
		$item['quantity'] = $quantity;

		$remove_from_cart_meta = array();
		$remove_from_cart_meta['event_category'] = 'ecommerce';
		$remove_from_cart_meta['value'] = strval( floatval( $product->get_price() ) * floatval( $quantity ) );
		$remove_from_cart_meta['currency'] = get_woocommerce_currency();
		$remove_from_cart_items = array();
		$remove_from_cart_items[] = $item;
		$remove_from_cart_meta['items'] = $remove_from_cart_items;
		$remove_from_cart_event = new Measurement_Event(
			array(
				'pluginName' => 'WooCommerce',
				'action' => 'remove_from_cart',
				'selector' => '.woocommerce-page .remove[data-product_id="' . $product_id . '"]',
				'on' => 'click',
				'metadata' => $remove_from_cart_meta,
			)
		);
		$this->add_event( $remove_from_cart_event );
	}
}
