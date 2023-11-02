<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Report\Custom_Dimensions_Response_Parser
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Report
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Report;

use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\RunReportResponse as Google_Service_AnalyticsData_RunReportResponse;

/**
 * Class for swapping custom dimension IDs with their display names.
 *
 * @since 1.113.0
 * @access private
 * @ignore
 */
class Custom_Dimensions_Response_Parser {

	/**
	 * Cache display name results.
	 *
	 * @since 1.113.0
	 * @var array
	 */
	protected $cache_map = array(
		Analytics_4::CUSTOM_DIMENSION_POST_AUTHOR     => array(),
		Analytics_4::CUSTOM_DIMENSION_POST_CATEGORIES => array(),
	);

	/**
	 * Gets the display name for a given user ID.
	 *
	 * If no user is found for a given user ID, the original user ID is
	 * returned. If a user is found, the display name is cached when processing
	 * the same response.
	 *
	 * @since 1.113.0
	 *
	 * @param string|int $user_id User ID of the user to get the display name of.
	 * @return string|int Display name of the user or their original ID if no name is found.
	 */
	protected function get_post_author_name( $user_id ) {
		if ( ! is_numeric( $user_id ) ) {
			return $user_id;
		}

		if ( ! isset( $this->cache_map[ Analytics_4::CUSTOM_DIMENSION_POST_AUTHOR ][ $user_id ] ) ) {
			$user = get_userdata( $user_id );
			$this->cache_map[ Analytics_4::CUSTOM_DIMENSION_POST_AUTHOR ][ $user_id ] = isset( $user->display_name ) ? $user->display_name : $user_id;
		}

		return $this->cache_map[ Analytics_4::CUSTOM_DIMENSION_POST_AUTHOR ][ $user_id ];
	}

	/**
	 * Converts a string list of category IDs to a stringified array of their
	 * category names.
	 *
	 * If no category is found for a given ID, the original ID is preserved in
	 * the returned string.
	 *
	 * @since 1.113.0
	 *
	 * @param string $category_ids_string Comma separated string list of IDs of categories to get names of.
	 * @return string JSON encoded string of comma separated category names (or their original IDs if no name is found).
	 */
	protected function get_post_category_names( $category_ids_string ) {
		$category_ids = explode( ',', $category_ids_string );

		// Explode converts all split values to strings. So we cast any numeric
		// strings to `int` so that if a display name is not found for a
		// category_id, then the original category_id int can be passed
		// through directly in the response.
		$category_ids = array_map(
			function ( $id ) {
				return is_numeric( $id ) ? (int) $id : $id;
			},
			$category_ids
		);

		$category_names = array();
		foreach ( $category_ids as $category_id ) {
			if ( ! is_numeric( $category_id ) ) {
				$category_names[] = $category_id;
				continue;
			}

			if ( ! isset( $this->cache_map[ Analytics_4::CUSTOM_DIMENSION_POST_CATEGORIES ][ $category_id ] ) ) {
				$term = get_term( $category_id );
				$this->cache_map[ Analytics_4::CUSTOM_DIMENSION_POST_CATEGORIES ][ $category_id ] = isset( $term->name ) ? $term->name : $category_id;
			}

			$category_names[] = $this->cache_map[ Analytics_4::CUSTOM_DIMENSION_POST_CATEGORIES ][ $category_id ];
		}

		return wp_json_encode( $category_names );
	}

	/**
	 * Swaps the IDs of any custom dimensions within the response with their respective display names.
	 *
	 * @since 1.113.0
	 *
	 * @param Google_Service_AnalyticsData_RunReportResponse $response The response to swap values in.
	 * @return void Swaps the IDs of custom dimensions within the given response instance.
	 */
	public function swap_custom_dimension_ids_with_names( $response ) {
		if ( $response->getRowCount() === 0 ) {
			return;
		}

		$dimension_headers = $response->getDimensionHeaders();

		// Create a map of any custom dimension to its equivalent parsing function to avoid
		// looping through report rows multiple times below.
		$custom_dimension_map = array();
		foreach ( $dimension_headers as $dimension_key => $dimension ) {
			if ( Analytics_4::CUSTOM_EVENT_PREFIX . Analytics_4::CUSTOM_DIMENSION_POST_AUTHOR === $dimension['name'] ) {
				$custom_dimension_map[ $dimension_key ] = array( $this, 'get_post_author_name' );
			}

			if ( Analytics_4::CUSTOM_EVENT_PREFIX . Analytics_4::CUSTOM_DIMENSION_POST_CATEGORIES === $dimension['name'] ) {
				$custom_dimension_map[ $dimension_key ] = array( $this, 'get_post_category_names' );
			}
		}

		if ( empty( $custom_dimension_map ) ) {
			return;
		}

		$rows = $response->getRows();

		foreach ( $rows as $row ) {
			foreach ( $custom_dimension_map as $dimension_key => $callable ) {
				$dimension_value     = $row['dimensionValues'][ $dimension_key ]->getValue();
				$new_dimension_value = call_user_func( $callable, $dimension_value );
				$row['dimensionValues'][ $dimension_key ]->setValue( $new_dimension_value );
			}
		}

		$response->setRows( $rows );
	}

}
