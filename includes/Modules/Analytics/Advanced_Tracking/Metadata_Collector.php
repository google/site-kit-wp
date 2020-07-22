<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Metadata_Collector
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking;

use WC_Product;

/**
 * Class for collecting various event metadata.
 *
 * @since n.e.x.t.
 * @access private
 * @ignore
 */
final class Metadata_Collector {

	/**
	 * List of item metadata objects that could be an event parameter for the current page.
	 *
	 * @since n.e.x.t.
	 * @var array
	 */
	private $items;

	/**
	 * Contains relevant values in or calculated from woocommerce's cart.
	 *
	 * @since n.e.x.t.
	 * @var array
	 */
	private $wc_cart_data;

	/**
	 * Metadata_Collector constructor.
	 *
	 * @since n.e.x.t.
	 */
	public function __construct() {
		$this->items                           = array();
		$this->wc_cart_data                    = array();
		$this->wc_cart_data['item_quantities'] = array();
		$this->wc_cart_data['subtotal']        = 0;
		$this->wc_cart_data['subtotal_tax']    = null;
		$this->wc_cart_data['shipping']        = null;
		$this->wc_cart_data['shipping_tax']    = null;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t.
	 */
	public function register() {
		add_action(
			'wp_footer',
			function() {
				$this->inject_metadata();
			},
			10
		);
		add_action(
			'woocommerce_product_meta_start',  // Fires when a single product is loaded.
			function() {
				global $product;
				$this->collect_woocommerce_product_metadata( $product );
			},
			10
		);
		add_filter(
			'woocommerce_loop_product_link', // Fires when a non-single product is loaded.
			function( $permalink, $product ) {
				$this->collect_woocommerce_product_metadata( $product );
				return $permalink;
			},
			10,
			2
		);
		add_filter(
			'woocommerce_cart_item_product', // Fires when a cart item is loaded.
			function( $cart_item_data ) {
				$this->collect_woocommerce_product_metadata( $cart_item_data );
				return $cart_item_data;
			},
			10,
			1
		);
		add_filter(
			'woocommerce_cart_item_quantity', // Fires when a cart item quantity is evaluated.
			function( $product_quantity, $cart_item_key, $cart_item ) {
				$product_name = $cart_item['data']->get_name();
				$this->wc_cart_data['item_quantities'][ $product_name ] = $product_quantity;
				return $product_quantity;
			},
			10,
			3
		);
		add_filter(
			'woocommerce_checkout_cart_item_quantity', // Fires when a cart item quantity is evaluated during checkout.
			function( $quantity_html, $cart_item ) {
				$product_name = $cart_item['data']->get_name();
				$this->wc_cart_data['item_quantities'][ $product_name ] = $cart_item['quantity'];
				return $quantity_html;
			},
			10,
			2
		);
		add_filter(
			'woocommerce_cart_product_subtotal', // Fires when a cart item subtotal is evaluated.
			function( $product_subtotal_html, $product, $quantity ) {
				$new_subtotal                    = $product->get_price() * $quantity;
				$this->wc_cart_data['subtotal'] += $new_subtotal;
				return $product_subtotal_html;
			},
			10,
			3
		);
		add_action(
			'woocommerce_review_order_after_shipping', // Fires after the shipping costs are calculated.
			function() {
				$this->wc_cart_data['shipping'] = floatval( WC()->cart->get_shipping_total() );
			},
			10
		);
		add_action(
			'woocommerce_review_order_after_order_total', // Fires after the review order total table is loaded.
			function() {
				$this->wc_cart_data['subtotal_tax'] = floatval( WC()->cart->get_subtotal_tax() );
				$this->wc_cart_data['shipping_tax'] = floatval( WC()->cart->get_shipping_tax() );
			},
			10
		);
	}

	/**
	 * Injects the list of items into the page as a global javascript variable.
	 *
	 * @since n.e.x.t.
	 */
	private function inject_metadata() {
		?>
			<script>
				var woocommerceProducts = <?php echo wp_json_encode( $this->items ); ?>;
				var woocommerceCartData = <?php echo wp_json_encode( $this->wc_cart_data ); ?>;
			</script>
		<?php
	}

	/**
	 * Creates a new item metadata object and adds it to the list.
	 *
	 * @since n.e.x.t.
	 *
	 * @param WC_Product $product The Woocommcerce product whose metadata we are collecting.
	 */
	private function collect_woocommerce_product_metadata( $product ) {
		$item_name = $product->get_name();
		if ( array_key_exists( $item_name, $this->items ) ) {
			return;
		}
		$new_item = array();

		$category_id          = $product->get_category_ids()[0];
		$new_item['category'] = get_term_by( 'id', $category_id, 'product_cat' )->name;
		$new_item['id']       = $product->get_sku();
		$new_item['name']     = $item_name;
		$new_item['price']    = $product->get_price();

		$this->items[ $item_name ] = $new_item;
	}

}
