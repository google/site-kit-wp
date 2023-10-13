<?php
/**
 * Class Google\Site_Kit\Core\Util\WP_Entity_Helpers
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Utility class for fetching meta data for posts.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class WP_Entity_Helpers {

	/**
	 * Gets the display name for a given user ID.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $user_id User ID of the user to get the display name of.
	 * @return string Display name of the user for the given user ID.
	 */
	public static function get_user_display_name( $user_id ) {
		$user = get_userdata( $user_id );
		return $user->display_name;
	}

	/**
	 * Gets the category names for a given array of category IDs.
	 *
	 * If no category is found for a given ID, the original ID is preserved in
	 * the returned array.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $category_ids Array of IDs of categories to get names of.
	 * @return array Array of category names (or their original IDs if no name is found).
	 */
	public static function get_category_names( $category_ids ) {
		$category_names = array();
		foreach ( $category_ids as $category_id ) {
			$category_name    = get_cat_name( $category_id );
			$category_names[] = empty( $category_name ) ? $category_id : $category_name;
		}
		return $category_names;
	}

	/**
	 * Converts a string list of category IDs to a stringified array of their
	 * category names.
	 *
	 * If no category is found for a given ID, the original ID is preserved in
	 * the returned string.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $category_ids_string Comma separated string list of IDs of categories to get names of.
	 * @return string JSON encoded string of comma separated category names (or their original IDs if no name is found).
	 */
	public static function parse_category_names( $category_ids_string ) {
		$category_ids = json_decode( '[' . $category_ids_string . ']', true );

		$category_names = self::get_category_names( $category_ids );

		return wp_json_encode( $category_names );
	}

}
