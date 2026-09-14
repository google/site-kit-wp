<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Search_Console\Email_Reporting\Report_Data_BuilderTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Search_Console\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Search_Console\Email_Reporting;

use Google\Site_Kit\Modules\Search_Console\Email_Reporting\Report_Data_Builder;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Email_Reporting
 */
class Report_Data_BuilderTest extends TestCase {

	/**
	 * Builder instance.
	 *
	 * @var Report_Data_Builder
	 */
	private $builder;

	public function set_up() {
		parent::set_up();
		$this->builder = new Report_Data_Builder();
	}

	public function test_build_list_with_compare__page_new_to_the_compare_period_has_null_trend() {
		$current_rows = array(
			array(
				'keys'   => array( '/blog/new-launch/' ),
				'clicks' => 12,
			),
		);
		// The compare period only has data for a different page, so `/blog/new-launch/`
		// has nothing to be measured against.
		$compare_rows = array(
			array(
				'keys'   => array( '/pricing/' ),
				'clicks' => 4,
			),
		);

		$payload = $this->builder->build_section_payload_from_search_console(
			array(
				'current' => $current_rows,
				'compare' => $compare_rows,
			),
			'top_pages_by_clicks'
		);

		$this->assertSame( array( null ), $payload['trends'], 'A page with nothing to compare against should not get a fabricated 0% trend.' );
	}

	public function test_build_list_with_compare__returns_signed_percentage_when_a_prior_value_exists() {
		$current_rows = array(
			array(
				'keys'   => array( '/pricing/' ),
				'clicks' => 15,
			),
		);
		$compare_rows = array(
			array(
				'keys'   => array( '/pricing/' ),
				'clicks' => 10,
			),
		);

		$payload = $this->builder->build_section_payload_from_search_console(
			array(
				'current' => $current_rows,
				'compare' => $compare_rows,
			),
			'top_pages_by_clicks'
		);

		$this->assertSame( array( 50.0 ), $payload['trends'], 'Clicks going from 10 to 15 should be reported as a 50% increase.' );
	}

	public function test_build_growth_list_with_compare__page_absent_from_the_compare_period_has_null_trend() {
		$current_rows = array(
			array(
				'keys'   => array( '/blog/new-launch/' ),
				'clicks' => 8,
			),
		);
		// No Search Console data at all for the compare period (e.g. the page didn't exist yet).
		$compare_rows = array();

		$payload = $this->builder->build_section_payload_from_search_console(
			array(
				'current' => $current_rows,
				'compare' => $compare_rows,
			),
			'pages_clicks_increase'
		);

		$this->assertSame( array( null ), $payload['trends'], 'A page absent from the compare period should not be credited with a 0% increase.' );
	}

	public function test_build_growth_list_with_compare__returns_percentage_increase_when_a_prior_value_exists() {
		$current_rows = array(
			array(
				'keys'   => array( '/pricing/' ),
				'clicks' => 20,
			),
		);
		$compare_rows = array(
			array(
				'keys'   => array( '/pricing/' ),
				'clicks' => 10,
			),
		);

		$payload = $this->builder->build_section_payload_from_search_console(
			array(
				'current' => $current_rows,
				'compare' => $compare_rows,
			),
			'pages_clicks_increase'
		);

		$this->assertSame( array( 100.0 ), $payload['trends'], 'Clicks doubling from 10 to 20 should be reported as a 100% increase.' );
	}
}
