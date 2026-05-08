<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Update_Enhanced_Measurement_Settings
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
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdminV1alpha\GoogleAnalyticsAdminV1alphaEnhancedMeasurementSettings;
use WP_Error;

/**
 * Class for the enhanced measurement settings update datapoint.
 *
 * @since 1.176.0
 * @access private
 * @ignore
 */
class Update_Enhanced_Measurement_Settings extends Datapoint implements Executable_Datapoint {

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

		if ( ! isset( $data_request->data['enhancedMeasurementSettings'] ) ) {
			return new WP_Error(
				'missing_required_param',
				/* translators: %s: Missing parameter name */
				sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'enhancedMeasurementSettings' ),
				array( 'status' => 400 )
			);
		}

		$enhanced_measurement_settings = $data_request->data['enhancedMeasurementSettings'];

		$fields = array(
			'name',
			'streamEnabled',
			'scrollsEnabled',
			'outboundClicksEnabled',
			'siteSearchEnabled',
			'videoEngagementEnabled',
			'fileDownloadsEnabled',
			'pageChangesEnabled',
			'formInteractionsEnabled',
			'searchQueryParameter',
			'uriQueryParameter',
		);

		$invalid_keys = array_diff( array_keys( $enhanced_measurement_settings ), $fields );

		if ( ! empty( $invalid_keys ) ) {
			return new WP_Error(
				'invalid_property_name',
				/* translators: %s: Invalid property names */
				sprintf( __( 'Invalid properties in enhancedMeasurementSettings: %s.', 'google-site-kit' ), implode( ', ', $invalid_keys ) ),
				array( 'status' => 400 )
			);
		}

		$name = Analytics_4::normalize_property_id(
			$data_request->data['propertyID']
		) . '/dataStreams/' . $data_request->data['webDataStreamID'] . '/enhancedMeasurementSettings';

		$post_body = new GoogleAnalyticsAdminV1alphaEnhancedMeasurementSettings(
			$data_request->data['enhancedMeasurementSettings']
		);

		return $this->get_service()
			->properties_dataStreams // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			->updateEnhancedMeasurementSettings(
				$name,
				$post_body,
				array(
					'updateMask' => 'streamEnabled',
				)
			);
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
