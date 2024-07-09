<?php
/**
 * Class Google\Site_Kit\Core\Storage\Post_Meta
 *
 * @package   Google\Site_Kit\Core\Storage
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

/**
 * Post metadata storage class.
 *
 * @since 1.33.0
 * @access private
 * @ignore
 */
final class Post_Meta implements Post_Meta_Interface {

	/**
	 * Gets post meta.
	 *
	 * @since 1.33.0
	 *
	 * @param int    $post_id Post ID.
	 * @param string $key     Metadata key.
	 * @param bool   $single  Whether to return a single value.
	 * @return mixed Post meta value.
	 */
	public function get( $post_id, $key, $single = false ) {
		return get_post_meta( $post_id, $key, $single );
	}

	/**
	 * Updates a post meta field based on the given post ID.
	 *
	 * @since 1.33.0
	 *
	 * @param int    $post_id    Post ID.
	 * @param string $key        Metadata key.
	 * @param mixed  $value      Metadata value.
	 * @param mixed  $prev_value Previous value to check before updating. If specified, only update existing metadata entries with this value. Otherwise, update all entries.
	 * @return bool TRUE on success, otherwise FALSE.
	 */
	public function update( $post_id, $key, $value, $prev_value = '' ) {
		return update_post_meta( $post_id, $key, $value, $prev_value );
	}

	/**
	 * Adds a meta field to the given post.
	 *
	 * @since 1.33.0
	 *
	 * @param int    $post_id Post ID.
	 * @param string $key     Metadata key.
	 * @param mixed  $value   Metadata value.
	 * @param bool   $unique  Whether the same key should not be added.
	 * @return int|bool Meta id on success, otherwise FALSE.
	 */
	public function add( $post_id, $key, $value, $unique = false ) {
		return add_post_meta( $post_id, $key, $value, $unique );
	}

	/**
	 * Deletes a post meta field for the given post ID.
	 *
	 * @since 1.33.0
	 *
	 * @param int    $post_id Post ID.
	 * @param string $key     Metadata key.
	 * @param mixed  $value   Metadata value. If provided, rows will only be removed that match the value.
	 * @return bool TRUE on success, otherwise FALSE.
	 */
	public function delete( $post_id, $key, $value = '' ) {
		return delete_post_meta( $post_id, $key, $value );
	}
}
