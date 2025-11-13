<?php
namespace Google\Site_Kit\Tests\Modules\Search_Console\Email_Reporting;

use Google\Site_Kit\Modules\Search_Console\Email_Reporting\Report_Data_Processor as Search_Console_Report_Data_Processor;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Email_Reporting
 */
class Search_Console_Report_Data_ProcessorTest extends TestCase {

	/**
	 * Processor instance.
	 *
	 * @var Search_Console_Report_Data_Processor
	 */
	private $helper;

	public function set_up() {
		parent::set_up();
		$this->helper = new Search_Console_Report_Data_Processor();
	}

	public function test_sort_rows__by_field_orders_descending_by_default() {
		$rows = array(
			array(
				'ctr'    => 0.10,
				'clicks' => 5,
			),
			array(
				'ctr'    => 0.25,
				'clicks' => 2,
			),
			array(
				'ctr'    => 0.05,
				'clicks' => 8,
			),
		);

		$sorted_rows = $this->helper->sort_rows_by_field( $rows, 'ctr' );

		$this->assertSame( 0.25, $sorted_rows[0]['ctr'], 'Rows should be ordered descending by default.' );
		$this->assertSame( 0.10, $sorted_rows[1]['ctr'], 'Rows should be ordered descending by default.' );
		$this->assertSame( 0.05, $sorted_rows[2]['ctr'], 'Rows should be ordered descending by default.' );
	}

	public function test_sort_rows_by_field__supports_ascending_order() {
		$row_a = (object) array( 'clicks' => 10 );
		$row_b = (object) array( 'clicks' => 2 );
		$row_c = (object) array( 'clicks' => 5 );

		$sorted_rows = $this->helper->sort_rows_by_field(
			array( $row_a, $row_b, $row_c ),
			'clicks',
			'asc'
		);

		$this->assertSame( 2, $sorted_rows[0]->clicks, 'Ascending sort should place lowest clicks first.' );
		$this->assertSame( 5, $sorted_rows[1]->clicks, 'Ascending sort should place middle clicks second.' );
		$this->assertSame( 10, $sorted_rows[2]->clicks, 'Ascending sort should place highest clicks last.' );
	}

	public function test_partition_rows_by_period__splits_rows_evenly() {
		$rows = array();
		for ( $i = 1; $i <= 56; $i++ ) {
			$rows[] = array( 'impressions' => $i );
		}

		$result = $this->helper->partition_rows_by_period( $rows, 28 );

		$this->assertCount( 28, $result['compare'], 'Compare period should contain the expected number of rows.' );
		$this->assertCount( 28, $result['current'], 'Current period should contain the expected number of rows.' );
		$this->assertSame( 1, $result['compare'][0]['impressions'], 'Compare period should start with the first row.' );
		$this->assertSame( 28, $result['compare'][27]['impressions'], 'Compare period should end on the expected row.' );
		$this->assertSame( 29, $result['current'][0]['impressions'], 'Current period should start immediately after compare period.' );
		$this->assertSame( 56, $result['current'][27]['impressions'], 'Current period should end on the expected row.' );
	}

	public function test_sum_field_by_period__returns_totals() {
		$rows = array();
		for ( $i = 1; $i <= 56; $i++ ) {
			$rows[] = array( 'impressions' => $i );
		}

		$totals = $this->helper->sum_field_by_period( $rows, 'impressions', 28 );

		$this->assertSame( 406.0, $totals['compare'], 'Compare total should match expected sum.' );
		$this->assertSame( 1190.0, $totals['current'], 'Current total should match expected sum.' );
	}
}
