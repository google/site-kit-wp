<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Report\Filters\Empty_Filter
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Report\Filters
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Report\Filters;

use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Filter as Google_Service_AnalyticsData_Filter;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\FilterExpression as Google_Service_AnalyticsData_FilterExpression;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\EmptyFilter as Google_Service_AnalyticsData_EmptyFilter;


/**
 * Class for parsing the empty filter.
 *
 * @since 1.147.0
 * @access private
 * @ignore
 */
class Empty_Filter implements Filter {

	/**
	 * Parses the empty filter.
	 *
	 * @since 1.147.0
	 * @param string $name The filter field name.
	 * @param string $value The filter value (not used).
	 *
	 * @return Google_Service_AnalyticsData_FilterExpression The filter expression.
	 */
	public function parse_filter_expression( $name, $value ) {
		$empty_filter = new Google_Service_AnalyticsData_EmptyFilter();

		$filter = new Google_Service_AnalyticsData_Filter();
		$filter->setFieldName( $name );
		$filter->setEmptyFilter( $empty_filter );

		$expression = new Google_Service_AnalyticsData_FilterExpression();
		$expression->setFilter( $filter );

		return $expression;
	}
}
