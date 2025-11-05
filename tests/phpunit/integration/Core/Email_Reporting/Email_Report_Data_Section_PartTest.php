<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Email_Report_Data_Section_PartTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Core\Email_Reporting\Email_Report_Data_Section_Part;
use Google\Site_Kit\Tests\TestCase;
use InvalidArgumentException;

class Email_Report_Data_Section_PartTest extends TestCase {

	public function test_getters_and_to_array() {
		$section = new Email_Report_Data_Section_Part(
			'traffic_sources',
			'Traffic Sources',
			array( 'Direct', 'Organic' ),
			array( '1234', '5678' ),
			array( '+5.0%', '-1.2%' ),
			array(
				'startDate'        => '2025-10-01',
				'endDate'          => '2025-10-31',
				'compareStartDate' => '2025-09-01',
				'compareEndDate'   => '2025-09-30',
			),
			'https://example.com/wp-admin/admin.php?page=googlesitekit-dashboard#/module/analytics-4'
		);

		$this->assertSame( 'traffic_sources', $section->get_section_key(), 'Section key should match constructor argument.' );
		$this->assertSame( 'Traffic Sources', $section->get_title(), 'Section title should match constructor argument.' );
		$this->assertSame( array( 'Direct', 'Organic' ), $section->get_labels(), 'Labels should match the provided array.' );
		$this->assertSame( array( '1234', '5678' ), $section->get_values(), 'Values should match the provided array.' );
		$this->assertSame( array( '+5.0%', '-1.2%' ), $section->get_trends(), 'Trends should match the provided array.' );
		$this->assertSame(
			array(
				'startDate'        => '2025-10-01',
				'endDate'          => '2025-10-31',
				'compareStartDate' => '2025-09-01',
				'compareEndDate'   => '2025-09-30',
			),
			$section->get_date_range(),
			'Provided date range should be preserved.'
		);
		$this->assertSame( 'https://example.com/wp-admin/admin.php?page=googlesitekit-dashboard#/module/analytics-4', $section->get_dashboard_link(), 'Dashboard link should match constructor argument.' );

		$this->assertFalse( $section->is_empty(), 'Section with values should not be empty' );

		$as_array = $section->to_array();
		$this->assertArrayHasKey( 'section_key', $as_array, 'Array representation should include section_key.' );
		$this->assertArrayHasKey( 'title', $as_array, 'Array representation should include title.' );
		$this->assertArrayHasKey( 'labels', $as_array, 'Array representation should include labels.' );
		$this->assertArrayHasKey( 'values', $as_array, 'Array representation should include values.' );
		$this->assertArrayHasKey( 'trends', $as_array, 'Array representation should include trends.' );
		$this->assertArrayHasKey( 'date_range', $as_array, 'Array representation should include date_range.' );
		$this->assertArrayHasKey( 'dashboard_link', $as_array, 'Array representation should include dashboard_link.' );
		$this->assertSame(
			array(
				'startDate'        => '2025-10-01',
				'endDate'          => '2025-10-31',
				'compareStartDate' => '2025-09-01',
				'compareEndDate'   => '2025-09-30',
			),
			$as_array['date_range'],
			'Array date_range should match getter output.'
		);
	}

	public function test_is_empty_true_when_values_empty() {
		$section = new Email_Report_Data_Section_Part(
			'empty',
			'Empty',
			array(),
			array()
		);
		$this->assertTrue( $section->is_empty(), 'Section with empty values should be empty' );
	}

	public function test_compare_dates_must_be_provided_together() {
		$this->expectException( InvalidArgumentException::class );
		new Email_Report_Data_Section_Part(
			'comparison',
			'Comparison',
			array( 'Label' ),
			array( 'Value' ),
			null,
			array(
				'startDate'        => '2025-10-01',
				'endDate'          => '2025-10-31',
				'compareStartDate' => '2025-09-01',
			),
		);
	}
}
