<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Report\Filters\Between_FilterTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Report\Filters
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Report\Filters;

use Google\Site_Kit\Modules\Analytics_4\Report\Filters\Between_Filter;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 * @group Report
 * @group Dimension_Filter
 */
class Between_FilterTest extends TestCase {

	public function test_parse_filter_expression() {
		$metric_name = 'metricA';
		$from_value  = 1;
		$to_value    = 3;

		$filter     = new Between_Filter();
		$expression = $filter->parse_filter_expression( $metric_name, $from_value, $to_value );

		$this->assertEquals(
			array(
				'filter' => array(
					'fieldName'     => $metric_name,
					'betweenFilter' => array(
						'fromValue' => array(
							'int64Value'  => $from_value,
							'doubleValue' => null,
						),
						'toValue'   => array(
							'int64Value'  => $to_value,
							'doubleValue' => null,
						),
					),
				),
			),
			json_decode( wp_json_encode( $expression ), true )
		);
	}

}
