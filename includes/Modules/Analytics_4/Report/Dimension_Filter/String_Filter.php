<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Report\Dimension_Filter\String_Filter
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Report\Dimension_Filter
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Report\Dimension_Filter;

use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Filter as Google_Service_AnalyticsData_Filter;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\FilterExpression as Google_Service_AnalyticsData_FilterExpression;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\FilterExpressionList as Google_Service_AnalyticsData_FilterExpressionList;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\StringFilter as Google_Service_AnalyticsData_StringFilter;

/**
 * Class for parsing the dimension string filter.
 *
 * @since 1.106.0
 * @access private
 * @ignore
 */
class String_Filter implements Filter {

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
		$match_type = isset( $dimension_value['matchType'] )
			? $dimension_value['matchType']
			: 'EXACT';

		$filter_value = isset( $dimension_value['value'] )
			? $dimension_value['value']
			: $dimension_value;

		// If there are many values for this filter, then it means that we want to find
		// rows where dimension are included in the list of provided values. In this case,
		// we need to create a nested filter expression that contains separate string filters
		// for each item in the list and combined into the "OR" group.
		if ( is_array( $filter_value ) ) {
			$expressions = array();
			foreach ( $filter_value as $value ) {
				$expressions[] = $this->compose_individual_filter_expression(
					$dimension_name,
					$match_type,
					$value
				);
			}

			$expression_list = new Google_Service_AnalyticsData_FilterExpressionList();
			$expression_list->setExpressions( $expressions );

			$filter_expression = new Google_Service_AnalyticsData_FilterExpression();
			$filter_expression->setOrGroup( $expression_list );

			return $filter_expression;
		}

		// If we have a single value for the filter, then we should use just a single
		// string filter expression and there is no need to create a nested one.
		return $this->compose_individual_filter_expression(
			$dimension_name,
			$match_type,
			$filter_value
		);
	}

	/**
	 * Composes individual filter expression and returns it.
	 *
	 * @since 1.106.0
	 *
	 * @param string $dimension_name The dimension name.
	 * @param string $match_type The dimension filter match type.
	 * @param mixed  $value The dimension filter value.
	 * @return Google_Service_AnalyticsData_FilterExpression The filter expression instance.
	 */
	protected function compose_individual_filter_expression( $dimension_name, $match_type, $value ) {
		$string_filter = new Google_Service_AnalyticsData_StringFilter();
		$string_filter->setMatchType( $match_type );
		$string_filter->setValue( $value );

		$filter = new Google_Service_AnalyticsData_Filter();
		$filter->setFieldName( $dimension_name );
		$filter->setStringFilter( $string_filter );

		$filter_expression = new Google_Service_AnalyticsData_FilterExpression();
		$filter_expression->setFilter( $filter );

		return $filter_expression;
	}
}
