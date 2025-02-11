<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Report\Dimension_Filter\In_List_FilterTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Report\Dimension_Filter
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Report\Dimension_Filter;

use Google\Site_Kit\Modules\Analytics_4\Report\Filters\In_List_Filter;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 * @group Report
 * @group Dimension_Filter
 */
class In_List_FilterTest extends TestCase {

	public function test_parse_filter_expression() {
		$dimension = 'dimensionA';
		$values    = array( 'a', 'b', 'c' );

		$filter     = new In_List_Filter();
		$expression = $filter->parse_filter_expression( $dimension, $values );

		$this->assertEquals(
			array(
				'filter' => array(
					'fieldName'    => $dimension,
					'inListFilter' => array(
						'values'        => $values,
						'caseSensitive' => null,
					),
				),
			),
			json_decode( wp_json_encode( $expression ), true )
		);
	}
}
