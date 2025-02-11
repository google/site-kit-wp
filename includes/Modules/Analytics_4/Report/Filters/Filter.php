<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Report\Filter
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Report\Dimension_Filter
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Report;

use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\FilterExpression as Google_Service_AnalyticsData_FilterExpression;

/**
 * Interface for a filter class.
 *
 * @since 1.106.0
 */
interface Filter {

	/**
	 * Converts the filter into the GA4 compatible filter expression.
	 *
	 * @since 1.106.0
	 *
	 * @param string $name Filter name.
	 * @param mixed  $value Filter value.
	 * @return Google_Service_AnalyticsData_FilterExpression The filter expression instance.
	 */
	public function parse_filter_expression( $name, $value );
}
