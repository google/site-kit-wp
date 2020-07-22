<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\Woocommerce_Event_List
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events;

/**
 * Class for containing tracking event information for Woocommerce plugin.
 *
 * @since n.e.x.t.
 * @access private
 * @ignore
 */
final class Woocommerce_Event_List extends Measurement_Event_List {

	/**
	 * Woocommerce_Event_List constructor.
	 *
	 * @since n.e.x.t.
	 */
	public function __construct() {
		$event = new Measurement_Event(
			array(
				'pluginName' => 'Woocommerce',
				'category'   => 'ecommerce',
				'action'     => 'add_to_cart',
				'selector'   => '.woocommerce-page .add_to_cart_button',
				'on'         => 'click',
				'metadata'   => <<<CALLBACK
function( params, element ) {
	var valueString = element.closest('li').querySelector('span.woocommerce-Price-amount').lastChild.textContent;
	var currency = element.closest('li').querySelector('span.woocommerce-Price-currencySymbol').innerText;
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
				'pluginName' => 'Woocommerce',
				'category'   => 'ecommerce',
				'action'     => 'add_to_cart',
				'selector'   => '.woocommerce-page .single_add_to_cart_button',
				'on'         => 'click',
				'metadata'   => <<<CALLBACK
function( params, element ) {
	var quantity = document.querySelector('.woocommerce-page .product form.cart div.quantity input').valueAsNumber;
	var value = quantity * parseFloat(document.querySelector('.price span.woocommerce-Price-amount').lastChild.textContent.replace(/,/g, ''));
	var currency = document.querySelector('.price span.woocommerce-Price-currencySymbol').innerText;
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
				'pluginName' => 'Woocommerce',
				'category'   => 'ecommerce',
				'action'     => 'remove_from_cart',
				'selector'   => '.woocommerce-page .remove',
				'on'         => 'click',
				'metadata'   => <<<CALLBACK
function( params, element ) {
	var itemName = element.closest('tr').querySelector('td.product-name a').innerText;
	var quantity = woocommerceCartData.item_quantities[ itemName ];
	var value = quantity * parseFloat(element.closest('tr').querySelector('.product-price span.woocommerce-Price-amount').lastChild.textContent.replace(/,/g, ''));
	var currency = element.closest('tr').querySelector('.product-price span.woocommerce-Price-currencySymbol').innerText;
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
				'pluginName' => 'Woocommerce',
				'category'   => 'ecommerce',
				'action'     => 'begin_checkout',
				'selector'   => 'div.wc-proceed-to-checkout .checkout-button',
				'on'         => 'click',
				'metadata'   => <<<CALLBACK
function( params, element ) {
	var currency = document.querySelector('.order-total span.woocommerce-Price-currencySymbol').innerText;
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
				'pluginName' => 'Woocommerce',
				'category'   => 'ecommerce',
				'action'     => 'view_cart',
				'selector'   => 'a.added_to_cart.wc-forward',
				'on'         => 'click',
			)
		);
		$this->add_event( $event );

		$event = new Measurement_Event(
			array(
				'pluginName' => 'Woocommerce',
				'category'   => 'ecommerce',
				'action'     => 'view_cart',
				'selector'   => 'div.woocommerce-message a.wc-forward',
				'on'         => 'click',
			)
		);
		$this->add_event( $event );

		$event = new Measurement_Event(
			array(
				'pluginName' => 'Woocommerce',
				'category'   => 'ecommerce',
				'action'     => 'view_cart',
				'selector'   => 'a.cart-contents',
				'on'         => 'click',
			)
		);
		$this->add_event( $event );

		$event = new Measurement_Event(
			array(
				'pluginName' => 'Woocommerce',
				'category'   => 'ecommerce',
				'action'     => 'update_cart',
				'selector'   => '.woocommerce-cart-form__contents .coupon ~ .button',
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
				'pluginName' => 'Woocommerce',
				'category'   => 'ecommerce',
				'action'     => 'view_item',
				'selector'   => '.content-area a.woocommerce-LoopProduct-link',
				'on'         => 'click',
			)
		);
		$this->add_event( $event );

		$event = new Measurement_Event(
			array(
				'pluginName' => 'Woocommerce',
				'category'   => 'ecommerce',
				'action'     => 'purchase',
				'selector'   => '.woocommerce-page form.woocommerce-checkout',
				'on'         => 'submit',
				'metadata'   => <<<CALLBACK
function( params, element ) {
	params['value'] = woocommerceCartData.subtotal;

	var currency = document.querySelector('.woocommerce-checkout-review-order .cart-subtotal span.woocommerce-Price-currencySymbol').innerText;
	params['currency'] = currency;

	params['tax'] = 0.0;
	if ( null !== woocommerceCartData.subtotal_tax ) {
		params['tax'] += woocommerceCartData.subtotal_tax;
	}
	if ( null !== woocommerceCartData.shipping_tax ) {
		params['tax'] += woocommerceCartData.shipping_tax;
	}

	if ( null !== woocommerceCartData.shipping ) {
		params['shipping'] = woocommerceCartData.shipping;
	}

	items = [];
	for ( cartItemName in woocommerceCartData.item_quantities ) {
		item = woocommerceProducts[ cartItemName ];
		item['quantity'] = woocommerceCartData.item_quantities[ cartItemName ];
		items.push( item );
	}
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
				'pluginName' => 'Woocommerce',
				'category'   => 'ecommerce',
				'action'     => 'view_item',
				'selector'   => '.woocommerce-page .woocommerce-cart-form .product-name a',
				'on'         => 'click',
			)
		);
		$this->add_event( $event );
	}

}
