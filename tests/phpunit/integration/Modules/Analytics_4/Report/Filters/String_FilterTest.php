<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Report\Filters\String_FilterTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Report\Filters
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// phpcs:disable PHPCS.PHPUnit.RequireAssertionMessage.MissingAssertionMessage -- Ignoring assertion message rule, messages to be added in #10760

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Report\Filters;

use Google\Site_Kit\Modules\Analytics_4\Report\Filters\String_Filter;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 * @group Report
 * @group Filters
 */
class String_FilterTest extends TestCase {

	/**
	 * @var String_Filter
	 */
	protected $filter;

	public function set_up() {
		parent::set_up();
		$this->filter = new String_Filter();
	}

	public function test_short_notation() {
		$dimension_name  = 'dimensionA';
		$dimension_value = 'test';

		$expression = $this->filter->parse_filter_expression(
			$dimension_name,
			$dimension_value
		);

		$this->assertEquals(
			array(
				'filter' => array(
					'fieldName'    => $dimension_name,
					'stringFilter' => array(
						'matchType'     => 'EXACT',
						'value'         => $dimension_value,
						'caseSensitive' => null,
					),
				),
			),
			json_decode( wp_json_encode( $expression ), true )
		);
	}

	public function test_custom_match_type() {
		$value = 'test';

		$dimension_name  = 'dimensionA';
		$dimension_value = array(
			'value'     => $value,
			'matchType' => 'BEGINS_WITH',
		);

		$expression = $this->filter->parse_filter_expression(
			$dimension_name,
			$dimension_value
		);

		$this->assertEquals(
			array(
				'filter' => array(
					'fieldName'    => $dimension_name,
					'stringFilter' => array(
						'matchType'     => 'BEGINS_WITH',
						'value'         => $value,
						'caseSensitive' => null,
					),
				),
			),
			json_decode( wp_json_encode( $expression ), true )
		);
	}

	public function test_multiple_values() {
		$dimension_name  = 'dimensionA';
		$dimension_value = array(
			'value'     => array( 'a', 'b', 'c' ),
			'matchType' => 'ENDS_WITH',
		);

		$expression = $this->filter->parse_filter_expression(
			$dimension_name,
			$dimension_value
		);

		$this->assertEquals(
			array(
				'orGroup' => array(
					'expressions' => array(
						array(
							'filter' => array(
								'fieldName'    => $dimension_name,
								'stringFilter' => array(
									'matchType'     => 'ENDS_WITH',
									'value'         => 'a',
									'caseSensitive' => null,
								),
							),
						),
						array(
							'filter' => array(
								'fieldName'    => $dimension_name,
								'stringFilter' => array(
									'matchType'     => 'ENDS_WITH',
									'value'         => 'b',
									'caseSensitive' => null,
								),
							),
						),
						array(
							'filter' => array(
								'fieldName'    => $dimension_name,
								'stringFilter' => array(
									'matchType'     => 'ENDS_WITH',
									'value'         => 'c',
									'caseSensitive' => null,
								),
							),
						),
					),
				),
			),
			json_decode( wp_json_encode( $expression ), true )
		);
	}
}
