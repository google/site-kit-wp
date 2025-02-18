<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Tag_Interface
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager;

/**
 * Interface for a Reader_Revenue_Manager tag.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
interface Tag_Interface {

	/**
	 * Sets the product ID.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $product_id Product ID.
	 */
	public function set_product_id( $product_id );
}
