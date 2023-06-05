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
use Google\Site_Kit\Core\Validation\Exception\Invalid_Report_Metrics_Exception;
use Google\Site_Kit\Core\Util\URL;
use Google\Site_Kit\Modules\Analytics_4\Report;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\DateRange as Google_Service_AnalyticsData_DateRange;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Dimension as Google_Service_AnalyticsData_Dimension;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Filter as Google_Service_AnalyticsData_Filter;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\FilterExpression as Google_Service_AnalyticsData_FilterExpression;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\FilterExpressionList as Google_Service_AnalyticsData_FilterExpressionList;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\InListFilter as Google_Service_AnalyticsData_InListFilter;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\RunReportRequest as Google_Service_AnalyticsData_RunReportRequest;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\StringFilter as Google_Service_AnalyticsData_StringFilter;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Metric as Google_Service_AnalyticsData_Metric;
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
		$request_args = array();

		if ( ! empty( $data['url'] ) ) {
			$request_args['page'] = $data['url'];
		}

		if ( ! empty( $data['limit'] ) ) {
			$request_args['row_limit'] = $data['limit'];
		}

		$dimensions = $this->parse_dimensions( $data );
		if ( ! empty( $dimensions ) ) {
			if ( $is_shared_request ) {
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

				if ( $is_shared_request ) {
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
	 * Creates a new Analytics 4 site request for the current site and given arguments.
	 *
	 * @since 1.99.0
	 *
	 * @param array $args {
	 *    Optional. Additional arguments.
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
	 * @since 1.99.0
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
	 * @since 1.99.0
	 *
	 * @param Google_Service_AnalyticsData_Metric[] $metrics The metrics to validate.
	 * @throws Invalid_Report_Metrics_Exception Thrown if the metrics are invalid.
	 */
	protected function validate_shared_metrics( $metrics ) {
		$valid_metrics = apply_filters(
			'googlesitekit_shareable_analytics_4_metrics',
			array(
				'averageSessionDuration',
				'conversions',
				'engagedSessions',
				'engagementRate',
				'screenPageViews',
				'sessions',
				'totalUsers',
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
	 * @since 1.99.0
	 *
	 * @param Google_Service_AnalyticsData_Dimension[] $dimensions The dimensions to validate.
	 * @throws Invalid_Report_Dimensions_Exception Thrown if the dimensions are invalid.
	 */
	protected function validate_shared_dimensions( $dimensions ) {
		$valid_dimensions = apply_filters(
			'googlesitekit_shareable_analytics_4_dimensions',
			array(
				'country',
				'date',
				'deviceCategory',
				'pagePath',
				'pageTitle',
				'sessionDefaultChannelGrouping',
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

}
