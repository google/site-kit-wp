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

use Google\Site_Kit\Core\Modules\Datapoint;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Util\Date;
use Google\Site_Kit\Core\Validation\Exception\Invalid_Report_Metrics_Exception;
use Google\Site_Kit\Core\Validation\Exception\Invalid_Report_Dimensions_Exception;
use WP_Error;

/**
 * Class for the report datapoint.
 *
 * @since 1.186.0
 * @access private
 * @ignore
 */
class Get_Report extends Datapoint implements Executable_Datapoint {

	/**
	 * Callable to check if shared data request.
	 *
	 * @since 1.186.0
	 * @var callable
	 */
	private $is_shared_data_request;

	/**
	 * Callable to create AdSense earning data request.
	 *
	 * @since 1.186.0
	 * @var callable
	 */
	private $create_adsense_earning_data_request;

	/**
	 * Constructor.
	 *
	 * @since 1.186.0
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		if ( isset( $definition['is_shared_data_request'] ) ) {
			$this->is_shared_data_request = $definition['is_shared_data_request'];
		}
		if ( isset( $definition['create_adsense_earning_data_request'] ) ) {
			$this->create_adsense_earning_data_request = $definition['create_adsense_earning_data_request'];
		}
	}

	/**
	 * Creates a request object.
	 *
	 * @since 1.186.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object on success, or WP_Error on failure.
	 */
	public function create_request( Data_Request $data_request ) {
		$start_date = $data_request->data['startDate'] ?? '';
		$end_date   = $data_request->data['endDate'] ?? '';

		if ( ! strtotime( $start_date ) || ! strtotime( $end_date ) ) {
			$dates = $this->date_range_to_dates( 'last-28-days' );
			if ( is_wp_error( $dates ) ) {
				return $dates;
			}

			list ( $start_date, $end_date ) = $dates;
		}

		$args = array(
			'start_date' => $start_date,
			'end_date'   => $end_date,
		);

		$metrics = $this->parse_string_list( $data_request->data['metrics'] ?? '' );
		if ( ! empty( $metrics ) ) {
			if ( call_user_func( $this->is_shared_data_request, $data_request ) ) {
				try {
					$this->validate_shared_report_metrics( $metrics );
				} catch ( Invalid_Report_Metrics_Exception $exception ) {
					return new WP_Error(
						'invalid_adsense_report_metrics',
						$exception->getMessage()
					);
				}
			}

			$args['metrics'] = $metrics;
		}

		$dimensions = $this->parse_string_list( $data_request->data['dimensions'] ?? '' );
		if ( ! empty( $dimensions ) ) {
			if ( call_user_func( $this->is_shared_data_request, $data_request ) ) {
				try {
					$this->validate_shared_report_dimensions( $dimensions );
				} catch ( Invalid_Report_Dimensions_Exception $exception ) {
					return new WP_Error(
						'invalid_adsense_report_dimensions',
						$exception->getMessage()
					);
				}
			}

			$args['dimensions'] = $dimensions;
		}

		$orderby = $this->parse_earnings_orderby( $data_request->data['orderby'] ?? '' );
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
	 * @since 1.186.0
	 *
	 * @param mixed        $response API response.
	 * @param Data_Request $data     Data request object.
	 * @return mixed Parsed response.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}

	/**
	 * Parses the string list into an array of strings.
	 *
	 * @since 1.186.0
	 *
	 * @param string|array $items Items to parse.
	 * @return array An array of string items.
	 */
	private function parse_string_list( $items ) {
		if ( is_string( $items ) ) {
			$items = explode( ',', $items );
		}

		if ( ! is_array( $items ) || empty( $items ) ) {
			return array();
		}

		$items = array_map(
			function ( $item ) {
				if ( ! is_string( $item ) ) {
					return false;
				}

				$item = trim( $item );
				if ( empty( $item ) ) {
					return false;
				}

				return $item;
			},
			$items
		);

		$items = array_filter( $items );
		$items = array_values( $items );

		return $items;
	}

	/**
	 * Gets an array of dates for the given named date range.
	 *
	 * @since 1.186.0
	 *
	 * @param string $date_range Named date range.
	 * @return array|WP_Error Array of [startDate, endDate] or WP_Error if invalid named range.
	 */
	private function date_range_to_dates( $date_range ) {
		switch ( $date_range ) {
			case 'today':
				return array(
					gmdate( 'Y-m-d', strtotime( 'today' ) ),
					gmdate( 'Y-m-d', strtotime( 'today' ) ),
				);
			// Intentional fallthrough.
			case 'last-7-days':
			case 'last-14-days':
			case 'last-28-days':
			case 'last-90-days':
				return Date::parse_date_range( $date_range );
		}

		return new WP_Error( 'invalid_date_range', __( 'Invalid date range.', 'google-site-kit' ) );
	}

	/**
	 * Parses the orderby value of the data request into an array of earning orderby format.
	 *
	 * @since 1.186.0
	 *
	 * @param array|null $orderby Data request orderby value.
	 * @return string[] An array of reporting orderby strings.
	 */
	private function parse_earnings_orderby( $orderby ) {
		if ( empty( $orderby ) || ! is_array( $orderby ) ) {
			return array();
		}

		$results = array_map(
			function ( $order_def ) {
				$order_def = array_merge(
					array(
						'fieldName' => '',
						'sortOrder' => '',
					),
					(array) $order_def
				);

				if ( empty( $order_def['fieldName'] ) || empty( $order_def['sortOrder'] ) ) {
					return null;
				}

				return ( 'ASCENDING' === $order_def['sortOrder'] ? '+' : '-' ) . $order_def['fieldName'];
			},
			// When just object is passed we need to convert it to an array of objects.
			wp_is_numeric_array( $orderby ) ? $orderby : array( $orderby )
		);

		$results = array_filter( $results );
		$results = array_values( $results );

		return $results;
	}

	/**
	 * Validates the report metrics for a shared request.
	 *
	 * @since 1.186.0
	 *
	 * @param string[] $metrics The metrics to validate.
	 * @throws Invalid_Report_Metrics_Exception Thrown if the metrics are invalid.
	 */
	private function validate_shared_report_metrics( $metrics ) {
		$valid_metrics = apply_filters(
			'googlesitekit_shareable_adsense_metrics',
			array(
				'ESTIMATED_EARNINGS',
				'IMPRESSIONS',
				'PAGE_VIEWS_CTR',
				'PAGE_VIEWS_RPM',
			)
		);

		$invalid_metrics = array_diff( $metrics, $valid_metrics );

		if ( count( $invalid_metrics ) > 0 ) {
			$message = count( $invalid_metrics ) > 1 ? sprintf(
				/* translators: %s: is replaced with a comma separated list of the invalid metrics. */
				__(
					'Unsupported metrics requested: %s',
					'google-site-kit'
				),
				join(
					/* translators: used between list items, there is a space after the comma. */
					__( ', ', 'google-site-kit' ),
					$invalid_metrics
				)
			) : sprintf(
				/* translators: %s: is replaced with the invalid metric. */
				__(
					'Unsupported metric requested: %s',
					'google-site-kit'
				),
				$invalid_metrics[0]
			);

			throw new Invalid_Report_Metrics_Exception( $message );
		}
	}

	/**
	 * Validates the report dimensions for a shared request.
	 *
	 * @since 1.186.0
	 *
	 * @param string[] $dimensions The dimensions to validate.
	 * @throws Invalid_Report_Dimensions_Exception Thrown if the dimensions are invalid.
	 */
	private function validate_shared_report_dimensions( $dimensions ) {
		$valid_dimensions = apply_filters(
			'googlesitekit_shareable_adsense_dimensions',
			array(
				'DATE',
			)
		);

		$invalid_dimensions = array_diff( $dimensions, $valid_dimensions );

		if ( count( $invalid_dimensions ) > 0 ) {
			$message = count( $invalid_dimensions ) > 1 ? sprintf(
				/* translators: %s: is replaced with a comma separated list of the invalid dimensions. */
				__(
					'Unsupported dimensions requested: %s',
					'google-site-kit'
				),
				join(
					/* translators: used between list items, there is a space after the comma. */
					__( ', ', 'google-site-kit' ),
					$invalid_dimensions
				)
			) : sprintf(
				/* translators: %s: is replaced with the invalid dimension. */
				__(
					'Unsupported dimension requested: %s',
					'google-site-kit'
				),
				$invalid_dimensions[0]
			);

			throw new Invalid_Report_Dimensions_Exception( $message );
		}
	}
}
