<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Search_Console\Benchmarking\Report_OptionsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Search_Console\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Search_Console\Benchmarking;

use Google\Site_Kit\Modules\Search_Console\Benchmarking\Report_Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Search_Console
 */
class Report_OptionsTest extends TestCase {

	public function test_get_search_query_requests__asks_for_the_queries_their_pages_and_their_devices_of_each_period_with_the_row_limit() {
		$report_options = new Report_Options( '2026-08-19', '2026-09-15', '2026-07-22', '2026-08-18', 50 );
		$requests       = array();

		foreach ( array(
			''         => 'query',
			'-pages'   => 'query,page',
			'-devices' => 'query,device',
		) as $suffix => $dimensions ) {
			$requests[] = array(
				'identifier' => "current{$suffix}",
				'startDate'  => '2026-08-19',
				'endDate'    => '2026-09-15',
				'dimensions' => $dimensions,
				'rowLimit'   => 50,
			);
			$requests[] = array(
				'identifier' => "previous{$suffix}",
				'startDate'  => '2026-07-22',
				'endDate'    => '2026-08-18',
				'dimensions' => $dimensions,
				'rowLimit'   => 50,
			);
		}

		$this->assertSame(
			$requests,
			$report_options->get_search_query_requests(),
			'There should be a `query`, a `query,page` and a `query,device` report for the selected period and for the compare period, each limited to 50 rows.'
		);
	}

	public function test_get_search_clicks_requests__asks_for_the_clicks_of_each_period_without_dimensions() {
		$report_options = new Report_Options( '2026-08-19', '2026-09-15', '2026-07-22', '2026-08-18', 50 );

		$this->assertSame(
			array(
				array(
					'identifier' => 'current-totals',
					'startDate'  => '2026-08-19',
					'endDate'    => '2026-09-15',
				),
				array(
					'identifier' => 'previous-totals',
					'startDate'  => '2026-07-22',
					'endDate'    => '2026-08-18',
				),
			),
			$report_options->get_search_clicks_requests(),
			'There should be a report of the site\'s clicks without dimensions for the selected period and for the compare period.'
		);
	}
}
