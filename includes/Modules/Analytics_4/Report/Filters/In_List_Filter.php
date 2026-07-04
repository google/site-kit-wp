<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Report\In_List_Filter
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Report\Filters
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Report\Filters;

use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Filter as Google_Service_AnalyticsData_Filter;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\FilterExpression as Google_Service_AnalyticsData_FilterExpression;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\InListFilter as Google_Service_AnalyticsData_InListFilter;

/**
 * Class for parsing the in-list filter.
 *
 * @since 1.106.0
 * @since 1.147.0 Moved from `Analytics_4\Report\Dimension_Filters` to `Analytics_4\Report\Filters` for use with both dimensions and metrics.
 * @access private
 * @ignore
 */
class In_List_Filter implements Filter {

	/**
	 * Converts the filter into the GA4 compatible filter expression.
	 *
	 * @since 1.106.0
	 *
	 * @param string $name The filter field name.
	 * @param mixed  $value The filter value.
	 * @return Google_Service_AnalyticsData_FilterExpression The filter expression instance.
	 */
	public function parse_filter_expression( $name, $value ) {
		$in_list_filter = new Google_Service_AnalyticsData_InListFilter();
		$in_list_filter->setValues( $value );

		$filter = new Google_Service_AnalyticsData_Filter();
		$filter->setFieldName( $name );
		$filter->setInListFilter( $in_list_filter );

		$expression = new Google_Service_AnalyticsData_FilterExpression();
		$expression->setFilter( $filter );

		return $expression;
	}
}
