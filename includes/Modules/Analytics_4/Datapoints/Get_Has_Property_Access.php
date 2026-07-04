<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Has_Property_Access
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
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\RunReportRequest as Google_Service_AnalyticsData_RunReportRequest;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\DateRange as Google_Service_AnalyticsData_DateRange;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Dimension as Google_Service_AnalyticsData_Dimension;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Metric as Google_Service_AnalyticsData_Metric;

/**
 * Has property access datapoint.
 *
 * @since 1.177.0
 * @access private
 * @ignore
 */
class Get_Has_Property_Access extends Datapoint implements Executable_Datapoint {

	/**
	 * Creates a request object.
	 *
	 * @since 1.177.0
	 *
	 * @param Data_Request $data Data request object.
	 * @return mixed Request object on success, or WP_Error on failure.
	 * @throws Missing_Required_Param_Exception Thrown if a required parameter is missing.
	 */
	public function create_request( Data_Request $data ) {
		if ( ! isset( $data['propertyID'] ) ) {
			throw new Missing_Required_Param_Exception( 'propertyID' );
		}

		// A simple way to check for property access is to attempt a minimal report request.
		// If the user does not have access, this will return a 403 error.
		$request = new Google_Service_AnalyticsData_RunReportRequest();
		$request->setDimensions( array( new Google_Service_AnalyticsData_Dimension( array( 'name' => 'date' ) ) ) );
		$request->setMetrics( array( new Google_Service_AnalyticsData_Metric( array( 'name' => 'sessions' ) ) ) );
		$request->setDateRanges(
			array(
				new Google_Service_AnalyticsData_DateRange(
					array(
						'start_date' => 'yesterday',
						'end_date'   => 'today',
					)
				),
			)
		);
		$request->setLimit( 0 );

		return $this->get_service()->properties->runReport(
			Analytics_4::normalize_property_id( $data['propertyID'] ),
			$request
		);
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.177.0
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data     Data request object.
	 * @return mixed The original response without any modifications.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}
}
