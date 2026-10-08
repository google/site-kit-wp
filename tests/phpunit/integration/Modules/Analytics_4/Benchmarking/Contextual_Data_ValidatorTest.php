<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking\Contextual_Data_ValidatorTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking;

use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Contextual_Data_Validator;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Analytics_4
 */
class Contextual_Data_ValidatorTest extends TestCase {

	public function test_validate__removes_a_key_the_response_does_not_define_and_keeps_the_other_keys() {
		$validated_data = ( new Contextual_Data_Validator() )->validate(
			array(
				'browsers' => array(
					array(
						'label'    => 'Chrome',
						'current'  => 120,
						'previous' => 100,
					),
				),
				'channels' => array(
					array(
						'label'    => 'Organic Search',
						'current'  => 300,
						'previous' => 200,
					),
				),
			)
		);

		$this->assertSame(
			array(
				'channels' => array(
					array(
						'label'    => 'Organic Search',
						'current'  => 300,
						'previous' => 200,
					),
				),
			),
			$validated_data,
			'The `browsers` key should be removed, and the `channels` key kept.'
		);
	}

	public function test_validate__removes_a_row_that_misses_a_field_and_keeps_the_other_rows_of_its_key() {
		$validated_data = ( new Contextual_Data_Validator() )->validate(
			array(
				'searchQueries' => array(
					array(
						'label'           => 'plant garlic',
						'current'         => 300,
						'previous'        => 200,
						'positionCurrent' => 3.4,
					),
					array(
						'label'            => 'raised beds',
						'current'          => 280,
						'previous'         => 200,
						'positionCurrent'  => 5.0,
						'positionPrevious' => 5.5,
					),
				),
			)
		);

		$this->assertSame(
			array(
				'searchQueries' => array(
					array(
						'label'            => 'raised beds',
						'current'          => 280,
						'previous'         => 200,
						'positionCurrent'  => 5.0,
						'positionPrevious' => 5.5,
					),
				),
			),
			$validated_data,
			'The `plant garlic` row, which has no `positionPrevious`, should be removed, and the `raised beds` row kept.'
		);
	}

	public function test_validate__removes_a_row_whose_count_is_not_numeric_and_stores_a_numeric_string_as_an_integer() {
		$validated_data = ( new Contextual_Data_Validator() )->validate(
			array(
				'devices' => array(
					array(
						'label'    => 'mobile',
						'current'  => 'many',
						'previous' => 200,
					),
					array(
						'label'    => 'desktop',
						'current'  => '12',
						'previous' => 8,
					),
				),
			)
		);

		$this->assertSame(
			array(
				'devices' => array(
					array(
						'label'    => 'desktop',
						'current'  => 12,
						'previous' => 8,
					),
				),
			),
			$validated_data,
			'The `mobile` row, whose `current` is `many`, should be removed, and the `"12"` of the `desktop` row stored as `12`.'
		);
	}

	public function test_validate__stores_an_average_position_as_a_float_and_every_other_number_as_an_integer() {
		$validated_data = ( new Contextual_Data_Validator() )->validate(
			array(
				'searchQueries' => array(
					array(
						'label'            => 'plant garlic',
						'current'          => 300.7,
						'previous'         => '200',
						'positionCurrent'  => '3.4',
						'positionPrevious' => 5,
					),
				),
				'content'       => array(
					array(
						'url'              => '/plant-garlic/',
						'title'            => 'How to plant garlic',
						'publishedDaysAgo' => '14',
						'current'          => 40.2,
						'previous'         => '10',
					),
				),
			)
		);

		$this->assertSame(
			array(
				'searchQueries' => array(
					array(
						'label'            => 'plant garlic',
						'current'          => 300,
						'previous'         => 200,
						'positionCurrent'  => 3.4,
						'positionPrevious' => 5.0,
					),
				),
				'content'       => array(
					array(
						'url'              => '/plant-garlic/',
						'title'            => 'How to plant garlic',
						'publishedDaysAgo' => 14,
						'current'          => 40,
						'previous'         => 10,
					),
				),
			),
			$validated_data,
			'The two average positions should be stored as floats, and every count, including `publishedDaysAgo`, as an integer.'
		);
	}

	public function test_validate__keeps_a_search_query_row_with_no_average_position_in_one_period() {
		$validated_data = ( new Contextual_Data_Validator() )->validate(
			array(
				'searchQueries' => array(
					array(
						'label'            => 'plant garlic',
						'current'          => 300,
						'previous'         => 0,
						'positionCurrent'  => 3.4,
						'positionPrevious' => null,
					),
				),
			)
		);

		$this->assertSame(
			array(
				'searchQueries' => array(
					array(
						'label'            => 'plant garlic',
						'current'          => 300,
						'previous'         => 0,
						'positionCurrent'  => 3.4,
						'positionPrevious' => null,
					),
				),
			),
			$validated_data,
			'A `null` `positionPrevious` should be kept, for a query not reported in the compare period.'
		);
	}

	public function test_validate__removes_a_row_whose_count_is_null() {
		$validated_data = ( new Contextual_Data_Validator() )->validate(
			array(
				'referrers' => array(
					array(
						'label'    => 'a.example.com',
						'current'  => null,
						'previous' => 20,
					),
				),
			)
		);

		$this->assertSame( array( 'referrers' => array() ), $validated_data, 'A row whose `current` is `null` should be removed, since only an average position can be `null`.' );
	}

	public function test_validate__removes_a_row_whose_number_is_not_finite() {
		$validated_data = ( new Contextual_Data_Validator() )->validate(
			array(
				'searchQueries' => array(
					array(
						'label'            => 'plant garlic',
						'current'          => 300,
						'previous'         => 200,
						'positionCurrent'  => NAN,
						'positionPrevious' => 4.8,
					),
					array(
						'label'            => 'raised beds',
						'current'          => INF,
						'previous'         => 200,
						'positionCurrent'  => 5.0,
						'positionPrevious' => 5.5,
					),
				),
			)
		);

		$this->assertSame( array( 'searchQueries' => array() ), $validated_data, 'A row with a `NAN` or an `INF` value should be removed, since `wp_json_encode()` cannot encode it.' );
	}

	public function test_validate__removes_a_row_whose_label_is_not_a_string_or_a_number() {
		$validated_data = ( new Contextual_Data_Validator() )->validate(
			array(
				'categories' => array(
					array(
						'label'    => array( 'Garden' ),
						'current'  => 60,
						'previous' => 20,
					),
					array(
						'label'    => 2026,
						'current'  => 15,
						'previous' => 30,
					),
				),
			)
		);

		$this->assertSame(
			array(
				'categories' => array(
					array(
						'label'    => '2026',
						'current'  => 15,
						'previous' => 30,
					),
				),
			),
			$validated_data,
			'The row whose `label` is an array should be removed, and the `2026` label of the other row stored as a string.'
		);
	}

	public function test_validate__removes_a_field_the_key_does_not_define() {
		$validated_data = ( new Contextual_Data_Validator() )->validate(
			array(
				'channels' => array(
					array(
						'label'    => 'Organic Search',
						'current'  => 300,
						'previous' => 200,
						'color'    => '<b>green</b>',
					),
				),
			)
		);

		$this->assertSame(
			array(
				'channels' => array(
					array(
						'label'    => 'Organic Search',
						'current'  => 300,
						'previous' => 200,
					),
				),
			),
			$validated_data,
			'The `color` field, which a `channels` row does not define, should be removed.'
		);
	}

	public function test_validate__removes_a_key_whose_value_is_not_a_list_of_rows() {
		$validated_data = ( new Contextual_Data_Validator() )->validate(
			array(
				'channels'   => 'Organic Search',
				'devices'    => array(
					'label'    => 'mobile',
					'current'  => 240,
					'previous' => 200,
				),
				'visitorMix' => array(
					'new' => array(
						'label'    => 'new',
						'current'  => 240,
						'previous' => 200,
					),
				),
			)
		);

		$this->assertSame( array(), $validated_data, 'A key whose value is a string, a single row, or rows keyed by label should be removed.' );
	}

	public function test_validate__removes_a_row_that_is_not_an_array() {
		$validated_data = ( new Contextual_Data_Validator() )->validate(
			array(
				'channels' => array(
					'Organic Search',
					array(
						'label'    => 'Direct',
						'current'  => 118,
						'previous' => 137,
					),
				),
			)
		);

		$this->assertSame(
			array(
				'channels' => array(
					array(
						'label'    => 'Direct',
						'current'  => 118,
						'previous' => 137,
					),
				),
			),
			$validated_data,
			'The `Organic Search` string should be removed as a row, and the `Direct` row kept.'
		);
	}
}
