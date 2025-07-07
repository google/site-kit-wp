<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Report\ReportParsersTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Report
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Report;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Analytics_4\Report\ReportParsers;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 * @group Report
 */
class ReportParsersTest extends TestCase {

	/**
	 * @var ReportParsers
	 */
	protected $report_parsers;

	public function set_up() {
		parent::set_up();

		$this->report_parsers = new ReportParsers();
	}

	public function data_parse_dateranges_with_names() {
		return array(
			'with_no_date_range_names'        => array(
				array(
					'startDate' => '2025-01-01',
					'endDate'   => '2025-01-31',
				),
				array(),
			),
			'with_primary_date_range_name'    => array(
				array(
					'startDate'     => '2025-01-01',
					'endDate'       => '2025-01-31',
					'dateRangeName' => 'current_month',
				),
				array(
					array(
						'index' => 0,
						'name'  => 'current_month',
					),
				),
			),
			'with_comparison_date_range_name' => array(
				array(
					'startDate'            => '2025-01-01',
					'endDate'              => '2025-01-31',
					'compareStartDate'     => '2024-01-01',
					'compareEndDate'       => '2024-01-31',
					'compareDateRangeName' => 'previous_year',
				),
				array(
					array(
						'index' => 1,
						'name'  => 'previous_year',
					),
				),
			),
			'with_both_date_range_names'      => array(
				array(
					'startDate'            => '2025-01-01',
					'endDate'              => '2025-01-31',
					'compareStartDate'     => '2024-01-01',
					'compareEndDate'       => '2024-01-31',
					'dateRangeName'        => 'current_month',
					'compareDateRangeName' => 'previous_year',
				),
				array(
					array(
						'index' => 0,
						'name'  => 'current_month',
					),
					array(
						'index' => 1,
						'name'  => 'previous_year',
					),
				),
			),
		);
	}

	/**
	 * @dataProvider data_parse_dateranges_with_names
	 */
	public function test_parse_dateranges_with_names( $request_data, $expected_names ) {
		$data_request = new Data_Request( '', '', '', '', $request_data );
		$date_ranges  = $this->report_parsers->parse_dateranges( $data_request );

		foreach ( $expected_names as $expected_name ) {
			$index = $expected_name['index'];
			$name  = $expected_name['name'];

			$this->assertArrayHasKey( $index, $date_ranges, "Expected date range at index {$index}." );
			$this->assertEquals( $name, $date_ranges[ $index ]->getName(), "Expected date range at index {$index} to have name '{$name}'." );
		}

		// Verify that date ranges without explicitly set names don't have a name set.
		foreach ( $date_ranges as $index => $date_range ) {
			$has_expected_name = false;
			foreach ( $expected_names as $expected_name ) {
				if ( $expected_name['index'] === $index ) {
					$has_expected_name = true;
					break;
				}
			}

			if ( ! $has_expected_name ) {
				$this->assertNull( $date_range->getName(), "Expected date range at index {$index} to not have a name." );
			}
		}
	}
}
