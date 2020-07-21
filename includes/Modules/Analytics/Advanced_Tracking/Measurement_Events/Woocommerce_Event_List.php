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
	var quantity = woocommerceCartQuantities[ itemName ];
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
		item['quantity'] = woocommerceCartQuantities[ productName ];
		items.push( item );

		var productQuantity = woocommerceCartQuantities[ productName ];
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
		woocommerceCartQuantities[ productName ] = newQuantity;
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
	var value = parseFloat(document.querySelector('.order-total span.woocommerce-Price-amount').lastChild.textContent.replace(/,/g, ''));
	var currency = document.querySelector('.order-total span.woocommerce-Price-currencySymbol').innerText;
	var tax = parseFloat(document.querySelector('.tax-total span.woocommerce-Price-amount').lastChild.textContent.replace(/,/g, ''));
	var shipping = parseFloat(document.querySelector('.woocommerce-shipping-methods span.woocommerce-Price-amount').lastChild.textContent.replace(/,/g, ''));
	console.log(value);
	console.log(currency);
	console.log(tax);
	console.log(shipping);
	params['value'] = value;
	params['currency'] = currency;
	params['tax'] = tax;
	params['shipping'] = shipping;


	//mock params
	params['transaction_id'] = "123456";
	params['affiliation'] = "Google Online Store";
	var items = [];
	var item_one = {};
	item_one['id'] = "P12345";
	item_one['name'] = "Basketball Shoe";

	items.push(item_one);

	params['items'] = items;

	console.log(params);
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
