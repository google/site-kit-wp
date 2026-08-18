<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Get_Terms_Of_Service
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints;

use Google\Site_Kit\Core\Modules\Datapoint;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use WP_Error;

/**
 * Class for the Terms of Service retrieval datapoint.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Get_Terms_Of_Service extends Datapoint implements Executable_Datapoint {

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return callable Closure that retrieves the Terms of Service.
	 * @throws Missing_Required_Param_Exception Thrown if the ToS URL is missing.
	 */
	public function create_request( Data_Request $data_request ) {
		if ( empty( $data_request['tosURL'] ) ) {
			throw new Missing_Required_Param_Exception( 'tosURL' );
		}

		$tos_url = $data_request['tosURL'];

		return function () use ( $tos_url ) {
			$response = wp_safe_remote_get( $tos_url );

			if ( is_wp_error( $response ) ) {
				return $response;
			}

			$status_code = wp_remote_retrieve_response_code( $response );
			if ( $status_code < 200 || 299 < $status_code ) {
				return new WP_Error(
					'terms_of_service_request_failed',
					__( 'The Terms of Service could not be retrieved.', 'google-site-kit' ),
					array( 'status' => $status_code )
				);
			}

			return $response;
		};
	}

	/**
	 * Parses a response.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed        $response WordPress HTTP API response.
	 * @param Data_Request $data     Data request object.
	 * @return string Terms of Service HTML.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return wp_remote_retrieve_body( $response );
	}
}
