<?php
/**
 * Interface Google\Site_Kit\Core\Storage\Meta_Interface
 *
 * @package   Google\Site_Kit\Core\Storage
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

/**
 * Interface for object meta implementations.
 *
 * @since 1.33.0
 * @since 1.146.0 Renamed from Post_Meta_Interface to Meta_Interface.
 *
 * @access private
 * @ignore
 */
interface Meta_Interface {

	/**
	 * Gets object meta.
	 *
	 * @since 1.33.0
	 *
	 * @param int    $object_id Object ID.
	 * @param string $key       Metadata key.
	 * @param bool   $single    Whether to return a single value.
	 * @return mixed Object meta value.
	 */
	public function get( $object_id, $key, $single = false );

	/**
	 * Updates an object meta field based on the given object ID.
	 *
	 * @since 1.33.0
	 *
	 * @param int    $object_id Object ID.
	 * @param string $key       Metadata key.
	 * @param mixed  $value     Metadata value.
	 * @param mixed  $prev_value Previous value to check before updating. If specified, only update existing metadata entries with this value. Otherwise, update all entries.
	 * @return bool TRUE on success, otherwise FALSE.
	 */
	public function update( $object_id, $key, $value, $prev_value = '' );

	/**
	 * Adds a meta field to the given object.
	 *
	 * @since 1.33.0
	 *
	 * @param int    $object_id Object ID.
	 * @param string $key       Metadata key.
	 * @param mixed  $value     Metadata value.
	 * @param bool   $unique    Whether the same key should not be added.
	 * @return int|bool Meta id on success, otherwise FALSE.
	 */
	public function add( $object_id, $key, $value, $unique = false );

	/**
	 * Deletes an object meta field for the given object ID.
	 *
	 * @since 1.33.0
	 *
	 * @param int    $object_id Object ID.
	 * @param string $key       Metadata key.
	 * @param mixed  $value     Metadata value. If provided, rows will only be removed that match the value.
	 * @return bool TRUE on success, otherwise FALSE.
	 */
	public function delete( $object_id, $key, $value = '' );
}
