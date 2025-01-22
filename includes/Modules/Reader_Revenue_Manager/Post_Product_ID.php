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

use Google\Site_Kit\Core\Storage\Post_Meta;
use Google\Site_Kit\Core\Storage\Post_Meta_Setting;

/**
 * Class for associating product ID to post meta.
 *
 * @since 1.145.0
 * @access private
 * @ignore
 */
class Post_Product_ID extends Post_Meta_Setting {
	/**
	 * Publication ID.
	 *
	 * @since 1.145.0
	 *
	 * @var string
	 */
	private string $publication_id;

	/**
	 * Post_Product_ID constructor.
	 *
	 * @since 1.145.0
	 *
	 * @param Post_Meta $post_meta Post_Meta instance.
	 * @param string    $publication_id Publication ID.
	 */
	public function __construct( Post_Meta $post_meta, string $publication_id ) {
		parent::__construct( $post_meta );

		$this->publication_id = $publication_id;
	}

	/**
	 * Gets the meta key for the setting.
	 *
	 * @since 1.145.0
	 *
	 * @return string Meta key.
	 */
	protected function get_meta_key(): string {
		return 'googlesitekit_rrm_' . $this->publication_id . ':productID';
	}

	/**
	 * Gets the `show_in_rest` value for this postmeta setting value.
	 *
	 * @since 1.145.0
	 *
	 * @return bool|Array Any valid value for the `show_in_rest`
	 */
	protected function get_show_in_rest() {
		return true;
	}
}
