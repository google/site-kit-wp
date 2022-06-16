<?php
/**
 * Class Google\Site_Kit\Core\Util\Collection_Key_Cap_Filter
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Class for filtering a specific key of a collection based on a capability.
 *
 * @since 1.77.0
 * @access private
 * @ignore
 */
class Collection_Key_Cap_Filter {

	/**
	 * Collection key.
	 *
	 * @since 1.77.0
	 * @var string
	 */
	private $key;

	/**
	 * Capability.
	 *
	 * @since 1.77.0
	 * @var string
	 */
	private $cap;

	/**
	 * Constructor.
	 *
	 * @since 1.77.0.
	 *
	 * @param string $key        Target collection key to filter.
	 * @param string $capability Required capability to filter by.
	 */
	public function __construct( $key, $capability ) {
		$this->key = $key;
		$this->cap = $capability;
	}

	/**
	 * Filters the given value of a specific key in each item of the given collection
	 * based on the key and capability.
	 *
	 * @since 1.77.0
	 *
	 * @param array[] $collection Array of arrays.
	 * @return array[] Filtered collection.
	 */
	public function filter_key_by_cap( array $collection ) {
		foreach ( $collection as $meta_arg => &$value ) {
			if ( ! current_user_can( $this->cap, $meta_arg ) ) {
				unset( $value[ $this->key ] );
			}
		}
		return $collection;
	}
}
