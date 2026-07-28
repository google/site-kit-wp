<?php
/**
 * Class Google\Site_Kit\Modules\AdSense\Datapoints\Get_Report
 *
 * @package   Google\Site_Kit\Modules\AdSense\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * phpcs:disable PHPCS.Commenting.RequireDocTagDescription -- Pre-existing violations; tracked for follow-up cleanup.
 */

namespace Google\Site_Kit\Modules\AdSense\Datapoints;

use GoogleSite_KitModulesAdSenseDatapointsAdSense_Datapoint;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Validation\Exception\Invalid_Report_Metrics_Exception;
use Google\Site_Kit\Core\Validation\Exception\Invalid_Report_Dimensions_Exception;
use WP_Error;

/**
 * Class for the report datapoint.
 *
 * @since 1.190.0
 * @access private
 * @ignore
 */
class Get_Report extends AdSense_Datapoint implements Executable_Datapoint {

	/**
	 * Creates a request object.
	 *
	 * @since 1.190.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object on success, or WP_Error on failure.
	 */
	public function create_request( Data_Request $data_request ) {
		$start_date = $data_request->data['startDate'] ?? '';
		$end_date   = $data_request->data['endDate'] ?? '';

		if ( ! strtotime( $start_date ) || ! strtotime( $end_date ) ) {
			$dates = $this->get_module()->date_range_to_dates( 'last-28-days' );
			if ( is_wp_error( $dates ) ) {
				return $dates;
			}

			list ( $start_date, $end_date ) = $dates;
		}

		$args = array(
			'start_date' => $start_date,
			'end_date'   => $end_date,
		);

		$metrics = $this->get_module()->parse_string_list( $data_request->data['metrics'] ?? '' );
		if ( ! empty( $metrics ) ) {
			if ( $this->get_module()->is_shared_data_request( $data_request ) ) {
				try {
					$this->get_module()->validate_shared_report_metrics( $metrics );
				} catch ( Invalid_Report_Metrics_Exception $exception ) {
					return new WP_Error(
						'invalid_adsense_report_metrics',
						$exception->getMessage()
					);
				}
			}

			$args['metrics'] = $metrics;
		}

		$dimensions = $this->get_module()->parse_string_list( $data_request->data['dimensions'] ?? '' );
		if ( ! empty( $dimensions ) ) {
			if ( $this->get_module()->is_shared_data_request( $data_request ) ) {
				try {
					$this->get_module()->validate_shared_report_dimensions( $dimensions );
				} catch ( Invalid_Report_Dimensions_Exception $exception ) {
					return new WP_Error(
						'invalid_adsense_report_dimensions',
						$exception->getMessage()
					);
				}
			}

			$args['dimensions'] = $dimensions;
		}

		$orderby = $this->get_module()->parse_earnings_orderby( $data_request->data['orderby'] ?? '' );
		if ( ! empty( $orderby ) ) {
			$args['sort'] = $orderby;
		}

		if ( ! empty( $data_request->data['limit'] ) ) {
			$args['limit'] = $data_request->data['limit'];
		}

		return $this->get_module()->create_adsense_earning_data_request( array_filter( $args ) );
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.190.0
	 *
	 * @param mixed        $response API response.
	 * @param Data_Request $data     Data request object.
	 * @return mixed Parsed response.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}
}
