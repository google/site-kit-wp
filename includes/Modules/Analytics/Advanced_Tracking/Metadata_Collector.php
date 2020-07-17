<?php


namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking;


final class Metadata_Collector {

	public function __construct( $active_plugins ) {

	}

	public function register() {
		add_filter(
			'woocommerce_loop_product_link',
			array( $this, 'test' ),
			10,
			2
		);
	}

	public function test($permalink, $product) {
		$id = $product->get_category_ids()[0];
		var_dump($product->get_category_ids());
	}

}
