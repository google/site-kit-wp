<?php
/**
 * WC_Product_Fake
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

/**
 * Fakes a simple WooCommerce `WC_Product`, for a test that formats an order
 * with the WooCommerce plugin inactive.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class WC_Product_Fake {

	/**
	 * The product ID.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $id;

	/**
	 * The product name.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $title;

	/**
	 * The price the shop lists, such as `'55.00'`.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $price;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param int    $id    The product ID.
	 * @param string $title The product name.
	 * @param string $price The price the shop lists, such as `'55.00'`.
	 */
	public function __construct( $id, $title, $price ) {
		$this->id    = $id;
		$this->title = $title;
		$this->price = $price;
	}

	/**
	 * Gets the product ID.
	 *
	 * @since n.e.x.t
	 *
	 * @return int The product ID.
	 */
	public function get_id() {
		return $this->id;
	}

	/**
	 * Checks the product type. This fake is a simple product, so it matches no
	 * other type, such as `variation` or `bundle`.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $type The product type to check.
	 * @return bool Whether the product has the type, `true` only for `simple`.
	 */
	public function is_type( $type ) {
		return 'simple' === $type;
	}

	/**
	 * Gets the product name.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The product name.
	 */
	public function get_title() {
		return $this->title;
	}

	/**
	 * Gets the price the shop lists.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The price, such as `'55.00'`.
	 */
	public function get_price() {
		return $this->price;
	}
}
