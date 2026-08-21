<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Email_Reporting\Report_Data_ProcessorTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Email_Reporting;

use Google\Site_Kit\Modules\Analytics_4\Email_Reporting\Report_Data_Processor;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Email_Reporting
 */
class Report_Data_ProcessorTest extends TestCase {

	/**
	 * Data processor under test.
	 *
	 * @var Report_Data_Processor
	 */
	private $processor;

	public function set_up() {
		parent::set_up();
		$this->processor = new Report_Data_Processor();
	}

	/**
	 * Builds one report row.
	 *
	 * @param array $dimensions Dimension values, keyed by dimension name.
	 * @param array $metrics    Metric values, keyed by metric name.
	 * @return array Report row.
	 */
	private function build_row( array $dimensions, array $metrics ) {
		return array(
			'dimensions' => $dimensions,
			'metrics'    => $metrics,
		);
	}

	public function test_sum_metric_by_group__adds_every_row_to_one_group_when_the_dimension_is_an_empty_string() {
		$rows = array(
			$this->build_row(
				array(
					'eventName' => 'contact',
					'dateRange' => 'date_range_0',
				),
				array( 'eventCount' => '30' )
			),
			$this->build_row(
				array(
					'eventName' => 'submit_lead_form',
					'dateRange' => 'date_range_0',
				),
				array( 'eventCount' => '55' )
			),
			$this->build_row(
				array(
					'eventName' => 'contact',
					'dateRange' => 'date_range_1',
				),
				array( 'eventCount' => '25' )
			),
		);

		$this->assertSame(
			array(
				'' => array(
					'date_range_0' => 85.0,
					'date_range_1' => 25.0,
				),
			),
			$this->processor->sum_metric_by_group( $rows, '', 'eventCount' ),
			'sum_metric_by_group() should add every event name into one group named by an empty string, keeping each date range apart.'
		);
	}

	public function test_sum_metric_by_group__adds_up_each_group_separately() {
		$rows = array(
			$this->build_row(
				array(
					'customEvent:googlesitekit_event_provider' => 'woocommerce',
					'dateRange' => 'date_range_0',
				),
				array( 'eventCount' => '116' )
			),
			$this->build_row(
				array(
					'customEvent:googlesitekit_event_provider' => 'woocommerce',
					'dateRange' => 'date_range_1',
				),
				array( 'eventCount' => '120' )
			),
			$this->build_row(
				array(
					'customEvent:googlesitekit_event_provider' => 'easy-digital-downloads',
					'dateRange' => 'date_range_0',
				),
				array( 'eventCount' => '21' )
			),
		);

		$this->assertSame(
			array(
				'woocommerce'            => array(
					'date_range_0' => 116.0,
					'date_range_1' => 120.0,
				),
				'easy-digital-downloads' => array(
					'date_range_0' => 21.0,
				),
			),
			$this->processor->sum_metric_by_group( $rows, 'customEvent:googlesitekit_event_provider', 'eventCount' ),
			'sum_metric_by_group() should keep each provider in its own group.'
		);
	}

	public function test_sum_metric_by_group__leaves_out_a_row_whose_metric_is_missing_or_not_a_number() {
		$rows = array(
			$this->build_row(
				array( 'dateRange' => 'date_range_0' ),
				array( 'sessions' => '2000' )
			),
			$this->build_row(
				array( 'dateRange' => 'date_range_0' ),
				array( 'engagementRate' => '0.55' )
			),
			$this->build_row(
				array( 'dateRange' => 'date_range_0' ),
				array( 'sessions' => 'none' )
			),
		);

		$this->assertSame(
			array( '' => array( 'date_range_0' => 2000.0 ) ),
			$this->processor->sum_metric_by_group( $rows, '', 'sessions' ),
			'sum_metric_by_group() should count only the rows holding a numeric value for the metric it sums.'
		);
	}

	public function test_sum_metric_by_group__reads_a_row_with_no_date_range_as_the_current_period() {
		$rows = array(
			$this->build_row(
				array( 'eventName' => 'purchase' ),
				array( 'eventCount' => '7' )
			),
		);

		$this->assertSame(
			array( '' => array( 'date_range_0' => 7.0 ) ),
			$this->processor->sum_metric_by_group( $rows, '', 'eventCount' ),
			'sum_metric_by_group() should read a row with no dateRange dimension as the current period.'
		);
	}

	public function test_sum_metric_by_group__returns_an_empty_array_when_the_rows_are_not_an_array() {
		$this->assertSame(
			array(),
			$this->processor->sum_metric_by_group( null, '', 'eventCount' ),
			'sum_metric_by_group() should return an empty array when it receives no rows to read.'
		);
	}

	public function test_compute_trend__returns_the_percentage_change_between_the_two_values() {
		$this->assertSame(
			16.0,
			$this->processor->compute_trend( 116, 100 ),
			'compute_trend() should return 16.0 for a rise from 100 to 116.'
		);
		$this->assertSame(
			-20.0,
			$this->processor->compute_trend( 80, 100 ),
			'compute_trend() should return -20.0 for a fall from 100 to 80.'
		);
	}

	public function test_compute_trend__returns_null_when_the_previous_value_is_zero() {
		$this->assertNull(
			$this->processor->compute_trend( 116, 0 ),
			'compute_trend() should return null when the previous value is zero, because a change from zero has no percentage.'
		);
	}

	public function test_compute_trend__returns_null_when_either_value_is_not_a_number() {
		$this->assertNull(
			$this->processor->compute_trend( null, 100 ),
			'compute_trend() should return null when the current value is not a number.'
		);
		$this->assertNull(
			$this->processor->compute_trend( 116, 'none' ),
			'compute_trend() should return null when the previous value is not a number.'
		);
	}
}
