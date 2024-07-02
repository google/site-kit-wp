<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Report\PivotRequest
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Report
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Report;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Validation\Exception\Invalid_Report_Dimensions_Exception;
use Google\Site_Kit\Modules\Analytics_4\PivotReport;
use Google\Site_Kit\Modules\Analytics_4\Report\RequestHelpers;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\RunPivotReportRequest as Google_Service_AnalyticsData_RunPivotReportRequest;
use WP_Error;

/**
 * Class for Analytics 4 pivot report requests.
 *
 * @since 1.130.0
 * @access private
 * @ignore
 */
class PivotRequest extends PivotReport {

	/**
	 * Creates and executes a new Analytics 4 pivot report request.
	 *
	 * @since 1.130.0
	 *
	 * @param Data_Request $data           Data request object.
	 * @param bool         $is_shared_request Determines whether the current request is shared or not.
	 * @return Google_Service_AnalyticsData_RunReportRequest|Google_Service_AnalyticsData_RunPivotReportRequest|WP_Error Request object on success, or WP_Error on failure.
	 */
	public function create_request( Data_Request $data, $is_shared_request ) {
		$request_helpers = new RequestHelpers( $this->context );

		$request = new Google_Service_AnalyticsData_RunPivotReportRequest();

		$dimensions = $this->parse_dimensions( $data );

		// The hostName dimension must be added to every request because
		// we add a dimension filter in Analytics_4/Report/Request to
		// limit the data to the WordPress site URL.
		$dimensions[] = array( 'name' => 'hostName' );

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

		$pivots = $this->parse_pivots( $data );

		if ( ! empty( $pivots ) ) {
			$request->setPivots( $pivots );
		}

		return $request;
	}

}
