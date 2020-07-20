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
	var items = [];
	items[0] = woocommerceProducts[element.closest('li').querySelector('h2').innerHTML];
	var value = element.closest('li').querySelector('span.woocommerce-Price-amount').lastChild.textContent;
	var currency = element.closest('li').querySelector('span.woocommerce-Price-currencySymbol').innerText;
	console.log(parseFloat(value.replace(/,/g, '')));
	console.log(currency);
	params['items'] = items;
	params['value'] = parseFloat(value.replace(/,/g, ''));
	params['currency'] = currency;
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
	var value = document.querySelector('.price span.woocommerce-Price-amount').lastChild.textContent;
	var currency = document.querySelector('.price span.woocommerce-Price-currencySymbol').innerText;
	console.log(parseFloat(value.replace(/,/g, '')));
	console.log(currency);
	params['value'] = parseFloat(value.replace(/,/g, ''));
	params['currency'] = currency;
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
	var value = element.closest('tr').querySelector('.product-price span.woocommerce-Price-amount').lastChild.textContent;
	var currency = element.closest('tr').querySelector('.product-price span.woocommerce-Price-currencySymbol').innerText;
	console.log(parseFloat(value.replace(/,/g, '')));
	console.log(currency);
	params['value'] = parseFloat(value.replace(/,/g, ''));
	params['currency'] = currency;
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
	var value = document.querySelector('.order-total span.woocommerce-Price-amount').lastChild.textContent;
	var currency = document.querySelector('.order-total span.woocommerce-Price-currencySymbol').innerText;
	console.log(value);
	console.log(parseFloat(value.replace(/,/g, '')));
	console.log(currency);
	params['value'] = parseFloat(value.replace(/,/g, ''));
	params['currency'] = currency;
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
	var value = document.querySelector('.order-total span.woocommerce-Price-amount').lastChild.textContent;
	var currency = document.querySelector('.order-total span.woocommerce-Price-currencySymbol').innerText;
	var tax = document.querySelector('.tax-total span.woocommerce-Price-amount').lastChild.textContent;
	var shipping = document.querySelector('.woocommerce-shipping-methods span.woocommerce-Price-amount').lastChild.textContent;
	console.log(parseFloat(value.replace(/,/g, '')));
	console.log(currency);
	console.log(tax);
	console.log(shipping);
	params['value'] = parseFloat(value.replace(/,/g, ''));
	params['currency'] = currency;
	params['tax'] = tax;
	params['shipping'] = shipping;
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
