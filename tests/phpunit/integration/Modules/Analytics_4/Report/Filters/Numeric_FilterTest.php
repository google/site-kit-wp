<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Report\Filters\Numeric_FilterTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Report\Filters
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Report\Filters;

use Google\Site_Kit\Modules\Analytics_4\Report\Filters\Numeric_Filter;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 * @group Report
 * @group Dimension_Filter
 */
class Numeric_FilterTest extends TestCase {

	public function test_parse_filter_expression() {
		$metric_name = 'metricA';
		$operation   = 'EQUAL';
		$value       = 3;

		$filter     = new Numeric_Filter();
		$expression = $filter->parse_filter_expression( $metric_name, $operation, $value );

		$this->assertEquals(
			array(
				'filter' => array(
					'fieldName'     => $metric_name,
					'numericFilter' => array(
						'operation' => $operation,
						'value'     => array(
							'int64Value'  => $value,
							'doubleValue' => null,
						),
					),
				),
			),
			json_decode( wp_json_encode( $expression ), true )
		);
	}

}
