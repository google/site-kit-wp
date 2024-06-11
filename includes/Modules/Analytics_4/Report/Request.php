<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Report\Request
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Report
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Report;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Validation\Exception\Invalid_Report_Dimensions_Exception;
use Google\Site_Kit\Modules\Analytics_4\Report;
use Google\Site_Kit\Modules\Analytics_4\Report\RequestHelpers;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\RunReportRequest as Google_Service_AnalyticsData_RunReportRequest;
use WP_Error;

/**
 * Class for Analytics 4 report requests.
 *
 * @since 1.99.0
 * @access private
 * @ignore
 */
class Request extends Report {

	/**
	 * Creates and executes a new Analytics 4 report request.
	 *
	 * @since 1.99.0
	 *
	 * @param Data_Request $data           Data request object.
	 * @param bool         $is_shared_request Determines whether the current request is shared or not.
	 * @return RequestInterface|WP_Error Request object on success, or WP_Error on failure.
	 */
	public function create_request( Data_Request $data, $is_shared_request ) {
		$request_helpers = new RequestHelpers( $this->context );

		$request = new Google_Service_AnalyticsData_RunReportRequest();
		$request->setMetricAggregations( array( 'TOTAL', 'MINIMUM', 'MAXIMUM' ) );

		if ( ! empty( $data['limit'] ) ) {
			$request->setLimit( $data['limit'] );
		}

		$dimensions = $this->parse_dimensions( $data );
		if ( ! empty( $dimensions ) ) {
			if ( $is_shared_request ) {
				try {
					$request_helpers->validate_shared_dimensions( $dimensions );
				} catch ( Invalid_Report_Dimensions_Exception $exception ) {
					return new WP_Error(
						'invalid_analytics_4_report_dimensions',
						$exception->getMessage()
					);
				}
			}

			$request->setDimensions( (array) $dimensions );
		}

		$request = $request_helpers->shared_create_request( $data, $request, $is_shared_request );

		$orderby = $this->parse_orderby( $data );
		if ( ! empty( $orderby ) ) {
			$request->setOrderBys( $orderby );
		}

		return $request;
	}
}
