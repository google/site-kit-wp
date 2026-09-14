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

	public function test_getters() {
		$section = new Email_Report_Data_Section_Part(
			'traffic_sources',
			array(
				'title'          => 'Traffic Sources',
				'labels'         => array( 'Direct', 'Organic' ),
				'values'         => array( '1234', '5678' ),
				'trends'         => array( '+5.0%', '-1.2%' ),
				'date_range'     => array(
					'startDate'        => '2025-10-01',
					'endDate'          => '2025-10-31',
					'compareStartDate' => '2025-09-01',
					'compareEndDate'   => '2025-09-30',
				),
				'dashboard_link' => 'https://example.com/wp-admin/admin.php?page=googlesitekit-dashboard#/module/analytics-4',
			)
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
	}

	public function test_is_empty_true_when_values_empty() {
		$section = new Email_Report_Data_Section_Part(
			'empty',
			array(
				'title'  => 'Empty',
				'labels' => array(),
				'values' => array(),
			)
		);
		$this->assertTrue( $section->is_empty(), 'Section with empty values should be empty' );
	}

	public function test_get_groups__returns_the_groups_the_section_receives() {
		$groups = array(
			array(
				'label'   => 'WooCommerce',
				'metrics' => array(
					array(
						'label' => 'Total sales',
						'value' => '116',
						'trend' => 16.0,
					),
				),
			),
		);

		$section = new Email_Report_Data_Section_Part(
			'site_goals_online_store',
			array(
				'title'  => 'How is my online store performing?',
				'labels' => array( 'Total sales' ),
				'values' => array( '116' ),
				'groups' => $groups,
			)
		);

		$this->assertSame( $groups, $section->get_groups(), 'get_groups() should return the groups the section receives.' );
	}

	public function test_get_prompt__returns_the_prompt_the_section_receives() {
		$prompt = array(
			'text'      => 'Your events data might be grouped together across plugins. To see separate results by plugin, %s.',
			'link_text' => 'enable data breakdown',
		);

		$section = new Email_Report_Data_Section_Part(
			'site_goals_online_store',
			array(
				'title'  => 'How is my online store performing?',
				'labels' => array( 'Total sales' ),
				'values' => array( '116' ),
				'prompt' => $prompt,
			)
		);

		$this->assertSame( $prompt, $section->get_prompt(), 'get_prompt() should return the prompt the section receives.' );
	}

	public function test_construct__leaves_the_groups_and_the_prompt_empty_when_the_section_data_holds_neither() {
		$section = new Email_Report_Data_Section_Part(
			'total_visitors',
			array(
				'title'  => 'Total visitors',
				'labels' => array( 'Total visitors' ),
				'values' => array( '1256' ),
			)
		);

		$this->assertSame( array(), $section->get_groups(), 'get_groups() should return an empty array for a section that shows one flat list of values.' );
		$this->assertSame( array(), $section->get_prompt(), 'get_prompt() should return an empty array for a section that asks the reader nothing.' );
	}

	public function test_construct__rejects_groups_that_are_not_an_array() {
		$this->expectException( InvalidArgumentException::class );
		new Email_Report_Data_Section_Part(
			'site_goals_online_store',
			array(
				'title'  => 'How is my online store performing?',
				'labels' => array( 'Total sales' ),
				'values' => array( '116' ),
				'groups' => 'WooCommerce',
			)
		);
	}

	public function test_construct__rejects_a_prompt_that_is_not_an_array() {
		$this->expectException( InvalidArgumentException::class );
		new Email_Report_Data_Section_Part(
			'site_goals_online_store',
			array(
				'title'  => 'How is my online store performing?',
				'labels' => array( 'Total sales' ),
				'values' => array( '116' ),
				'prompt' => 'enable data breakdown',
			)
		);
	}

	public function test_compare_dates_must_be_provided_together() {
		$this->expectException( InvalidArgumentException::class );
		new Email_Report_Data_Section_Part(
			'comparison',
			array(
				'title'      => 'Comparison',
				'labels'     => array( 'Label' ),
				'values'     => array( 'Value' ),
				'date_range' => array(
					'startDate'        => '2025-10-01',
					'endDate'          => '2025-10-31',
					'compareStartDate' => '2025-09-01',
				),
			)
		);
	}
}
