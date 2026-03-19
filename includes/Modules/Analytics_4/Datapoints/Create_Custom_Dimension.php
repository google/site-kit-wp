<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Create_Custom_Dimension
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
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaCustomDimension;
use WP_Error;

/**
 * Class for the custom dimension creation datapoint.
 *
 * @since 1.175.0
 * @access private
 * @ignore
 */
class Create_Custom_Dimension extends Datapoint implements Executable_Datapoint {

	/**
	 * Creates a request object.
	 *
	 * @since 1.175.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object on success, or WP_Error on failure.
	 * @throws Missing_Required_Param_Exception Thrown if a required parameter is missing.
	 */
	public function create_request( Data_Request $data_request ) {
		if ( ! isset( $data_request->data['propertyID'] ) ) {
			throw new Missing_Required_Param_Exception( 'propertyID' );
		}

		if ( ! isset( $data_request->data['customDimension'] ) ) {
			throw new Missing_Required_Param_Exception( 'customDimension' );
		}

		$custom_dimension_data = $data_request->data['customDimension'];

		$fields = array(
			'parameterName',
			'displayName',
			'description',
			'scope',
			'disallowAdsPersonalization',
		);

		$invalid_keys = array_diff( array_keys( $custom_dimension_data ), $fields );

		if ( ! empty( $invalid_keys ) ) {
			return new WP_Error(
				'invalid_property_name',
				/* translators: %s: Invalid property names */
				sprintf( __( 'Invalid properties in customDimension: %s.', 'google-site-kit' ), implode( ', ', $invalid_keys ) ),
				array( 'status' => 400 )
			);
		}

		$valid_scopes = array( 'EVENT', 'USER', 'ITEM' );

		if ( ! isset( $custom_dimension_data['scope'] ) ) {
			$custom_dimension_data['scope'] = 'EVENT';
		} elseif ( ! in_array( $custom_dimension_data['scope'], $valid_scopes, true ) ) {
			return new WP_Error(
				'invalid_scope',
				/* translators: %s: Invalid scope */
				sprintf( __( 'Invalid scope: %s.', 'google-site-kit' ), $custom_dimension_data['scope'] ),
				array( 'status' => 400 )
			);
		}

		$custom_dimension = new GoogleAnalyticsAdminV1betaCustomDimension();
		$custom_dimension->setParameterName( $custom_dimension_data['parameterName'] );
		$custom_dimension->setDisplayName( $custom_dimension_data['displayName'] );
		$custom_dimension->setScope( $custom_dimension_data['scope'] );

		if ( isset( $custom_dimension_data['description'] ) ) {
			$custom_dimension->setDescription( $custom_dimension_data['description'] );
		}

		if ( isset( $custom_dimension_data['disallowAdsPersonalization'] ) ) {
			$custom_dimension->setDisallowAdsPersonalization( $custom_dimension_data['disallowAdsPersonalization'] );
		}

		return $this->get_service()
			->properties_customDimensions // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			->create(
				Analytics_4::normalize_property_id( $data_request->data['propertyID'] ),
				$custom_dimension
			);
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.175.0
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data     Data request object.
	 * @return mixed The original response without any modifications.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}
}
