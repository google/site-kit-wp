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
	 * If no user is found for a given user ID, the original user ID is
	 * returned.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $user_id User ID of the user to get the display name of.
	 * @return string|int Display name of the user or their original ID if no name is found.
	 */
	public static function get_user_display_name( $user_id ) {
		$user = get_userdata( $user_id );
		if ( ! $user ) {
			return $user_id;
		}
		return $user->display_name;
	}

	/**
	 * Gets the term names for a given array of term IDs.
	 *
	 * If no term is found for a given term ID, the original term ID is
	 * returned.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $term_id Term ID of the term to get the name of.
	 * @return string|int Display name or their original ID if no name is found.
	 */
	public static function get_term_name( $term_id ) {
		$term = get_term( $term_id );
		if ( ! $term ) {
			return $term_id;
		}
		return $term->name;
	}

}
