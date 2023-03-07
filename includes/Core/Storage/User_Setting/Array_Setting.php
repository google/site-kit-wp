<?php
/**
 * Class Google\Site_Kit\Core\Storage\User_Setting\List
 *
 * @package   Google\Site_Kit\Core\Storage\User_Setting
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage\User_Setting;

use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Base class for a single user setting of the array type.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
abstract class Array_Setting extends User_Setting {

	/**
	 * Gets the expected value type.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'array';
	}

	/**
	 * Gets the default value.
	 *
	 * @since n.e.x.t
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array();
	}

	/**
	 * Gets the value of the setting.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @return callable Sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return array( $this, 'sanitize_array_item' );
	}

	/**
	 * Filters array items.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $items The original array items.
	 * @return array Filtered items.
	 */
	protected function sanitize_array_item( $items ) {
		return $items;
	}

}
