<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\Woocommerce_Event_List
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events;

/**
 * Subclass that contains information for Woocommerce plugin
 *
 * @class Woocommerce_Event_List
 */
class Woocommerce_Event_List extends Measurement_Event_List {

	/**
	 * Woocommerce_Event_List constructor.
	 */
	public function __construct() {
		$builder = Measurement_Event::create_builder(
			array(
				'pluginName' => 'Woocommerce',
				'category'   => 'ecommerce',
				'action'     => 'add_to_cart',
				'selector'   => '.woocommerce-page .add_to_cart_button',
				'on'         => 'click',
			)
		);
		$this->add_event( $builder->build() );

		$builder = Measurement_Event::create_builder(
			array(
				'pluginName' => 'Woocommerce',
				'category'   => 'ecommerce',
				'action'     => 'add_to_cart',
				'selector'   => '.woocommerce-page .single_add_to_cart_button',
				'on'         => 'click',
			)
		);
		$this->add_event( $builder->build() );

		$builder = Measurement_Event::create_builder(
			array(
				'pluginName' => 'Woocommerce',
				'category'   => 'ecommerce',
				'action'     => 'remove_from_cart',
				'selector'   => '.woocommerce-page .remove',
				'on'         => 'click',
			)
		);
		$this->add_event( $builder->build() );

		$builder = Measurement_Event::create_builder(
			array(
				'pluginName' => 'Woocommerce',
				'category'   => 'ecommerce',
				'action'     => 'checkout',
				'selector'   => 'div.wc-proceed-to-checkout .checkout-button',
				'on'         => 'click',
			)
		);
		$this->add_event( $builder->build() );

		$builder = Measurement_Event::create_builder(
			array(
				'pluginName' => 'Woocommerce',
				'category'   => 'ecommerce',
				'action'     => 'review_cart',
				'selector'   => 'a.added_to_cart.wc-forward',
				'on'         => 'click',
			)
		);
		$this->add_event( $builder->build() );

		$builder = Measurement_Event::create_builder(
			array(
				'pluginName' => 'Woocommerce',
				'category'   => 'ecommerce',
				'action'     => 'review_cart',
				'selector'   => 'div.woocommerce-message a.wc-forward',
				'on'         => 'click',
			)
		);
		$this->add_event( $builder->build() );

		$builder = Measurement_Event::create_builder(
			array(
				'pluginName' => 'Woocommerce',
				'category'   => 'ecommerce',
				'action'     => 'cart_contents',
				'selector'   => 'a.cart-contents',
				'on'         => 'click',
			)
		);
		$this->add_event( $builder->build() );

		$builder = Measurement_Event::create_builder(
			array(
				'pluginName' => 'Woocommerce',
				'category'   => 'ecommerce',
				'action'     => 'update_cart',
				'selector'   => '.woocommerce-cart-form__contents .coupon ~ .button',
				'on'         => 'click',
			)
		);
		$this->add_event( $builder->build() );

		$builder = Measurement_Event::create_builder(
			array(
				'pluginName' => 'Woocommerce',
				'category'   => 'ecommerce',
				'action'     => 'product_details',
				'selector'   => '.content-area a.woocommerce-LoopProduct-link',
				'on'         => 'click',
			)
		);
		$this->add_event( $builder->build() );

		$builder = Measurement_Event::create_builder(
			array(
				'pluginName' => 'Woocommerce',
				'category'   => 'ecommerce',
				'action'     => 'place_order',
				'selector'   => '.woocommerce-page form.woocommerce-checkout',
				'on'         => 'click',
			)
		);
		$this->add_event( $builder->build() );

		$builder = Measurement_Event::create_builder(
			array(
				'pluginName' => 'Woocommerce',
				'category'   => 'ecommerce',
				'action'     => 'product_details',
				'selector'   => '.woocommerce-page .woocommerce-cart-form .product-name a',
				'on'         => 'click',
			)
		);
		$this->add_event( $builder->build() );
	}

}
