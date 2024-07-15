<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Report\Metric_Filter\Between_Filter
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Report\Metric_Filter
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Report\Filters;

use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Filter as Google_Service_AnalyticsData_Filter;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\FilterExpression as Google_Service_AnalyticsData_FilterExpression;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\BetweenFilter as Google_Service_AnalyticsData_BetweenFilter;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\NumericValue;

/**
 * Class for parsing the metric between filter.
 *
 * @since 1.111.0
 * @access private
 * @ignore
 */
class Between_Filter {

	/**
	 * Converts the metric filter into the GA4 compatible metric filter expression.
	 *
	 * @since 1.111.0
	 *
	 * @param string  $metric_name The metric name.
	 * @param integer $from_value The filter from value.
	 * @param integer $to_value The filter to value.
	 * @return Google_Service_AnalyticsData_FilterExpression The filter expression instance.
	 */
	public function parse_filter_expression( $metric_name, $from_value, $to_value ) {
		$numeric_from_value = new NumericValue();
		$numeric_from_value->setInt64Value( $from_value );

		$numeric_to_value = new NumericValue();
		$numeric_to_value->setInt64Value( $to_value );

		$between_filter = new Google_Service_AnalyticsData_BetweenFilter();
		$between_filter->setFromValue( $numeric_from_value );
		$between_filter->setToValue( $numeric_to_value );

		$filter = new Google_Service_AnalyticsData_Filter();
		$filter->setFieldName( $metric_name );
		$filter->setBetweenFilter( $between_filter );

		$expression = new Google_Service_AnalyticsData_FilterExpression();
		$expression->setFilter( $filter );

		return $expression;
	}
}
