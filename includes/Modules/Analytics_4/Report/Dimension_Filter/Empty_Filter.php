<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Report\Dimension_Filter\Empty_Filter
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Report\Dimension_Filter
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Report\Dimension_Filter;

use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Filter as Google_Service_AnalyticsData_Filter;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\FilterExpression as Google_Service_AnalyticsData_FilterExpression;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\EmptyFilter as Google_Service_AnalyticsData_EmptyFilter;


/**
 * Class for parsing the dimension empty filter.
 *
 * @since 1.106.0
 * @access private
 * @ignore
 */
class Empty_Filter implements Filter {

	/**
	 * Parses the dimension empty filter.
	 *
	 * @since n.e.x.t
	 * @param string $dimension_name The dimension name.
	 * @param string $dimension_value The dimension value.
	 *
	 * @return Google_Service_AnalyticsData_FilterExpression The filter expression.
	 */
	public function parse_filter_expression( $dimension_name, $dimension_value ) {
		$empty_filter = new Google_Service_AnalyticsData_EmptyFilter();

		$filter = new Google_Service_AnalyticsData_Filter();
		$filter->setFieldName( $dimension_name );
		$filter->setEmptyFilter( $empty_filter );

		$expression = new Google_Service_AnalyticsData_FilterExpression();
		$expression->setFilter( $filter );

		return $expression;
	}
}
