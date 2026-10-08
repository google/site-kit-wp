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

	public function test_get_search_query_requests__asks_for_the_queries_of_each_period_with_the_row_limit() {
		$report_options = new Report_Options( '2026-08-19', '2026-09-15', '2026-07-22', '2026-08-18', 50 );

		$this->assertSame(
			array(
				array(
					'identifier' => 'current',
					'startDate'  => '2026-08-19',
					'endDate'    => '2026-09-15',
					'dimensions' => 'query',
					'rowLimit'   => 50,
				),
				array(
					'identifier' => 'previous',
					'startDate'  => '2026-07-22',
					'endDate'    => '2026-08-18',
					'dimensions' => 'query',
					'rowLimit'   => 50,
				),
			),
			$report_options->get_search_query_requests(),
			'There should be one `query` report for the selected period and one for the compare period, each limited to 50 rows.'
		);
	}
}
