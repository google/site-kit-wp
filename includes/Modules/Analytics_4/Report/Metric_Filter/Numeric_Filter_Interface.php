<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Report\Metric_Filter\Filter
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Report\Metric_Filter
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Report\Metric_Filter;

use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\FilterExpression as Google_Service_AnalyticsData_FilterExpression;

/**
 * Interface for a numeric filter class.
 *
 * @since n.e.x.t
 */
interface Numeric_Filter_Interface {

	/**
	 * Converts the metric filter into the GA4 compatible metric filter expression.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $metric_name The metric name.
	 * @param string $operation The filter operation.
	 * @param mixed  $value The filter value.
	 * @return Google_Service_AnalyticsData_FilterExpression The filter expression instance.
	 */
	public function parse_filter_expression( $metric_name, $operation, $value );

}
