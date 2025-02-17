<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Term_Product_ID
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Core\Storage\Term_Meta;
use Google\Site_Kit\Core\Storage\Meta_Setting_Trait;

/**
 * Class for associating product ID to term meta.
 *
 * @since 1.146.0
 * @access private
 * @ignore
 */
class Term_Product_ID {

	use Meta_Setting_Trait;

	/**
	 * Publication ID.
	 *
	 * @since 1.146.0
	 *
	 * @var string
	 */
	private string $publication_id;

	/**
	 * Term_Product_ID constructor.
	 *
	 * @since 1.146.0
	 *
	 * @param Term_Meta $term_meta Term_Meta instance.
	 * @param string    $publication_id Publication ID.
	 */
	public function __construct( Term_Meta $term_meta, string $publication_id ) {
		$this->meta           = $term_meta;
		$this->publication_id = $publication_id;
	}

	/**
	 * Gets the meta key for the setting.
	 *
	 * @since 1.146.0
	 *
	 * @return string Meta key.
	 */
	protected function get_meta_key(): string {
		return 'googlesitekit_rrm_' . $this->publication_id . ':productID';
	}

	/**
	 * Returns the object type.
	 *
	 * @since 1.146.0
	 *
	 * @return string Object type.
	 */
	protected function get_object_type(): string {
		return 'term';
	}

	/**
	 * Gets the `show_in_rest` value for this termmeta setting value.
	 *
	 * @since 1.146.0
	 *
	 * @return bool|Array Any valid value for the `show_in_rest`
	 */
	protected function get_show_in_rest() {
		return true;
	}
}
