<?php


namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking;


final class Metadata_Collector {

	private $items;

	public function __construct() {
		$this->items = array();
	}

	public function register() {
		add_action(
			'wp_footer',
			function() {
				$this->inject_metadata();
			},
			10
		);
		add_filter(
			'woocommerce_loop_product_link', // Fires when a product is loaded on the shop page.
			function( $permalink, $product ) {
				$this->collect_woocommerce_product( $product );
				return $permalink;
			},
			10,
			2
		);
	}

	private function inject_metadata() {
		?>
			<script>
				var woocommerceProducts = <?php echo wp_json_encode( $this->items ); ?>;
			</script>
		<?php
	}

	private function collect_woocommerce_product( $product ) {
		$new_item = array();
		$item_name = $product->get_name();

		$category_id = $product->get_category_ids()[0];
		$new_item['category'] = get_term_by( 'id', $category_id, 'product_cat' )->name;
		$new_item['id'] = $product->get_sku();
		$new_item['name'] = $item_name;
		$new_item['price'] = $product->get_price();

		$this->items[ $item_name ] = $new_item;
	}

}
