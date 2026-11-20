<?php
/**
 * WC_Order_Item_Product_Fake
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

/**
 * Fakes a WooCommerce `WC_Order_Item_Product`, one product line of an order,
 * for a test that formats an order with the WooCommerce plugin inactive.
 *
 * Like WooCommerce, it holds the line's totals without tax, and the tax on
 * them separately.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class WC_Order_Item_Product_Fake {

	/**
	 * The product the line is for.
	 *
	 * @since n.e.x.t
	 * @var WC_Product_Fake
	 */
	private $product;

	/**
	 * How many units of the product the line holds.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $quantity;

	/**
	 * The line's totals, with the keys `subtotal`, `subtotal_tax`, `total` and
	 * `total_tax`.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	private $totals;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param WC_Product_Fake $product  The product the line is for.
	 * @param int             $quantity How many units of the product the line holds.
	 * @param array           $totals   The line's totals: `subtotal` before coupons and `total` after them, both without tax, and the tax on each as `subtotal_tax` and `total_tax`.
	 */
	public function __construct( $product, $quantity, $totals ) {
		$this->product  = $product;
		$this->quantity = $quantity;
		$this->totals   = $totals;
	}

	/**
	 * Gets the product the line is for.
	 *
	 * @since n.e.x.t
	 *
	 * @return WC_Product_Fake The product.
	 */
	public function get_product() {
		return $this->product;
	}

	/**
	 * Gets how many units of the product the line holds.
	 *
	 * @since n.e.x.t
	 *
	 * @return int The quantity.
	 */
	public function get_quantity() {
		return $this->quantity;
	}

	/**
	 * Gets the line total before coupons, without tax.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The subtotal, such as `'100.00'`.
	 */
	public function get_subtotal() {
		return $this->totals['subtotal'];
	}

	/**
	 * Gets the tax on the line total before coupons.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The tax, such as `'10.00'`.
	 */
	public function get_subtotal_tax() {
		return $this->totals['subtotal_tax'];
	}

	/**
	 * Gets the line total after coupons, without tax.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The total, such as `'80.00'`.
	 */
	public function get_total() {
		return $this->totals['total'];
	}

	/**
	 * Gets the tax on the line total after coupons.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The tax, such as `'8.00'`.
	 */
	public function get_total_tax() {
		return $this->totals['total_tax'];
	}
}
