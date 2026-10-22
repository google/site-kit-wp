<?php
/**
 * Class Google\Site_Kit\Core\Util\Product_Post_Type
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use WP_Post_Type;

/**
 * Class for the post type of the site's products, such as WooCommerce's `product`.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Product_Post_Type {

	/**
	 * Gets the post type of the site's products, which the `googlesitekit_product_post_type` filter names.
	 *
	 * @since n.e.x.t
	 *
	 * @return WP_Post_Type|null The post type, or `null` where no public post type has that name.
	 */
	public static function get() {
		/**
		 * Filters the product post type.
		 *
		 * @since 1.116.0
		 *
		 * @param string $product_post_type The product post type name.
		 */
		$product_post_type = apply_filters( 'googlesitekit_product_post_type', 'product' );
		$product_type      = get_post_type_object( $product_post_type );

		if ( $product_type instanceof WP_Post_Type && $product_type->public ) {
			return $product_type;
		}

		return null;
	}
}
