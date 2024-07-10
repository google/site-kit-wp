<?php
/**
 * Trait Google\Site_Kit\Core\Storage\Setting\List_Setting
 *
 * @package   Google\Site_Kit\Core\Storage\Setting
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage\Setting;

/**
 * A trait for a single setting of the array type.
 *
 * @since 1.98.0
 * @access private
 * @ignore
 */
trait List_Setting {

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.98.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'array';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.98.0
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array();
	}

	/**
	 * Gets the value of the setting.
	 *
	 * @since 1.98.0
	 *
	 * @return array Value set for the option, or default if not set.
	 */
	public function get() {
		$value = parent::get();
		return is_array( $value ) ? $value : $this->get_default();
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.98.0
	 *
	 * @return callable Sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return array( $this, 'sanitize_list_items' );
	}

	/**
	 * Filters array items.
	 *
	 * @since 1.98.0
	 *
	 * @param array $items The original array items.
	 * @return array Filtered items.
	 */
	abstract protected function sanitize_list_items( $items );
}
