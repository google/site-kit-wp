<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Report\Dimension_Filter\In_List_Filter
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Report\Dimension_Filter
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Report\Dimension_Filter;

use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Filter as Google_Service_AnalyticsData_Filter;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\FilterExpression as Google_Service_AnalyticsData_FilterExpression;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\InListFilter as Google_Service_AnalyticsData_InListFilter;

/**
 * Class for parsing the dimension in-list filter.
 *
 * @since 1.106.0
 * @access private
 * @ignore
 */
class In_List_Filter implements Filter {

	/**
	 * Converts the dimension filter into the GA4 compatible dimension filter expression.
	 *
	 * @since 1.106.0
	 *
	 * @param string $dimension_name The dimension name.
	 * @param mixed  $dimension_value The dimension filter value.
	 * @return Google_Service_AnalyticsData_FilterExpression The filter expression instance.
	 */
	public function parse_filter_expression( $dimension_name, $dimension_value ) {
		$in_list_filter = new Google_Service_AnalyticsData_InListFilter();
		$in_list_filter->setValues( $dimension_value );

		$filter = new Google_Service_AnalyticsData_Filter();
		$filter->setFieldName( $dimension_name );
		$filter->setInListFilter( $in_list_filter );

		$expression = new Google_Service_AnalyticsData_FilterExpression();
		$expression->setFilter( $filter );

		return $expression;
	}
}
