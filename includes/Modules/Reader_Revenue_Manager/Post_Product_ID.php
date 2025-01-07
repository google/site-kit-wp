<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Post_Product_ID
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Core\Storage\Post_Meta_Interface;
use Google\Site_Kit\Core\Storage\Post_Meta_Setting;

/**
 * Class for Reader Revenue Manager product ID setting.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Post_Product_ID extends Post_Meta_Setting {

	/**
	 * Publication ID.
	 *
	 * @var string
	 */
	protected $publication_id;

	/**
	 * Post_Product_ID constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Post_Meta_Interface $post_meta Post_Meta_Interface instance.
	 * @param string              $publication_id Publication ID.
	 */
	public function __construct( Post_Meta_Interface $post_meta, $publication_id ) {
		parent::__construct( $post_meta );

		$this->publication_id = $publication_id;
	}

	/**
	 * The post meta key for this setting.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The meta key.
	 */
	protected function get_meta_key() {
		return "googlesitekit_rrm_$this->publication_id:productID";
	}

	/**
	 * Gets the `show_in_rest` value for this setting, which should be true.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool Always returns true for this postmeta setting.
	 */
	protected function get_show_in_rest() {
		return true;
	}
}
