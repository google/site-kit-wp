<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Email_Reporting\Report_Data_BuilderTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Email_Reporting;

use Google\Site_Kit\Modules\Analytics_4\Email_Reporting\Report_Data_Builder;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Email_Reporting
 */
class Report_Data_BuilderTest extends TestCase {

	/**
	 * Report data builder under test.
	 *
	 * @var Report_Data_Builder
	 */
	private $builder;

	public function set_up() {
		parent::set_up();
		$this->builder = new Report_Data_Builder();
	}

	/**
	 * Builds the report that counts the online store key action.
	 *
	 * @return array Report.
	 */
	private function build_online_store_report() {
		return array(
			'dimensionHeaders' => array(
				array( 'name' => 'eventName' ),
				array( 'name' => 'dateRange' ),
			),
			'metricHeaders'    => array(
				array(
					'name' => 'eventCount',
					'type' => 'TYPE_INTEGER',
				),
			),
			'rows'             => array(
				array(
					'dimensionValues' => array( array( 'value' => 'purchase' ), array( 'value' => 'date_range_0' ) ),
					'metricValues'    => array( array( 'value' => '116' ) ),
				),
				array(
					'dimensionValues' => array( array( 'value' => 'purchase' ), array( 'value' => 'date_range_1' ) ),
					'metricValues'    => array( array( 'value' => '100' ) ),
				),
			),
		);
	}

	/**
	 * Builds the report that counts the site's visitors.
	 *
	 * @return array Report.
	 */
	private function build_total_visitors_report() {
		return array(
			'dimensionHeaders' => array( array( 'name' => 'dateRange' ) ),
			'metricHeaders'    => array(
				array(
					'name' => 'totalUsers',
					'type' => 'TYPE_INTEGER',
				),
			),
			'rows'             => array(
				array(
					'dimensionValues' => array( array( 'value' => 'date_range_0' ) ),
					'metricValues'    => array( array( 'value' => '1256' ) ),
				),
				array(
					'dimensionValues' => array( array( 'value' => 'date_range_1' ) ),
					'metricValues'    => array( array( 'value' => '1000' ) ),
				),
			),
		);
	}

	/**
	 * Builds the report that counts the site's sessions.
	 *
	 * @return array Report.
	 */
	private function build_engagement_report() {
		return array(
			'dimensionHeaders' => array( array( 'name' => 'dateRange' ) ),
			'metricHeaders'    => array(
				array(
					'name' => 'engagementRate',
					'type' => 'TYPE_FLOAT',
				),
				array(
					'name' => 'sessions',
					'type' => 'TYPE_INTEGER',
				),
			),
			'rows'             => array(
				array(
					'dimensionValues' => array( array( 'value' => 'date_range_0' ) ),
					'metricValues'    => array( array( 'value' => '0.55' ), array( 'value' => '2000' ) ),
				),
				array(
					'dimensionValues' => array( array( 'value' => 'date_range_1' ) ),
					'metricValues'    => array( array( 'value' => '0.5' ), array( 'value' => '2600' ) ),
				),
			),
		);
	}

	public function test_build_sections_from_module_payload__reads_the_site_goals_reports_into_one_online_store_section() {
		$sections = $this->builder->build_sections_from_module_payload(
			array(
				'total_visitors'                  => $this->build_total_visitors_report(),
				'site_goals_online_store_primary' => $this->build_online_store_report(),
				'site_goals_engagement'           => $this->build_engagement_report(),
			)
		);

		$this->assertSame(
			array( 'site_goals_online_store', 'total_visitors' ),
			array_column( $sections, 'section_key' ),
			'build_sections_from_module_payload() should read the store count and the sessions into one site_goals_online_store section, and leave every other report mapped to a section of its own.'
		);
	}

	public function test_build_sections_from_module_payload__builds_no_section_of_its_own_for_a_site_goals_report() {
		$sections = $this->builder->build_sections_from_module_payload(
			array(
				'site_goals_online_store_primary' => $this->build_online_store_report(),
				'site_goals_engagement'           => $this->build_engagement_report(),
			)
		);

		$this->assertSame(
			array( 'site_goals_online_store' ),
			array_column( $sections, 'section_key' ),
			'build_sections_from_module_payload() should build no section keyed site_goals_online_store_primary or site_goals_engagement, because the Site Goals section already holds both reports.'
		);
	}

	public function test_build_sections_from_module_payload__maps_a_report_that_is_not_a_site_goals_report_to_its_own_section() {
		$sections = $this->builder->build_sections_from_module_payload(
			array( 'total_visitors' => $this->build_total_visitors_report() )
		);

		$this->assertCount( 1, $sections, 'build_sections_from_module_payload() should build one section for the total visitors report.' );
		$this->assertSame( 'total_visitors', $sections[0]['section_key'], 'build_sections_from_module_payload() should key the total visitors section as total_visitors.' );
		$this->assertSame( array( '1256' ), $sections[0]['values'], 'build_sections_from_module_payload() should carry the current period visitor count into the total visitors section.' );
	}
}
