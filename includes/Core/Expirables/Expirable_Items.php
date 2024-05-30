<?php
/**
 * Class Google\Site_Kit\Core\Expirables\Expirable_Items
 *
 * @package   Google\Site_Kit\Core\Expirables
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Expirables;

use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class for handling expirables items.
 *
 * @since 1.128.0
 * @access private
 * @ignore
 */
class Expirable_Items extends User_Setting {
	/**
	 * The user option name for this setting.
	 *
	 * @note This option is prefixed differently so that it will persist across disconnect/reset.
	 */
	const OPTION = 'googlesitekitpersistent_expirable_items';

	/**
	 * Adds one or more items to the list of expired items.
	 *
	 * @since 1.128.0
	 *
	 * @param string $item               Item to set expiration for.
	 * @param int    $expires_in_seconds TTL for the item.
	 */
	public function add( $item, $expires_in_seconds ) {
		$items          = $this->get();
		$items[ $item ] = time() + $expires_in_seconds;

		$this->set( $items );
	}

	/**
	 * Removes one or more items from the list of expirable items.
	 *
	 * @since 1.128.0
	 *
	 * @param string $item Item to remove.
	 */
	public function remove( $item ) {
		$items = $this->get();

		// If the item is not in expirable items, there's nothing to do.
		if ( ! array_key_exists( $item, $items ) ) {
			return;
		}

		unset( $items[ $item ] );

		$this->set( $items );
	}

	/**
	 * Gets the value of the setting.
	 *
	 * @since 1.128.0
	 *
	 * @return array Value set for the option, or default if not set.
	 */
	public function get() {
		$value = parent::get();
		return is_array( $value ) ? $value : $this->get_default();
	}

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.128.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'array';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.128.0
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array();
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.128.0
	 *
	 * @return callable Sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return function ( $items ) {
			return $this->filter_expirable_items( $items );
		};
	}

	/**
	 * Filters expirable items.
	 *
	 * @since 1.128.0
	 *
	 * @param array $items Expirable items list.
	 * @return array Filtered expirable items.
	 */
	private function filter_expirable_items( $items ) {
		$expirables = array();

		if ( is_array( $items ) ) {
			foreach ( $items as $item => $ttl ) {
				if ( is_integer( $ttl ) ) {
					$expirables[ $item ] = $ttl;
				}
			}
		}

		return $expirables;
	}

}
