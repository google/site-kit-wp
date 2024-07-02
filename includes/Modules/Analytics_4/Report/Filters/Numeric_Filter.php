<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Report\Metric_Filter\Numeric_Filter
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Report\Metric_Filter
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Report\Filters;

use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Filter as Google_Service_AnalyticsData_Filter;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\FilterExpression as Google_Service_AnalyticsData_FilterExpression;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\NumericFilter as Google_Service_AnalyticsData_NumericFilter;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\NumericValue;

/**
 * Class for parsing the metric numeric filter.
 *
 * @since 1.111.0
 * @access private
 * @ignore
 */
class Numeric_Filter {

	/**
	 * Converts the metric filter into the GA4 compatible metric filter expression.
	 *
	 * @since 1.111.0
	 *
	 * @param string  $metric_name The metric name.
	 * @param string  $operation The filter operation.
	 * @param integer $value The filter value.
	 * @return Google_Service_AnalyticsData_FilterExpression The filter expression instance.
	 */
	public function parse_filter_expression( $metric_name, $operation, $value ) {
		$numeric_value = new NumericValue();
		$numeric_value->setInt64Value( $value );

		$numeric_filter = new Google_Service_AnalyticsData_NumericFilter();
		$numeric_filter->setOperation( $operation );
		$numeric_filter->setValue( $numeric_value );

		$filter = new Google_Service_AnalyticsData_Filter();
		$filter->setFieldName( $metric_name );
		$filter->setNumericFilter( $numeric_filter );

		$expression = new Google_Service_AnalyticsData_FilterExpression();
		$expression->setFilter( $filter );

		return $expression;
	}
}
