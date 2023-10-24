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
use Google\Site_Kit\Modules\Analytics_4\Report\Dimension_Filter\In_List_Filter;
use Google\Site_Kit\Modules\Analytics_4\Report\Dimension_Filter\String_Filter;
use Google\Site_Kit\Modules\Analytics_4\Report\Filters\Numeric_Filter;
use Google\Site_Kit\Modules\Analytics_4\Report\Filters\Between_Filter;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\DateRange as Google_Service_AnalyticsData_DateRange;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Dimension as Google_Service_AnalyticsData_Dimension;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\FilterExpression as Google_Service_AnalyticsData_FilterExpression;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\FilterExpressionList as Google_Service_AnalyticsData_FilterExpressionList;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\RunReportRequest as Google_Service_AnalyticsData_RunReportRequest;
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
		$request = new Google_Service_AnalyticsData_RunReportRequest();
		$request->setKeepEmptyRows( true );
		$request->setMetricAggregations( array( 'TOTAL', 'MINIMUM', 'MAXIMUM' ) );

		if ( ! empty( $data['limit'] ) ) {
			$request->setLimit( $data['limit'] );
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

			$request->setDimensions( (array) $dimensions );
		}

		$dimension_filters = $this->parse_dimension_filters( $data );
		$request->setDimensionFilter( $dimension_filters );

		$metric_filters = $this->parse_metric_filters( $data );
		if ( ! empty( $metric_filters ) ) {
			$request->setMetricFilter( $metric_filters );
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
				'activeUsers',
				'averageSessionDuration',
				'bounceRate',
				'conversions',
				'engagedSessions',
				'engagementRate',
				'screenPageViews',
				'screenPageViewsPerSession',
				'sessions',
				'sessionConversionRate',
				'sessionsPerUser',
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
				'city',
				'country',
				'date',
				'deviceCategory',
				'newVsReturning',
				'pagePath',
				'pageTitle',
				'sessionDefaultChannelGroup',
				'sessionDefaultChannelGrouping',
				'customEvent:googlesitekit_post_author',
				'customEvent:googlesitekit_post_categories',
				'customEvent:googlesitekit_post_date',
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
	 * Parses dimension filters and returns a filter expression that should be added to the report request.
	 *
	 * @since 1.106.0
	 *
	 * @param Data_Request $data Data request object.
	 * @return Google_Service_AnalyticsData_FilterExpression The filter expression to use with the report request.
	 */
	protected function parse_dimension_filters( Data_Request $data ) {
		$expressions = array();

		$reference_url = trim( $this->context->get_reference_site_url(), '/' );
		$hostnames     = URL::permute_site_hosts( URL::parse( $reference_url, PHP_URL_HOST ) );
		$expressions[] = $this->parse_dimension_filter( 'hostName', $hostnames );

		if ( ! empty( $data['url'] ) ) {
			$url           = str_replace( $reference_url, '', esc_url_raw( $data['url'] ) );
			$expressions[] = $this->parse_dimension_filter( 'pagePath', $url );
		}

		if ( is_array( $data['dimensionFilters'] ) ) {
			foreach ( $data['dimensionFilters'] as $key => $value ) {
				$expressions[] = $this->parse_dimension_filter( $key, $value );
			}
		}

		$filter_expression_list = new Google_Service_AnalyticsData_FilterExpressionList();
		$filter_expression_list->setExpressions( array_filter( $expressions ) );

		$dimension_filters = new Google_Service_AnalyticsData_FilterExpression();
		$dimension_filters->setAndGroup( $filter_expression_list );

		return $dimension_filters;
	}

	/**
	 * Parses and returns a single dimension filter.
	 *
	 * @since 1.106.0
	 *
	 * @param string $dimension_name The dimension name.
	 * @param mixed  $dimension_value The dimension fileter settings.
	 * @return Google_Service_AnalyticsData_FilterExpression The filter expression instance.
	 */
	protected function parse_dimension_filter( $dimension_name, $dimension_value ) {
		// Use the string filter type by default.
		$filter_type = 'stringFilter';
		if ( isset( $dimension_value['filterType'] ) ) {
			// If the filterType property is provided, use the explicit filter type then.
			$filter_type = $dimension_value['filterType'];
		} elseif ( wp_is_numeric_array( $dimension_value ) ) {
			// Otherwise, if the dimension has a numeric array of values, we should fall
			// back to the "in list" filter type.
			$filter_type = 'inListFilter';
		}

		if ( 'stringFilter' === $filter_type ) {
			$filter_class = String_Filter::class;
		} elseif ( 'inListFilter' === $filter_type ) {
			$filter_class = In_List_Filter::class;
			// Ensure that the 'inListFilter' is provided a flat array of values.
			// Extract the actual values from the 'value' key if present.
			if ( isset( $dimension_value['value'] ) ) {
				$dimension_value = $dimension_value['value'];
			}
		} else {
			return null;
		}

		$filter            = new $filter_class();
		$filter_expression = $filter->parse_filter_expression( $dimension_name, $dimension_value );

		return $filter_expression;
	}

	/**
	 * Parses metric filters and returns a filter expression that should be added to the report request.
	 *
	 * @since 1.111.0
	 *
	 * @param Data_Request $data Data request object.
	 * @return Google_Service_AnalyticsData_FilterExpression The filter expression to use with the report request.
	 */
	protected function parse_metric_filters( Data_Request $data ) {
		$expressions = array();

		if ( is_array( $data['metricFilters'] ) ) {
			foreach ( $data['metricFilters'] as $key => $value ) {
				$expressions[] = $this->parse_metric_filter( $key, $value );
			}
		}

		if ( ! empty( $expressions ) ) {
			$filter_expression_list = new Google_Service_AnalyticsData_FilterExpressionList();
			$filter_expression_list->setExpressions( array_filter( $expressions ) );

			$metric_filters = new Google_Service_AnalyticsData_FilterExpression();
			$metric_filters->setAndGroup( $filter_expression_list );

			return $metric_filters;
		}

		return null;
	}

	/**
	 * Parses and returns a single metric filter.
	 *
	 * @since 1.111.0
	 *
	 * @param string $metric_name The metric name.
	 * @param mixed  $metric_value The metric filter settings.
	 * @return Google_Service_AnalyticsData_FilterExpression The filter expression instance.
	 */
	protected function parse_metric_filter( $metric_name, $metric_value ) {
		// Use the numeric filter type by default.
		$filter_type = 'numericFilter';
		if ( isset( $metric_value['filterType'] ) ) {
			// If the filterType property is provided, use the explicit filter type then.
			$filter_type = $metric_value['filterType'];
		}

		if ( 'numericFilter' === $filter_type ) {
			if ( ! isset( $metric_value['operation'] ) || ! isset( $metric_value['value'] ) ) {
				return null;
			}
			if ( ! isset( $metric_value['value']['int64Value'] ) ) {
				return null;
			}

			$filter = new Numeric_Filter();

		} elseif ( 'betweenFilter' === $filter_type ) {
			if ( ! isset( $metric_value['from_value'] ) || ! isset( $metric_value['to_value'] ) ) {
				return null;
			}
			if (
				! isset( $metric_value['from_value']['int64Value'] ) ||
				! isset( $metric_value['to_value']['int64Value'] )
			) {
				return null;
			}

			$filter = new Between_Filter();

		} else {
			return null;
		}

		$filter_expression = $this->get_metric_filter_expression(
			$filter,
			$metric_name,
			$metric_value
		);

		return $filter_expression;
	}

	/**
	 * Returns correct filter expression instance based on the metric filter instance.
	 *
	 * @since 1.111.0
	 *
	 * @param Numeric_Filter|Between_Filter $filter The metric filter instance.
	 * @param string                        $metric_name The metric name.
	 * @param mixed                         $metric_value The metric filter settings.
	 * @return Google_Service_AnalyticsData_FilterExpression The filter expression instance.
	 */
	protected function get_metric_filter_expression( $filter, $metric_name, $metric_value ) {
		if ( $filter instanceof Numeric_Filter ) {
			$value = $metric_value['value']['int64Value'];

			$filter_expression = $filter->parse_filter_expression(
				$metric_name,
				$metric_value['operation'],
				$value
			);

		} elseif ( $filter instanceof Between_Filter ) {
			$from_value = $metric_value['from_value']['int64Value'];
			$to_value   = $metric_value['to_value']['int64Value'];

			$filter_expression = $filter->parse_filter_expression(
				$metric_name,
				$from_value,
				$to_value
			);

		} else {
			return null;
		}

		return $filter_expression;
	}
}
