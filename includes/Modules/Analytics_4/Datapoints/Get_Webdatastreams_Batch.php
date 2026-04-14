<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Webdatastreams_Batch
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
use Google\Site_Kit\Modules\Analytics_4;
use WP_Error;

/**
 * Class for the batch web data streams listing datapoint.
 *
 * @since 1.176.0
 * @access private
 * @ignore
 */
class Get_Webdatastreams_Batch extends Datapoint implements Executable_Datapoint {

	/**
	 * Creates a request object.
	 *
	 * @since 1.176.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object on success, or WP_Error on failure.
	 */
	public function create_request( Data_Request $data_request ) {
		if ( ! isset( $data_request->data['propertyIDs'] ) ) {
			return new WP_Error(
				'missing_required_param',
				/* translators: %s: Missing parameter name */
				sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'propertyIDs' ),
				array( 'status' => 400 )
			);
		}

		if ( ! is_array( $data_request->data['propertyIDs'] ) || count( $data_request->data['propertyIDs'] ) > 10 ) {
			return new WP_Error(
				'rest_invalid_param',
				/* translators: %s: List of invalid parameters. */
				sprintf( __( 'Invalid parameter(s): %s', 'google-site-kit' ), 'propertyIDs' ),
				array( 'status' => 400 )
			);
		}

		$analyticsadmin = $this->get_service();
		$batch_request  = $analyticsadmin->createBatch();

		foreach ( $data_request->data['propertyIDs'] as $property_id ) {
			$batch_request->add(
				$analyticsadmin
					->properties_dataStreams // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					->listPropertiesDataStreams(
						Analytics_4::normalize_property_id( $property_id )
					)
			);
		}

		return function () use ( $batch_request ) {
			return $batch_request->execute();
		};
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.176.0
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data     Data request object.
	 * @return array
	 */
	public function parse_response( $response, Data_Request $data ) {
		return Analytics_4::parse_webdatastreams_batch( $response );
	}
}
