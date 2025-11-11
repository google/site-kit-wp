<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Report_Options\AdSense_Report_OptionsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting\Report_Options;

use Google\Site_Kit\Core\Email_Reporting\Report_Options\AdSense_Report_Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Email_Reporting
 */
class AdSense_Report_OptionsTest extends TestCase {

	public function test_total_earnings_includes_ad_source_filter_when_account_present() {
		$date_range = $this->get_date_range_payload();
		$builder    = new AdSense_Report_Options( $date_range, array(), 'pub-1234567890' );
		$options    = $builder->get_total_earnings_report_options();

		$this->assertArrayHasKey( 'dimensionFilters', $options, 'AdSense earnings request should include dimension filters when account is linked.' );
		$this->assertSame(
			'Google AdSense account (pub-1234567890)',
			$options['dimensionFilters']['adSourceName'],
			'AdSense earnings report should target the linked AdSense account.'
		);
	}

	public function test_total_earnings_skips_filter_without_account() {
		$date_range = $this->get_date_range_payload();
		$builder    = new AdSense_Report_Options( $date_range, array(), '' );
		$options    = $builder->get_total_earnings_report_options();

		$this->assertArrayNotHasKey( 'dimensionFilters', $options, 'AdSense earnings request should skip filters when no account ID is set.' );
	}

	public function test_total_earnings_uses_custom_date_range_when_provided() {
		$date_range = array(
			'startDate'        => '2024-03-01',
			'endDate'          => '2024-03-10',
			'compareStartDate' => '2024-02-20',
			'compareEndDate'   => '2024-02-29',
		);

		$builder = new AdSense_Report_Options( $date_range, array(), 'pub-1234567890' );
		$options = $builder->get_total_earnings_report_options();

		$this->assertSame( '2024-03-01', $options['startDate'], 'Custom date range should set expected start date.' );
		$this->assertSame( '2024-03-10', $options['endDate'], 'Custom date range should set expected end date.' );
		$this->assertSame( '2024-02-20', $options['compareStartDate'], 'Custom compare range should set expected start.' );
		$this->assertSame( '2024-02-29', $options['compareEndDate'], 'Custom compare range should set expected end.' );
	}

	/**
	 * Provides a reusable date range payload for tests.
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
