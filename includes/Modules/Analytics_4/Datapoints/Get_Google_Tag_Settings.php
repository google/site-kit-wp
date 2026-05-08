<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Google_Tag_Settings
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\Modules\Datapoint;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use WP_Error;

/**
 * Class for the Google Tag settings datapoint.
 *
 * @since 1.177.0
 * @access private
 * @ignore
 */
class Get_Google_Tag_Settings extends Datapoint implements Executable_Datapoint {

	/**
	 * Creates a request object.
	 *
	 * @since 1.177.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object on success, or WP_Error on failure.
	 */
	public function create_request( Data_Request $data_request ) {
		if ( ! isset( $data_request['measurementID'] ) ) {
			return new WP_Error(
				'missing_required_param',
				/* translators: %s: Missing parameter name */
				sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'measurementID' ),
				array( 'status' => 400 )
			);
		}

		return $this->get_service()
			->accounts_containers
			->lookup( array( 'destinationId' => $data_request['measurementID'] ) );
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.177.0
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data     Data request object.
	 * @return array Parsed Google Tag settings.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return array(
			'googleTagAccountID'   => $response->getAccountId(),
			'googleTagContainerID' => $response->getContainerId(),
			'googleTagID'          => $this->determine_google_tag_id_from_tag_ids( $response->getTagIds(), $data['measurementID'] ),
		);
	}

	/**
	 * Determines Google Tag ID from the given Tag IDs.
	 *
	 * @since 1.177.0
	 *
	 * @param array  $tag_ids        Tag IDs.
	 * @param string $measurement_id Measurement ID.
	 * @return string Google Tag ID.
	 */
	private function determine_google_tag_id_from_tag_ids( $tag_ids, $measurement_id ) {
		// If there is only one tag id in the array, return it.
		if ( count( $tag_ids ) === 1 ) {
			return $tag_ids[0];
		}

		// If there are multiple tags, return the first one that starts with `GT-`.
		foreach ( $tag_ids as $tag_id ) {
			if ( substr( $tag_id, 0, 3 ) === 'GT-' ) { // strlen( 'GT-' ) === 3.
				return $tag_id;
			}
		}

		// Otherwise, return the `$measurement_id` if it is in the array.
		if ( in_array( $measurement_id, $tag_ids, true ) ) {
			return $measurement_id;
		}

		// Otherwise, return the first one that starts with `G-`.
		foreach ( $tag_ids as $tag_id ) {
			if ( substr( $tag_id, 0, 2 ) === 'G-' ) { // strlen( 'G-' ) === 2.
				return $tag_id;
			}
		}

		// If none of the above, return the first one.
		return $tag_ids[0];
	}
}
