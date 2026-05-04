<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Property
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
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaProperty;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;

/**
 * Class for the single property retrieval datapoint.
 *
 * @since 1.178.0
 * @access private
 * @ignore
 */
class Get_Property extends Datapoint implements Executable_Datapoint {

	/**
	 * Creates a request object.
	 *
	 * @since 1.178.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @throws Missing_Required_Param_Exception Thrown if a required parameter is missing.
	 * @return RequestInterface Request object.
	 */
	public function create_request( Data_Request $data_request ) {
		if ( empty( $data_request->data['propertyID'] ) ) {
			throw new Missing_Required_Param_Exception( 'propertyID' );
		}

		/**
		 * Google Analytics Admin service instance.
		 *
		 * @var GoogleAnalyticsAdmin $service
		 */
		$service = $this->get_service();

		return $service->properties->get(
			Analytics_4::normalize_property_id( $data_request->data['propertyID'] )
		);
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.178.0
	 *
	 * @param GoogleAnalyticsAdminV1betaProperty $response Property resource from the Admin API.
	 * @param Data_Request                       $data     Data request object.
	 * @return \stdClass Updated model with _id and _accountID attributes.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return Analytics_4::filter_property_with_ids( $response );
	}
}
