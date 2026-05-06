<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Properties
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
use Google\Site_Kit\Core\Util\Sort;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaListPropertiesResponse;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;

/**
 * Class for the properties listing datapoint.
 *
 * @since 1.178.0
 * @access private
 * @ignore
 */
class Get_Properties extends Datapoint implements Executable_Datapoint {

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
		if ( empty( $data_request->data['accountID'] ) ) {
			throw new Missing_Required_Param_Exception( 'accountID' );
		}

		/**
		 * Google Analytics Admin service instance.
		 *
		 * @var GoogleAnalyticsAdmin $service
		 */
		$service = $this->get_service();

		return $service->properties->listProperties(
			array(
				'filter'   => 'parent:' . Analytics_4::normalize_account_id( $data_request->data['accountID'] ),
				'pageSize' => 200,
			)
		);
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.178.0
	 *
	 * @param GoogleAnalyticsAdminV1betaListPropertiesResponse $response List properties API response.
	 * @param Data_Request                                     $data     Data request object.
	 * @return array
	 */
	public function parse_response( $response, Data_Request $data ) {
		return Sort::case_insensitive_list_sort(
			array_map( array( Analytics_4::class, 'filter_property_with_ids' ), $response->getProperties() ),
			'displayName'
		);
	}
}
