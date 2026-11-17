<?php
/**
 * WC_Order_Fake
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

/**
 * Fakes a WooCommerce `WC_Order` in US dollars, with `5.00` shipping, for a
 * test that formats an order with the WooCommerce plugin inactive.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class WC_Order_Fake {

	/**
	 * The order's product lines.
	 *
	 * @since n.e.x.t
	 * @var WC_Order_Item_Product_Fake[]
	 */
	private $items;

	/**
	 * The codes of the coupons the order used.
	 *
	 * @since n.e.x.t
	 * @var string[]
	 */
	private $coupon_codes;

	/**
	 * Whether the store entered its prices with tax when the order was placed.
	 *
	 * @since n.e.x.t
	 * @var bool
	 */
	private $prices_include_tax;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param WC_Order_Item_Product_Fake[] $items              The order's product lines.
	 * @param string[]                     $coupon_codes       The codes of the coupons the order used.
	 * @param bool                         $prices_include_tax Whether the store entered its prices with tax.
	 */
	public function __construct( $items, $coupon_codes, $prices_include_tax ) {
		$this->items              = $items;
		$this->coupon_codes       = $coupon_codes;
		$this->prices_include_tax = $prices_include_tax;
	}

	/**
	 * Gets the order ID.
	 *
	 * @since n.e.x.t
	 *
	 * @return int The order ID.
	 */
	public function get_id() {
		return 99;
	}

	/**
	 * Gets the order's currency.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The currency code.
	 */
	public function get_currency() {
		return 'USD';
	}

	/**
	 * Gets the order's tax, the sum of the tax on every line after coupons.
	 *
	 * @since n.e.x.t
	 *
	 * @return float The tax.
	 */
	public function get_total_tax() {
		return array_sum( array_map( fn( $item ) => (float) $item->get_total_tax(), $this->items ) );
	}

	/**
	 * Gets the order's shipping cost.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The shipping cost.
	 */
	public function get_total_shipping() {
		return '5.00';
	}

	/**
	 * Gets the amount the shopper paid: every line after coupons, with its tax,
	 * plus shipping.
	 *
	 * @since n.e.x.t
	 *
	 * @return float The order total.
	 */
	public function get_total() {
		$lines = array_sum( array_map( fn( $item ) => (float) $item->get_total(), $this->items ) );

		return $lines + $this->get_total_tax() + (float) $this->get_total_shipping();
	}

	/**
	 * Gets the order's product lines.
	 *
	 * @since n.e.x.t
	 *
	 * @return WC_Order_Item_Product_Fake[] The product lines.
	 */
	public function get_items() {
		return $this->items;
	}

	/**
	 * Gets the codes of the coupons the order used.
	 *
	 * @since n.e.x.t
	 *
	 * @return string[] The coupon codes.
	 */
	public function get_coupon_codes() {
		return $this->coupon_codes;
	}

	/**
	 * Gets whether the store entered its prices with tax when the order was placed.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool Whether prices include tax.
	 */
	public function get_prices_include_tax() {
		return $this->prices_include_tax;
	}

	/**
	 * Gets the price of one unit of a line before coupons, as WooCommerce
	 * computes it when told not to round.
	 *
	 * @since n.e.x.t
	 *
	 * @param WC_Order_Item_Product_Fake $item    The product line.
	 * @param bool                       $inc_tax Whether to add the tax.
	 * @return float The price of one unit.
	 */
	public function get_item_subtotal( $item, $inc_tax ) {
		$tax = $inc_tax ? (float) $item->get_subtotal_tax() : 0;

		return ( (float) $item->get_subtotal() + $tax ) / $item->get_quantity();
	}

	/**
	 * Gets the price of one unit of a line after coupons, as WooCommerce
	 * computes it when told not to round.
	 *
	 * @since n.e.x.t
	 *
	 * @param WC_Order_Item_Product_Fake $item    The product line.
	 * @param bool                       $inc_tax Whether to add the tax.
	 * @return float The price of one unit.
	 */
	public function get_item_total( $item, $inc_tax ) {
		$tax = $inc_tax ? (float) $item->get_total_tax() : 0;

		return ( (float) $item->get_total() + $tax ) / $item->get_quantity();
	}
}
