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

use Google\Site_Kit\Modules\AdSense\Datapoints\AdSense_Datapoint;
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
	 * Callable to get date range.
	 *
	 * @since 1.190.0
	 * @var callable
	 */
	private $date_range_to_dates;

	/**
	 * Callable to parse string list.
	 *
	 * @since 1.190.0
	 * @var callable
	 */
	private $parse_string_list;

	/**
	 * Callable to check if shared data request.
	 *
	 * @since 1.190.0
	 * @var callable
	 */
	private $is_shared_data_request;

	/**
	 * Callable to validate shared report metrics.
	 *
	 * @since 1.190.0
	 * @var callable
	 */
	private $validate_shared_report_metrics;

	/**
	 * Callable to validate shared report dimensions.
	 *
	 * @since 1.190.0
	 * @var callable
	 */
	private $validate_shared_report_dimensions;

	/**
	 * Callable to parse earnings orderby.
	 *
	 * @since 1.190.0
	 * @var callable
	 */
	private $parse_earnings_orderby;

	/**
	 * Callable to create AdSense earning data request.
	 *
	 * @since 1.190.0
	 * @var callable
	 */
	private $create_adsense_earning_data_request;

	/**
	 * Constructor.
	 *
	 * @since 1.190.0
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		if ( isset( $definition['date_range_to_dates'] ) ) {
			$this->date_range_to_dates = $definition['date_range_to_dates'];
		}
		if ( isset( $definition['parse_string_list'] ) ) {
			$this->parse_string_list = $definition['parse_string_list'];
		}
		if ( isset( $definition['is_shared_data_request'] ) ) {
			$this->is_shared_data_request = $definition['is_shared_data_request'];
		}
		if ( isset( $definition['validate_shared_report_metrics'] ) ) {
			$this->validate_shared_report_metrics = $definition['validate_shared_report_metrics'];
		}
		if ( isset( $definition['validate_shared_report_dimensions'] ) ) {
			$this->validate_shared_report_dimensions = $definition['validate_shared_report_dimensions'];
		}
		if ( isset( $definition['parse_earnings_orderby'] ) ) {
			$this->parse_earnings_orderby = $definition['parse_earnings_orderby'];
		}
		if ( isset( $definition['create_adsense_earning_data_request'] ) ) {
			$this->create_adsense_earning_data_request = $definition['create_adsense_earning_data_request'];
		}
	}

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
			$dates = call_user_func( $this->date_range_to_dates, 'last-28-days' );
			if ( is_wp_error( $dates ) ) {
				return $dates;
			}

			list ( $start_date, $end_date ) = $dates;
		}

		$args = array(
			'start_date' => $start_date,
			'end_date'   => $end_date,
		);

		$metrics = call_user_func( $this->parse_string_list, $data_request->data['metrics'] ?? '' );
		if ( ! empty( $metrics ) ) {
			if ( call_user_func( $this->is_shared_data_request, $data_request ) ) {
				try {
					call_user_func( $this->validate_shared_report_metrics, $metrics );
				} catch ( Invalid_Report_Metrics_Exception $exception ) {
					return new WP_Error(
						'invalid_adsense_report_metrics',
						$exception->getMessage()
					);
				}
			}

			$args['metrics'] = $metrics;
		}

		$dimensions = call_user_func( $this->parse_string_list, $data_request->data['dimensions'] ?? '' );
		if ( ! empty( $dimensions ) ) {
			if ( call_user_func( $this->is_shared_data_request, $data_request ) ) {
				try {
					call_user_func( $this->validate_shared_report_dimensions, $dimensions );
				} catch ( Invalid_Report_Dimensions_Exception $exception ) {
					return new WP_Error(
						'invalid_adsense_report_dimensions',
						$exception->getMessage()
					);
				}
			}

			$args['dimensions'] = $dimensions;
		}

		$orderby = call_user_func( $this->parse_earnings_orderby, $data_request->data['orderby'] ?? '' );
		if ( ! empty( $orderby ) ) {
			$args['sort'] = $orderby;
		}

		if ( ! empty( $data_request->data['limit'] ) ) {
			$args['limit'] = $data_request->data['limit'];
		}

		return call_user_func( $this->create_adsense_earning_data_request, array_filter( $args ) );
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
