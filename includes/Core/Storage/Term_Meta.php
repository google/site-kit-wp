<?php
/**
 * Class Google\Site_Kit\Core\Storage\Term_Meta
 *
 * @package   Google\Site_Kit\Core\Storage
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

/**
 * Term metadata storage class.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Term_Meta implements Meta_Interface {

	/**
	 * Gets term meta.
	 *
	 * @since n.e.x.t
	 *
	 * @param int    $term_id Term ID.
	 * @param string $key     Metadata key.
	 * @param bool   $single  Whether to return a single value.
	 * @return mixed Term meta value.
	 */
	public function get( $term_id, $key, $single = false ) {
		return get_term_meta( $term_id, $key, $single );
	}

	/**
	 * Updates a term meta field based on the given term ID.
	 *
	 * @since n.e.x.t
	 *
	 * @param int    $term_id    Term ID.
	 * @param string $key        Metadata key.
	 * @param mixed  $value      Metadata value.
	 * @param mixed  $prev_value Previous value to check before updating. If specified, only update existing metadata entries with this value. Otherwise, update all entries.
	 * @return bool TRUE on success, otherwise FALSE.
	 */
	public function update( $term_id, $key, $value, $prev_value = '' ) {
		return update_term_meta( $term_id, $key, $value, $prev_value );
	}

	/**
	 * Adds a meta field to the given term.
	 *
	 * @since n.e.x.t
	 *
	 * @param int    $term_id Term ID.
	 * @param string $key     Metadata key.
	 * @param mixed  $value   Metadata value.
	 * @param bool   $unique  Whether the same key should not be added.
	 * @return int|bool Meta id on success, otherwise FALSE.
	 */
	public function add( $term_id, $key, $value, $unique = false ) {
		return add_term_meta( $term_id, $key, $value, $unique );
	}

	/**
	 * Deletes a term meta field for the given term ID.
	 *
	 * @since n.e.x.t
	 *
	 * @param int    $term_id Term ID.
	 * @param string $key     Metadata key.
	 * @param mixed  $value   Metadata value. If provided, rows will only be removed that match the value.
	 * @return bool TRUE on success, otherwise FALSE.
	 */
	public function delete( $term_id, $key, $value = '' ) {
		return delete_term_meta( $term_id, $key, $value );
	}
}
