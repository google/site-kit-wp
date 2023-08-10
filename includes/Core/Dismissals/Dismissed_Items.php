<?php
/**
 * Class Google\Site_Kit\Core\Dismissals\Dismissed_Items
 *
 * @package   Google\Site_Kit\Core\Dismissals
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Dismissals;

use Closure;
use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class for representing a user's dismissed items.
 *
 * @since 1.37.0
 * @access private
 * @ignore
 */
class Dismissed_Items extends User_Setting {

	/**
	 * The user option name for this setting.
	 *
	 * @note This option is prefixed differently so that it will persist across disconnect/reset.
	 */
	const OPTION = 'googlesitekitpersistent_dismissed_items';

	const DISMISS_ITEM_PERMANENTLY = 0;

	/**
	 * Adds one or more items to the list of dismissed items.
	 *
	 * @since 1.37.0
	 *
	 * @param string $item               Item to dismiss.
	 * @param int    $expires_in_seconds TTL for the item.
	 */
	public function add( $item, $expires_in_seconds = self::DISMISS_ITEM_PERMANENTLY ) {
		$items          = $this->get();
		$items[ $item ] = $expires_in_seconds ? time() + $expires_in_seconds : 0;

		$this->set( $items );
	}

	/**
	 * Removes one or more items from the list of dismissed items.
	 *
	 * @since 1.107.0
	 *
	 * @param string $item Item to remove.
	 */
	public function remove( $item ) {
		$items = $this->get();

		// If the item is not in dismissed items, there's nothing to do.
		if ( ! array_key_exists( $item, $items ) ) {
			return;
		}

		unset( $items[ $item ] );

		$this->set( $items );
	}

	/**
	 * Gets the value of the setting.
	 *
	 * @since 1.37.0
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
	 * @since 1.37.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'array';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.37.0
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array();
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.37.0
	 *
	 * @return callable Sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return function ( $items ) {
			return $this->filter_dismissed_items( $items );
		};
	}

	/**
	 * Determines whether the item is dismissed.
	 *
	 * @since 1.37.0
	 *
	 * @param string $item The item to check.
	 * @return bool TRUE if item is dismissed, otherwise FALSE.
	 */
	public function is_dismissed( $item ) {
		$items = $this->get();
		if ( ! array_key_exists( $item, $items ) ) {
			return false;
		}

		$ttl = $items[ $item ];
		if ( $ttl > 0 && $ttl < time() ) {
			return false;
		}

		return true;
	}

	/**
	 * Gets dismissed items.
	 *
	 * @since 1.37.0
	 *
	 * @return array Dismissed items array.
	 */
	public function get_dismissed_items() {
		$dismissed_items = $this->get();
		$dismissed_items = $this->filter_dismissed_items( $dismissed_items );

		return array_keys( $dismissed_items );
	}

	/**
	 * Filters dismissed items.
	 *
	 * @since 1.37.0
	 *
	 * @param array $items Dismissed items list.
	 * @return array Filtered dismissed items.
	 */
	private function filter_dismissed_items( $items ) {
		$dismissed = array();

		if ( is_array( $items ) ) {
			foreach ( $items as $item => $ttl ) {
				if ( self::DISMISS_ITEM_PERMANENTLY === $ttl || $ttl > time() ) {
					$dismissed[ $item ] = $ttl;
				}
			}
		}

		return $dismissed;
	}

}
