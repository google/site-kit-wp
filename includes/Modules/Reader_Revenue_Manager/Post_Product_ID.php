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

use Google\Site_Kit\Core\Storage\Meta_Setting_Trait;
use Google\Site_Kit\Core\Storage\Post_Meta;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings;

/**
 * Class for associating product ID to post meta.
 *
 * @since 1.145.0
 * @access private
 * @ignore
 */
class Post_Product_ID {

	use Meta_Setting_Trait;

	/**
	 * Settings instance.
	 *
	 * @since 1.148.0
	 *
	 * @var Settings
	 */
	private $settings;

	/**
	 * Post_Product_ID constructor.
	 *
	 * @since 1.145.0
	 *
	 * @param Post_Meta $post_meta Post_Meta instance.
	 * @param Settings  $settings  Reader Revenue Manager module settings instance.
	 */
	public function __construct( Post_Meta $post_meta, Settings $settings ) {
		$this->meta     = $post_meta;
		$this->settings = $settings;
	}

	/**
	 * Gets the meta key for the setting.
	 *
	 * @since 1.145.0
	 *
	 * @return string Meta key.
	 */
	protected function get_meta_key(): string {
		$publication_id = $this->settings->get()['publicationID'];
		return 'googlesitekit_rrm_' . $publication_id . ':productID';
	}

	/**
	 * Returns the object type.
	 *
	 * @since 1.146.0
	 *
	 * @return string Object type.
	 */
	protected function get_object_type(): string {
		return 'post';
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
