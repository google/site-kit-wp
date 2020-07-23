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
use WC_Cart;
use WC_Order;

/**
 * Class for collecting various event metadata.
 *
 * @since n.e.x.t.
 * @access private
 * @ignore
 */
final class Metadata_Collector {

	/**
	 * List of active plugins.
	 *
	 * @since n.e.x.t.
	 * @var array
	 */
	private $active_plugins;

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
	 * Contains relevant metadata for a woocommerce order.
	 *
	 * @since n.e.x.t.
	 * @var array
	 */
	private $wc_order_data;

	/**
	 * Contains the store metadata for a woocommerce store.
	 *
	 * @since n.e.x.t.
	 * @var array
	 */
	private $wc_store_data;

	/**
	 * Metadata_Collector constructor.
	 *
	 * @since n.e.x.t.
	 *
	 * @param array $active_plugins The list of active plugins.
	 */
	public function __construct( $active_plugins ) {
		$this->active_plugins = $active_plugins;

		$this->items = array();

		$this->wc_cart_data                    = array();
		$this->wc_cart_data['item_quantities'] = array();
		$this->wc_cart_data['subtotal']        = 0;
		$this->wc_cart_data['subtotal_tax']    = null;
		$this->wc_cart_data['shipping']        = null;
		$this->wc_cart_data['shipping_tax']    = null;

		$this->wc_order_data                   = array();
		$this->wc_order_data['transaction_id'] = null;
		$this->wc_order_data['subtotal']       = 0;
		$this->wc_order_data['subtotal_tax']   = null;
		$this->wc_order_data['shipping']       = null;
		$this->wc_order_data['shipping_tax']   = null;
		$this->wc_order_data['items']          = null;
		$this->wc_order_data['currency']       = null;

		$this->wc_store_data['currency'] = null;
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
			'woocommerce_after_single_product',  // Fires after a single product is loaded.
			function() {
				global $product;
				$this->collect_woocommerce_product_metadata( $product );
			},
			15
		);
		add_action(
			'woocommerce_after_shop_loop_item', // Fires after a non-single product is loaded.
			function() {
				global $product;
				$this->collect_woocommerce_product_metadata( $product );
			},
			15
		);
		add_action(
			'woocommerce_thankyou', // Fires when an order is received.
			function( $order_id ) {
				$order = wc_get_order( $order_id );
				$this->collect_woocommerce_order_metadata( $order );
			},
			10
		);
		if ( array_key_exists( 'WooCommerce', $this->active_plugins ) && function_exists( 'WC' ) ) {
			$this->collect_woocommerce_cart_metadata( WC()->cart );
			$this->collect_woocommerce_store_metadata();
		}
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
				var woocommerceOrderData = <?php echo wp_json_encode( $this->wc_order_data ); ?>;
				var woocommerceStoreData = <?php echo wp_json_encode( $this->wc_store_data ); ?>;
			</script>
		<?php
	}

	/**
	 * Collects relevant metadata from a given WooCommerce product and adds it to the list.
	 *
	 * @since n.e.x.t.
	 *
	 * @param WC_Product $product The WooCommcerce product to collect metadata from.
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

	/**
	 * Collects relevant metadata from a given WooCommerce cart.
	 *
	 * @since n.e.x.t.
	 *
	 * @param WC_Cart $cart The WooCommerce cart to collect metadata from.
	 */
	private function collect_woocommerce_cart_metadata( $cart ) {
		$this->wc_cart_data['subtotal']     = floatval( $cart->get_subtotal() );
		$this->wc_cart_data['subtotal_tax'] = floatval( $cart->get_subtotal_tax() );
		$this->wc_cart_data['shipping']     = floatval( $cart->get_shipping_total() );
		$this->wc_cart_data['shipping_tax'] = floatval( $cart->get_shipping_tax() );

		foreach ( $cart->get_cart() as $cart_item ) {
			$product = $cart_item['data'];
			$this->collect_woocommerce_product_metadata( $product );
			$this->wc_cart_data['item_quantities'][ $product->get_name() ] = $cart_item['quantity'];
		}
	}

	/**
	 * Collects relevant metadata from a given WooCommerce order.
	 *
	 * @since n.e.x.t.
	 *
	 * @param WC_Order $order The WooCommerce order to collect metadata from.
	 */
	private function collect_woocommerce_order_metadata( $order ) {
		$order_data = $order->get_data();

		$transaction_id                        = $order->get_transaction_id();
		$this->wc_order_data['transaction_id'] = '' == $transaction_id ? 'not_paid' : $transaction_id;
		$this->wc_order_data['subtotal']       = $order->get_subtotal();
		$this->wc_order_data['subtotal_tax']   = $order_data['cart_tax'];
		$this->wc_order_data['shipping']       = $order_data['shipping_total'];
		$this->wc_order_data['shipping_tax']   = $order_data['shipping_tax'];
		$this->wc_order_data['currency']       = $order_data['currency'];

		$order_items = $order->get_items( apply_filters( 'woocommerce_purchase_order_item_types', 'line_item' ) );
		foreach ( $order_items as $item_id => $item ) {
			$product = $item->get_product();
			$this->collect_woocommerce_product_metadata( $product );
			$this->items[ $product->get_name() ]['quantity']      = $item->get_quantity();
			$this->wc_order_data['items'][ $product->get_name() ] = $this->items[ $product->get_name() ];
		}
	}

	/**
	 * Collects relevant metadata from the general WooCommerce store.
	 *
	 * @since n.e.x.t.
	 */
	private function collect_woocommerce_store_metadata() {
		$this->wc_store_data['currency'] = get_woocommerce_currency();
	}

}
