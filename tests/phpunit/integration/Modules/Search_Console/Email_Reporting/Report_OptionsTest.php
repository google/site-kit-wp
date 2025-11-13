<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Search_Console\Email_Reporting\Report_OptionsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Search_Console\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Search_Console\Email_Reporting;

use Google\Site_Kit\Modules\Search_Console\Email_Reporting\Report_Options as Search_Console_Report_Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Email_Reporting
 */
class Search_Console_Report_OptionsTest extends TestCase {

	public function test_total_impressions_span_combined_range() {
		$builder = new Search_Console_Report_Options( $this->get_date_range_payload() );
		$options = $builder->get_total_impressions_options();

		$this->assertArrayHasKey( 'startDate', $options, 'Total impressions request should include startDate.' );
		$this->assertArrayHasKey( 'endDate', $options, 'Total impressions request should include endDate.' );
		$this->assertSame( 'date', $options['dimensions'], 'Total impressions should request daily data.' );
		$this->assertArrayNotHasKey( 'compareStartDate', $options, 'Search Console requests merge both periods into one range.' );
	}

	public function test_top_pages_use_current_range() {
		$builder = new Search_Console_Report_Options( $this->get_date_range_payload() );
		$options = $builder->get_top_pages_by_clicks_options();

		$this->assertArrayHasKey( 'startDate', $options, 'Top pages request should include startDate.' );
		$this->assertArrayHasKey( 'endDate', $options, 'Top pages request should include endDate.' );
		$this->assertSame( 'page', $options['dimensions'], 'Top pages should group by page dimension.' );
		$this->assertSame( 10, $options['limit'], 'Top pages should limit entries.' );
	}

	public function test_custom_ranges_are_respected() {
		$date_range = array(
			'startDate'        => '2024-04-01',
			'endDate'          => '2024-04-10',
			'compareStartDate' => '2024-03-20',
			'compareEndDate'   => '2024-03-29',
		);

		$builder = new Search_Console_Report_Options( $date_range );

		$pages_options = $builder->get_top_pages_by_clicks_options();
		$this->assertSame( '2024-04-01', $pages_options['startDate'], 'Top pages request should use provided start date.' );
		$this->assertSame( '2024-04-10', $pages_options['endDate'], 'Top pages request should use provided end date.' );

		$impressions_options = $builder->get_total_impressions_options();
		$this->assertSame( '2024-03-20', $impressions_options['startDate'], 'Combined range should start with compare period.' );
		$this->assertSame( '2024-04-10', $impressions_options['endDate'], 'Combined range should end with current period end.' );
	}

	/**
	 * Provides a reusable date range payload for Search Console tests.
	 *
	 * @return array
	 */
	private function get_date_range_payload() {
		return array(
			'startDate'        => '2024-01-01',
			'endDate'          => '2024-01-07',
			'compareStartDate' => '2023-12-25',
			'compareEndDate'   => '2023-12-31',
		);
	}
}
