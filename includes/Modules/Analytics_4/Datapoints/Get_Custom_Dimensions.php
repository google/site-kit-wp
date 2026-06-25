<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Custom_Dimensions
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
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;

/**
 * Class for reading the Site Kit custom dimensions of a given property.
 *
 * Unlike `Sync_Custom_Dimensions`, this datapoint reads the property ID from
 * the request, so it can list the custom dimensions of a property that is not
 * yet saved in settings.
 *
 * @since 1.182.0
 * @access private
 * @ignore
 */
class Get_Custom_Dimensions extends Datapoint implements Executable_Datapoint {

	/**
	 * Creates a request object to list the custom dimensions of the requested property.
	 *
	 * @since 1.182.0
	 *
	 * @param Data_Request $data Data request object holding the `propertyID` to list custom dimensions for.
	 * @throws Missing_Required_Param_Exception Thrown if the `propertyID` parameter is missing.
	 * @return RequestInterface Request object.
	 */
	public function create_request( Data_Request $data ) {
		if ( empty( $data['propertyID'] ) ) {
			throw new Missing_Required_Param_Exception( 'propertyID' );
		}

		return $this->get_service()
			->properties_customDimensions // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			->listPropertiesCustomDimensions(
				Analytics_4::normalize_property_id( $data['propertyID'] )
			);
	}

	/**
	 * Parses a response into the list of Site Kit custom dimension names on the property.
	 *
	 * @since 1.182.0
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data     Data request object.
	 * @return mixed List of `googlesitekit_`-prefixed parameter names, or WP_Error on failure.
	 */
	public function parse_response( $response, Data_Request $data ) {
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$custom_dimensions = $response->getCustomDimensions();

		// The API leaves out the field when the property has no custom
		// dimensions, so check the value before reading the parameter names.
		if ( ! is_array( $custom_dimensions ) ) {
			return array();
		}

		$parameter_names = wp_list_pluck( $custom_dimensions, 'parameterName' );

		return array_values(
			array_filter(
				$parameter_names,
				fn( $dimension ) => strpos( $dimension, 'googlesitekit_' ) === 0
			)
		);
	}
}
