<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Report
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Validation\Exception\Invalid_Report_Dimensions_Exception;
use Google\Site_Kit\Core\Validation\Exception\Invalid_Report_Metrics_Exception;
use Google\Site_Kit\Core\Util\Date;
use Google\Site_Kit\Core\Util\URL;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\DateRange as Google_Service_AnalyticsData_DateRange;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Dimension as Google_Service_AnalyticsData_Dimension;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\DimensionOrderBy as Google_Service_AnalyticsData_DimensionOrderBy;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\DimensionValue as Google_Service_AnalyticsData_DimensionValue;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Filter as Google_Service_AnalyticsData_Filter;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\FilterExpression as Google_Service_AnalyticsData_FilterExpression;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\FilterExpressionList as Google_Service_AnalyticsData_FilterExpressionList;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\InListFilter as Google_Service_AnalyticsData_InListFilter;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\MetricOrderBy as Google_Service_AnalyticsData_MetricOrderBy;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\MetricValue as Google_Service_AnalyticsData_MetricValue;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\OrderBy as Google_Service_AnalyticsData_OrderBy;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Row as Google_Service_AnalyticsData_Row;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\RunReportRequest as Google_Service_AnalyticsData_RunReportRequest;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\RunReportResponse as Google_Service_AnalyticsData_RunReportResponse;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\StringFilter as Google_Service_AnalyticsData_StringFilter;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Metric as Google_Service_AnalyticsData_Metric;
use WP_Error;

/**
 * Class for Analytics 4 reports.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Report {

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	protected $context;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Creates and executes a new Analytics 4 report request.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data           Data request object.
	 * @param bool         $shared_request Determines whether the current request is shared or not.
	 * @return RequestInterface|WP_Error Request object on success, or WP_Error on failure.
	 */
	public function create_request( Data_Request $data, $shared_request ) {
		$request_args = array();

		if ( ! empty( $data['url'] ) ) {
			$request_args['page'] = $data['url'];
		}

		if ( ! empty( $data['limit'] ) ) {
			$request_args['row_limit'] = $data['limit'];
		}

		$dimensions = $this->parse_dimensions( $data );
		if ( ! empty( $dimensions ) ) {
			if ( $shared_request ) {
				try {
					$this->validate_shared_dimensions( $dimensions );
				} catch ( Invalid_Report_Dimensions_Exception $exception ) {
					return new WP_Error(
						'invalid_analytics_4_report_dimensions',
						$exception->getMessage()
					);
				}
			}

			$request_args['dimensions'] = $dimensions;
		}

		$dimension_filters            = $data['dimensionFilters'];
		$dimension_filter_expressions = array();
		if ( ! empty( $dimension_filters ) && is_array( $dimension_filters ) ) {
			foreach ( $dimension_filters as $dimension_name => $dimension_value ) {
				$dimension_filter = new Google_Service_AnalyticsData_Filter();
				$dimension_filter->setFieldName( $dimension_name );
				if ( is_array( $dimension_value ) ) {
					$dimension_in_list_filter = new Google_Service_AnalyticsData_InListFilter();
					$dimension_in_list_filter->setValues( $dimension_value );
					$dimension_filter->setInListFilter( $dimension_in_list_filter );
				} else {
					$dimension_string_filter = new Google_Service_AnalyticsData_StringFilter();
					$dimension_string_filter->setMatchType( 'EXACT' );
					$dimension_string_filter->setValue( $dimension_value );
					$dimension_filter->setStringFilter( $dimension_string_filter );
				}
				$dimension_filter_expression = new Google_Service_AnalyticsData_FilterExpression();
				$dimension_filter_expression->setFilter( $dimension_filter );
				$dimension_filter_expressions[] = $dimension_filter_expression;
			}

			if ( ! empty( $dimension_filter_expressions ) ) {
				$request_args['dimension_filters'] = $dimension_filter_expressions;
			}
		}

		$request = $this->create_analytics_site_data_request( $request_args );
		if ( is_wp_error( $request ) ) {
			return $request;
		}

		$date_ranges = $this->parse_dateranges( $data );
		$request->setDateRanges( $date_ranges );

		$metrics = $data['metrics'];
		if ( is_string( $metrics ) || is_array( $metrics ) ) {
			if ( is_string( $metrics ) ) {
				$metrics = explode( ',', $data['metrics'] );
			} elseif ( is_array( $metrics ) && ! wp_is_numeric_array( $metrics ) ) { // If single object is passed.
				$metrics = array( $metrics );
			}

			$metrics = array_filter(
				array_map(
					function ( $metric_def ) {
						$metric = new Google_Service_AnalyticsData_Metric();

						if ( is_string( $metric_def ) ) {
							$metric->setName( $metric_def );
						} elseif ( is_array( $metric_def ) ) {
							$metric->setName( $metric_def['name'] );
							if ( ! empty( $metric_def['expression'] ) ) {
								$metric->setExpression( $metric_def['expression'] );
							}
						} else {
							return null;
						}

						return $metric;
					},
					$metrics
				)
			);

			if ( ! empty( $metrics ) ) {
				try {
					$this->validate_metrics( $metrics );
				} catch ( Invalid_Report_Metrics_Exception $exception ) {
					return new WP_Error(
						'invalid_analytics_4_report_metrics',
						$exception->getMessage()
					);
				}

				if ( $shared_request ) {
					try {
						$this->validate_shared_metrics( $metrics );
					} catch ( Invalid_Report_Metrics_Exception $exception ) {
						return new WP_Error(
							'invalid_analytics_4_report_metrics',
							$exception->getMessage()
						);
					}
				}

				$request->setMetrics( $metrics );
			}
		}

		// Order by.
		$orderby = $this->parse_orderby( $data );
		if ( ! empty( $orderby ) ) {
			$request->setOrderBys( $orderby );
		}

		// Ensure the total, minimum and maximum metric aggregations are included in order to match what is returned by the UA reports. We may wish to make this optional in future.
		$request->setMetricAggregations(
			array(
				'TOTAL',
				'MINIMUM',
				'MAXIMUM',
			)
		);

		return $request;
	}

	/**
	 * Parses report dimensions received in the request params.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data Data request object.
	 * @return Google_Service_AnalyticsData_Dimension[] An array of AnalyticsData Dimension objects.
	 */
	protected function parse_dimensions( Data_Request $data ) {
		$dimensions = $data['dimensions'];
		if ( empty( $dimensions ) || ( ! is_string( $dimensions ) && ! is_array( $dimensions ) ) ) {
			return array();
		}

		if ( is_string( $dimensions ) ) {
			$dimensions = explode( ',', $dimensions );
		} elseif ( is_array( $dimensions ) && ! wp_is_numeric_array( $dimensions ) ) { // If single object is passed.
			$dimensions = array( $dimensions );
		}

		$dimensions = array_filter(
			array_map(
				function ( $dimension_def ) {
					$dimension = new Google_Service_AnalyticsData_Dimension();

					if ( is_string( $dimension_def ) ) {
						$dimension->setName( $dimension_def );
					} elseif ( is_array( $dimension_def ) && ! empty( $dimension_def['name'] ) ) {
						$dimension->setName( $dimension_def['name'] );
					} else {
						return null;
					}

					return $dimension;
				},
				array_filter( $dimensions )
			)
		);

		return $dimensions;
	}

	/**
	 * Parses report date ranges received in the request params.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data Data request object.
	 * @return Google_Service_AnalyticsData_DateRange[] An array of AnalyticsData DateRange objects.
	 */
	protected function parse_dateranges( Data_Request $data ) {
		$date_ranges = array();
		$start_date  = $data['startDate'];
		$end_date    = $data['endDate'];
		if ( strtotime( $start_date ) && strtotime( $end_date ) ) {
			$compare_start_date = $data['compareStartDate'];
			$compare_end_date   = $data['compareEndDate'];
			$date_ranges[]      = array( $start_date, $end_date );

			// When using multiple date ranges, it changes the structure of the response:
			// Aggregate properties (minimum, maximum, totals) will have an entry per date range.
			// The rows property will have additional row entries for each date range.
			if ( strtotime( $compare_start_date ) && strtotime( $compare_end_date ) ) {
				$date_ranges[] = array( $compare_start_date, $compare_end_date );
			}
		} else {
			// Default the date range to the last 28 days.
			$date_ranges[] = Date::parse_date_range( 'last-28-days', 1 );
		}

		$date_ranges = array_map(
			function ( $date_range ) {
				list ( $start_date, $end_date ) = $date_range;
				$date_range                     = new Google_Service_AnalyticsData_DateRange();
				$date_range->setStartDate( $start_date );
				$date_range->setEndDate( $end_date );

				return $date_range;
			},
			$date_ranges
		);

		return $date_ranges;
	}

	/**
	 * Parses the orderby value of the data request into an array of AnalyticsData OrderBy object instances.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data Data request object.
	 * @return Google_Service_AnalyticsData_OrderBy[] An array of AnalyticsData OrderBy objects.
	 */
	protected function parse_orderby( Data_Request $data ) {
		$orderby = $data['orderby'];
		if ( empty( $orderby ) || ! is_array( $orderby ) || ! wp_is_numeric_array( $orderby ) ) {
			return array();
		}

		$results = array_map(
			function ( $order_def ) {
				$order_by = new Google_Service_AnalyticsData_OrderBy();
				$order_by->setDesc( ! empty( $order_def['desc'] ) );

				if ( isset( $order_def['metric'] ) && isset( $order_def['metric']['metricName'] ) ) {
					$metric_order_by = new Google_Service_AnalyticsData_MetricOrderBy();
					$metric_order_by->setMetricName( $order_def['metric']['metricName'] );
					$order_by->setMetric( $metric_order_by );
				} elseif ( isset( $order_def['dimension'] ) && isset( $order_def['dimension']['dimensionName'] ) ) {
					$dimension_order_by = new Google_Service_AnalyticsData_DimensionOrderBy();
					$dimension_order_by->setDimensionName( $order_def['dimension']['dimensionName'] );
					$order_by->setDimension( $dimension_order_by );
				} else {
					return null;
				}

				return $order_by;
			},
			$orderby
		);

		$results = array_filter( $results );
		$results = array_values( $results );

		return $results;
	}

	/**
	 * Creates a new Analytics 4 site request for the current site and given arguments.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $args {
	 *     Optional. Additional arguments.
	 *
	 *     @type array                                           $dimensions        List of request dimensions. Default empty array.
	 *     @type Google_Service_AnalyticsData_FilterExpression[] $dimension_filters List of dimension filter instances for the specified request dimensions. Default empty array.
	 *     @type string                                          $start_date        Start date in 'Y-m-d' format. Default empty string.
	 *     @type string                                          $end_date          End date in 'Y-m-d' format. Default empty string.
	 *     @type string                                          $page              Specific page URL to filter by. Default empty string.
	 *     @type int                                             $row_limit         Limit of rows to return. Default empty string.
	 * }
	 * @return Google_Service_AnalyticsData_RunReportRequest|WP_Error Analytics 4 site request instance.
	 */
	protected function create_analytics_site_data_request( array $args = array() ) {
		$args = wp_parse_args(
			$args,
			array(
				'dimensions'        => array(),
				'dimension_filters' => array(),
				'start_date'        => '',
				'end_date'          => '',
				'page'              => '',
				'row_limit'         => '',
			)
		);

		$request = new Google_Service_AnalyticsData_RunReportRequest();
		$request->setKeepEmptyRows( true );

		if ( ! empty( $args['dimensions'] ) ) {
			$request->setDimensions( (array) $args['dimensions'] );
		}

		if ( ! empty( $args['start_date'] ) && ! empty( $args['end_date'] ) ) {
			$date_range = new Google_Service_AnalyticsData_DateRange();
			$date_range->setStartDate( $args['start_date'] );
			$date_range->setEndDate( $args['end_date'] );
			$request->setDateRanges( array( $date_range ) );
		}

		$dimension_filter_expressions = array();

		$hostnames = URL::permute_site_hosts( URL::parse( $this->context->get_reference_site_url(), PHP_URL_HOST ) );

		$dimension_in_list_filter = new Google_Service_AnalyticsData_InListFilter();
		$dimension_in_list_filter->setValues( $hostnames );
		$dimension_filter = new Google_Service_AnalyticsData_Filter();
		$dimension_filter->setFieldName( 'hostName' );
		$dimension_filter->setInListFilter( $dimension_in_list_filter );
		$dimension_filter_expression = new Google_Service_AnalyticsData_FilterExpression();
		$dimension_filter_expression->setFilter( $dimension_filter );
		$dimension_filter_expressions[] = $dimension_filter_expression;

		if ( ! empty( $args['dimension_filters'] ) ) {
			$dimension_filter_expressions = array_merge( $dimension_filter_expressions, $args['dimension_filters'] );
		}

		if ( ! empty( $args['page'] ) ) {
			$args['page']            = str_replace( trim( $this->context->get_reference_site_url(), '/' ), '', esc_url_raw( $args['page'] ) );
			$dimension_string_filter = new Google_Service_AnalyticsData_StringFilter();
			$dimension_string_filter->setMatchType( 'EXACT' );
			$dimension_string_filter->setValue( rawurldecode( $args['page'] ) );
			$dimension_filter = new Google_Service_AnalyticsData_Filter();
			$dimension_filter->setFieldName( 'pagePath' );
			$dimension_filter->setStringFilter( $dimension_string_filter );
			$dimension_filter_expression = new Google_Service_AnalyticsData_FilterExpression();
			$dimension_filter_expression->setFilter( $dimension_filter );
			$dimension_filter_expressions[] = $dimension_filter_expression;
		}

		$dimension_filter_expression_list = new Google_Service_AnalyticsData_FilterExpressionList();
		$dimension_filter_expression_list->setExpressions( $dimension_filter_expressions );
		$dimension_filter_expression = new Google_Service_AnalyticsData_FilterExpression();
		$dimension_filter_expression->setAndGroup( $dimension_filter_expression_list );
		$request->setDimensionFilter( $dimension_filter_expression );

		if ( ! empty( $args['row_limit'] ) ) {
			$request->setLimit( $args['row_limit'] );
		}

		return $request;
	}

	/**
	 * Validates the given metrics for a report.
	 *
	 * Metrics must have valid names, matching the regular expression ^[a-zA-Z0-9_]+$ in keeping with the GA4 API.
	 *
	 * @since n.e.x.t
	 *
	 * @param Google_Service_AnalyticsData_Metric[] $metrics The metrics to validate.
	 * @throws Invalid_Report_Metrics_Exception Thrown if the metrics are invalid.
	 */
	protected function validate_metrics( $metrics ) {
		$valid_name_expression = '^[a-zA-Z0-9_]+$';

		$invalid_metrics = array_map(
			function ( $metric ) {
				return $metric->getName();
			},
			array_filter(
				$metrics,
				function ( $metric ) use ( $valid_name_expression ) {
					return ! preg_match( "#$valid_name_expression#", $metric->getName() );
				}
			)
		);

		if ( count( $invalid_metrics ) > 0 ) {
			$message = count( $invalid_metrics ) > 1 ? sprintf(
				/* translators: 1: the regular expression for a valid name, 2: a comma separated list of the invalid metrics. */
				__(
					'Metric names should match the expression %1$s: %2$s',
					'google-site-kit'
				),
				$valid_name_expression,
				join(
					/* translators: used between list items, there is a space after the comma. */
					__( ', ', 'google-site-kit' ),
					$invalid_metrics
				)
			) : sprintf(
				/* translators: 1: the regular expression for a valid name, 2: the invalid metric. */
				__(
					'Metric name should match the expression %1$s: %2$s',
					'google-site-kit'
				),
				$valid_name_expression,
				$invalid_metrics[0]
			);

			throw new Invalid_Report_Metrics_Exception( $message );
		}
	}

	/**
	 * Validates the report metrics for a shared request.
	 *
	 * @since n.e.x.t
	 *
	 * @param Google_Service_AnalyticsData_Metric[] $metrics The metrics to validate.
	 * @throws Invalid_Report_Metrics_Exception Thrown if the metrics are invalid.
	 */
	protected function validate_shared_metrics( $metrics ) {
		$valid_metrics = apply_filters(
			'googlesitekit_shareable_analytics_4_metrics',
			array(
				// TODO: Add metrics to this allow-list as they are used in the plugin.
			)
		);

		$invalid_metrics = array_diff(
			array_map(
				function ( $metric ) {
					// If there is an expression, it means the name is there as an alias, otherwise the name should be a valid metric name.
					// Therefore, the expression takes precedence to the name for the purpose of allow-list validation.
					return ! empty( $metric->getExpression() ) ? $metric->getExpression() : $metric->getName();
				},
				$metrics
			),
			$valid_metrics
		);

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
	 * @since n.e.x.t
	 *
	 * @param Google_Service_AnalyticsData_Dimension[] $dimensions The dimensions to validate.
	 * @throws Invalid_Report_Dimensions_Exception Thrown if the dimensions are invalid.
	 */
	protected function validate_shared_dimensions( $dimensions ) {
		$valid_dimensions = apply_filters(
			'googlesitekit_shareable_analytics_4_dimensions',
			array(
				// TODO: Add dimensions to this allow-list as they are used in the plugin.
			)
		);

		$invalid_dimensions = array_diff(
			array_map(
				function ( $dimension ) {
					return $dimension->getName();
				},
				$dimensions
			),
			$valid_dimensions
		);

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

	/**
	 * Parses the report response, and pads the report data with zero-data rows where rows are missing. This only applies for reports which request a single `date` dimension.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request                                   $data     Data request object.
	 * @param Google_Service_AnalyticsData_RunReportResponse $response Request response.
	 * @return mixed Parsed response data on success, or WP_Error on failure.
	 */
	public function parse_response( Data_Request $data, $response ) {
		// Return early if the response is not of the expected type.
		if ( ! $response instanceof Google_Service_AnalyticsData_RunReportResponse ) {
			return $response;
		}

		// Get report dimensions and return early if there is either more than one dimension or
		// the only dimension is not "date".
		$dimensions = $this->parse_dimensions( $data );
		if ( count( $dimensions ) !== 1 || $dimensions[0]->getName() !== 'date' ) {
			return $response;
		}

		// Get date ranges and return early if there are no date ranges for this report.
		$date_ranges = $this->parse_dateranges( $data );
		if ( empty( $date_ranges ) ) {
			return $response;
		}

		// Get all available dates in the report.
		$rows = array();
		foreach ( $response->getRows() as $row ) {
			$dimension_values         = $row->getDimensionValues();
			$date                     = $dimension_values[0]->getValue();
			$rows[ $date ]            = $row;
		}

		$metrics         = $response->getMetricHeaders();
		$multiple_ranges = count( $date_ranges ) > 1;

		foreach ( $date_ranges as $date_range_index => $date_range ) {
			$start = strtotime( $date_range->getStartDate() );
			$end   = strtotime( $date_range->getEndDate() );

			// Skip this date range if either start date or end date is corrupted.
			if ( ! $start || ! $end ) {
				continue;
			}

			// Loop through all days in the date range and check if there is a metric value
			// for it. If the metric value is missing, we will need to add one with a zero value.
			$now = $start;
			do {
				// Format the current time to a date string and add a day in seconds to the current date
				// to shift to the next date.
				$current_date = gmdate( 'Ymd', $now );
				$now += DAY_IN_SECONDS;

				// If the current date is found, then go to the next day.
				if ( isset( $rows[ $current_date ] ) ) {
					continue;
				}

				$dimension_values = array();

				$current_date_dimension_value = new Google_Service_AnalyticsData_DimensionValue();
				$current_date_dimension_value->setValue( $current_date );
				$dimension_values[] = $current_date_dimension_value;

				// If we have multiple date ranges, we need to add "date_range_{i}" index to dimension values.
				if ( $multiple_ranges ) {
					$date_range_dimension_value = new Google_Service_AnalyticsData_DimensionValue();
					$date_range_dimension_value->setValue( "date_range_{$date_range_index}" );
					$dimension_values[] = $date_range_dimension_value;
				}

				$metric_values = array();
				foreach ( $metrics as $metric ) {
					$metric_value = new Google_Service_AnalyticsData_MetricValue();

					switch ( $metric->getType() ) {
						case 'TYPE_INTEGER':
						case 'TYPE_FLOAT':
						case 'TYPE_CURRENCY':
							$metric_value->setValue( '0' );
							break;
						default:
							$metric_value->setValue( null );
							break;
					}

					$metric_values[] = $metric_value;
				}

				$row = new Google_Service_AnalyticsData_Row();
				$row->setDimensionValues( $dimension_values );
				$row->setMetricValues( $metric_values );

				$rows[ $current_date ] = $row;
			} while ( $now <= $end );
		}

		// If we have the same number of rows as in the response at the moment, then
		// we can return the response without setting the new rows back into the response.
		$new_rows_count = count( $rows );
		if ( $new_rows_count <= $response->getRowCount() ) {
			return $response;
		}

		// Sort rows by keys to have all records in ascending order.
		$orderby = $this->parse_orderby( $data );
		if ( ! empty( $orderby ) ) {
			uasort(
				$rows,
				function( $a, $b ) use ( $orderby ) {
					foreach ( $orderby as $order ) {

					}
				}
			);
		}

		// Set updated rows back to the response object.
		$response->setRows( array_values( $rows ) );
		$response->setRowCount( $new_rows_count );

		return $response;
	}

}
