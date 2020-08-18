<?php
/**
 * Class Google\Site_Kit\Core\Storage\Owner_ID
 *
 * @package   Google\Site_Kit\Core\Storage
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Owner_ID class.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Owner_ID extends Setting {

	/**
	 * The option_name for this setting.
	 */
	const OPTION = 'googlesitekit_owner_id';

	/**
	 * Gets the expected value type.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'integer';
	}

	/**
	 * Gets the value of the setting.
	 *
	 * @since n.e.x.t
	 *
	 * @return int Value set for the option, or registered default if not set.
	 */
	public function get() {
		$owner_id = parent::get();
		if ( ! $this->has() ) {
			$owner_id = $this->get_default();
		}

		return intval( $owner_id );
	}

	/**
	 * Sets Owner ID.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $value Owner ID.
	 * @return bool True on success, false on failure.
	 */
	public function set( $value ) {
		return parent::set(
			call_user_func(
				$this->get_sanitize_callback(),
				$value
			)
		);
	}

	/**
	 * Gets the default value using legacy "googlesitekit_first_admin" option. If
	 * this option doesn't exist, this function will return 0.
	 *
	 * @since n.e.x.t
	 *
	 * @return int The default value.
	 */
	protected function get_default() {
		return intval( get_option( 'googlesitekit_first_admin' ) );
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since n.e.x.t
	 *
	 * @return callable The callable sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return 'intval';
	}

}
