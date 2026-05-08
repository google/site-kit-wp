<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Enhanced_Measurement_Settings
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
 * Class for the enhanced measurement settings read datapoint.
 *
 * @since 1.176.0
 * @access private
 * @ignore
 */
class Get_Enhanced_Measurement_Settings extends Datapoint implements Executable_Datapoint {

	/**
	 * Creates a request object.
	 *
	 * @since 1.176.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object on success, or WP_Error on failure.
	 */
	public function create_request( Data_Request $data_request ) {
		if ( ! isset( $data_request->data['propertyID'] ) ) {
			return new WP_Error(
				'missing_required_param',
				/* translators: %s: Missing parameter name */
				sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'propertyID' ),
				array( 'status' => 400 )
			);
		}

		if ( ! isset( $data_request->data['webDataStreamID'] ) ) {
			return new WP_Error(
				'missing_required_param',
				/* translators: %s: Missing parameter name */
				sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'webDataStreamID' ),
				array( 'status' => 400 )
			);
		}

		$name = Analytics_4::normalize_property_id(
			$data_request->data['propertyID']
		) . '/dataStreams/' . $data_request->data['webDataStreamID'] . '/enhancedMeasurementSettings';

		return $this->get_service()
			->properties_dataStreams // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			->getEnhancedMeasurementSettings( $name );
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.176.0
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data     Data request object.
	 * @return mixed
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}
}
