<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking\Report_OptionsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking;

use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Report_Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Analytics_4
 */
class Report_OptionsTest extends TestCase {

	/**
	 * Report options for `2026-08-19` to `2026-09-15`, a 28-day period.
	 *
	 * @var Report_Options
	 */
	private $report_options;

	public function set_up() {
		parent::set_up();

		$this->report_options = new Report_Options( '2026-08-19', '2026-09-15' );
	}

	public function test_get_compare_range__returns_the_28_days_before_a_28_day_period() {
		$this->assertSame(
			array(
				'startDate' => '2026-07-22',
				'endDate'   => '2026-08-18',
			),
			$this->report_options->get_compare_range(),
			'The `get_compare_range()` method should return 2026-07-22 to 2026-08-18 for 2026-08-19 to 2026-09-15.'
		);
	}

	public function test_get_compare_range__returns_the_90_days_before_a_90_day_period() {
		$report_options = new Report_Options( '2026-06-18', '2026-09-15' );

		$this->assertSame(
			array(
				'startDate' => '2026-03-20',
				'endDate'   => '2026-06-17',
			),
			$report_options->get_compare_range(),
			'The `get_compare_range()` method should return the 90 days from 2026-03-20 to 2026-06-17 for 2026-06-18 to 2026-09-15.'
		);
	}

	public function test_get_compare_range__returns_the_day_before_a_single_day() {
		$report_options = new Report_Options( '2026-09-15', '2026-09-15' );

		$this->assertSame(
			array(
				'startDate' => '2026-09-14',
				'endDate'   => '2026-09-14',
			),
			$report_options->get_compare_range(),
			'The `get_compare_range()` method should return 2026-09-14 alone for a period of 2026-09-15 alone.'
		);
	}

	public function test_get_daily_series_options__counts_visitors_by_day_over_the_395_days_ending_on_the_end_date() {
		$this->assertSame(
			array(
				'startDate'  => '2025-08-17',
				'endDate'    => '2026-09-15',
				'metrics'    => array(
					array( 'name' => 'totalUsers' ),
				),
				'dimensions' => array(
					array( 'name' => 'date' ),
				),
				'orderby'    => array(
					array(
						'dimension' => array( 'dimensionName' => 'date' ),
					),
				),
			),
			$this->report_options->get_daily_series_options(),
			'The `get_daily_series_options()` method should ask for `totalUsers` by `date`, oldest first, from 2025-08-17 to 2026-09-15.'
		);
	}

	public function test_get_daily_series_options__covers_the_same_395_days_for_any_period_length() {
		$week_options       = ( new Report_Options( '2026-09-09', '2026-09-15' ) )->get_daily_series_options();
		$ninety_day_options = ( new Report_Options( '2026-06-18', '2026-09-15' ) )->get_daily_series_options();

		$this->assertSame( '2025-08-17', $week_options['startDate'], 'The daily series of a 7-day period ending on 2026-09-15 should start on 2025-08-17.' );
		$this->assertSame( '2025-08-17', $ninety_day_options['startDate'], 'The daily series of a 90-day period ending on 2026-09-15 should start on 2025-08-17.' );
	}

	public function test_get_channels_options__counts_visitors_by_channel_in_both_periods() {
		$this->assertSame(
			array(
				'startDate'        => '2026-08-19',
				'endDate'          => '2026-09-15',
				'compareStartDate' => '2026-07-22',
				'compareEndDate'   => '2026-08-18',
				'metrics'          => array(
					array( 'name' => 'totalUsers' ),
				),
				'dimensions'       => array(
					array( 'name' => 'sessionDefaultChannelGrouping' ),
				),
				'orderby'          => array(
					array(
						'metric' => array( 'metricName' => 'totalUsers' ),
						'desc'   => true,
					),
				),
				'limit'            => 50,
			),
			$this->report_options->get_channels_options(),
			'The `get_channels_options()` method should ask for up to 50 rows of `totalUsers` by `sessionDefaultChannelGrouping`, in the selected period and the compare period.'
		);
	}

	public function test_get_devices_options__counts_visitors_by_device_category_in_both_periods() {
		$this->assertSame(
			array(
				'startDate'        => '2026-08-19',
				'endDate'          => '2026-09-15',
				'compareStartDate' => '2026-07-22',
				'compareEndDate'   => '2026-08-18',
				'metrics'          => array(
					array( 'name' => 'totalUsers' ),
				),
				'dimensions'       => array(
					array( 'name' => 'deviceCategory' ),
				),
				'orderby'          => array(
					array(
						'metric' => array( 'metricName' => 'totalUsers' ),
						'desc'   => true,
					),
				),
				'limit'            => 50,
			),
			$this->report_options->get_devices_options(),
			'The `get_devices_options()` method should ask for up to 50 rows of `totalUsers` by `deviceCategory`, in the selected period and the compare period.'
		);
	}

	public function test_get_visitor_mix_options__counts_new_and_returning_visitors_in_both_periods() {
		$this->assertSame(
			array(
				'startDate'        => '2026-08-19',
				'endDate'          => '2026-09-15',
				'compareStartDate' => '2026-07-22',
				'compareEndDate'   => '2026-08-18',
				'metrics'          => array(
					array( 'name' => 'totalUsers' ),
				),
				'dimensions'       => array(
					array( 'name' => 'newVsReturning' ),
				),
				'orderby'          => array(
					array(
						'metric' => array( 'metricName' => 'totalUsers' ),
						'desc'   => true,
					),
				),
				'limit'            => 50,
			),
			$this->report_options->get_visitor_mix_options(),
			'The `get_visitor_mix_options()` method should ask for up to 50 rows of `totalUsers` by `newVsReturning`, in the selected period and the compare period.'
		);
	}

	public function test_get_referrers_options__counts_visitors_by_referring_source_in_both_periods() {
		$this->assertSame(
			array(
				'startDate'        => '2026-08-19',
				'endDate'          => '2026-09-15',
				'compareStartDate' => '2026-07-22',
				'compareEndDate'   => '2026-08-18',
				'metrics'          => array(
					array( 'name' => 'totalUsers' ),
				),
				'dimensions'       => array(
					array( 'name' => 'sessionSource' ),
				),
				'orderby'          => array(
					array(
						'metric' => array( 'metricName' => 'totalUsers' ),
						'desc'   => true,
					),
				),
				'limit'            => 50,
			),
			$this->report_options->get_referrers_options(),
			'The `get_referrers_options()` method should ask for up to 50 rows of `totalUsers` by `sessionSource`, in the selected period and the compare period.'
		);
	}

	public function test_get_content_options__counts_visitors_by_post_with_a_post_date_in_both_periods() {
		$this->assertSame(
			array(
				'startDate'        => '2026-08-19',
				'endDate'          => '2026-09-15',
				'compareStartDate' => '2026-07-22',
				'compareEndDate'   => '2026-08-18',
				'metrics'          => array(
					array( 'name' => 'totalUsers' ),
				),
				'dimensions'       => array(
					array( 'name' => 'pagePath' ),
					array( 'name' => 'pageTitle' ),
					array( 'name' => 'customEvent:googlesitekit_post_date' ),
				),
				'orderby'          => array(
					array(
						'metric' => array( 'metricName' => 'totalUsers' ),
						'desc'   => true,
					),
				),
				'limit'            => 50,
				'dimensionFilters' => array(
					'customEvent:googlesitekit_post_date' => array(
						'filterType'    => 'emptyFilter',
						'notExpression' => true,
					),
				),
			),
			$this->report_options->get_content_options(),
			'The `get_content_options()` method should ask for up to 50 rows of `totalUsers` by `pagePath`, `pageTitle` and `customEvent:googlesitekit_post_date`, in both periods, leaving out the rows with no post date.'
		);
	}

	public function test_get_categories_options__counts_visitors_by_post_category_in_both_periods() {
		$this->assertSame(
			array(
				'startDate'        => '2026-08-19',
				'endDate'          => '2026-09-15',
				'compareStartDate' => '2026-07-22',
				'compareEndDate'   => '2026-08-18',
				'metrics'          => array(
					array( 'name' => 'totalUsers' ),
				),
				'dimensions'       => array(
					array( 'name' => 'customEvent:googlesitekit_post_categories' ),
				),
				'orderby'          => array(
					array(
						'metric' => array( 'metricName' => 'totalUsers' ),
						'desc'   => true,
					),
				),
				'limit'            => 50,
				'dimensionFilters' => array(
					'customEvent:googlesitekit_post_categories' => array(
						'filterType'    => 'emptyFilter',
						'notExpression' => true,
					),
				),
			),
			$this->report_options->get_categories_options(),
			'The `get_categories_options()` method should ask for up to 50 rows of `totalUsers` by `customEvent:googlesitekit_post_categories`, in both periods, leaving out the rows with no category.'
		);
	}
}
