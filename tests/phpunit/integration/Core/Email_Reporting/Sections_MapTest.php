<?php
/**
 * Google\Site_Kit\Core\Email_Reporting\Sections_Map tests.
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Email_Reporting\Sections_Map;
use Google\Site_Kit\Core\Golinks\Golinks;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Email_Reporting
 */
class Sections_MapTest extends TestCase {

	public function test_get_sections__lists_the_online_store_and_lead_generation_sections_above_the_visitors_section() {
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$sections_map = new Sections_Map(
			$context,
			array(
				'total_visitors'             => array( 'value' => '1256' ),
				'site_goals_lead_generation' => array( 'values' => array( '1.9%', '85' ) ),
				'site_goals_online_store'    => array( 'values' => array( '3.8%', '116' ) ),
			),
			new Golinks( $context )
		);

		$this->assertSame(
			array(
				'how_is_my_online_store_performing',
				'are_people_reaching_out_to_my_business',
				'how_many_people_are_finding_and_visiting_my_site',
			),
			array_keys( $sections_map->get_sections() ),
			'`get_sections()` should list the online store section, then the lead generation section, then the visitors section.'
		);
	}

	public function test_get_sections__gives_each_site_goals_section_its_title_icon_and_dashboard_link() {
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$sections_map = new Sections_Map(
			$context,
			array(
				'site_goals_online_store'    => array( 'values' => array( '3.8%', '116' ) ),
				'site_goals_lead_generation' => array( 'values' => array( '1.9%', '85' ) ),
			),
			new Golinks( $context )
		);

		$this->assertSame(
			array(
				'how_is_my_online_store_performing'      => array(
					'title'            => 'How is my online store performing?',
					'icon'             => 'online-store',
					'section_template' => 'section-site-goals',
					'dashboard_url'    => 'http://example.org/wp-admin/index.php?action=googlesitekit_go&to=dashboard',
					'section_parts'    => array(
						'site_goals_online_store' => array(
							'data' => array( 'values' => array( '3.8%', '116' ) ),
						),
					),
				),
				'are_people_reaching_out_to_my_business' => array(
					'title'            => 'Are people reaching out to my business?',
					'icon'             => 'lead-generation',
					'section_template' => 'section-site-goals',
					'dashboard_url'    => 'http://example.org/wp-admin/index.php?action=googlesitekit_go&to=dashboard',
					'section_parts'    => array(
						'site_goals_lead_generation' => array(
							'data' => array( 'values' => array( '1.9%', '85' ) ),
						),
					),
				),
			),
			$sections_map->get_sections(),
			'`get_sections()` should give each Site Goals section its title, its icon, its payload, and the dashboard link.'
		);
	}

	public function test_get_sections__lists_no_site_goals_section_when_the_payload_has_no_site_goals_data() {
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$sections_map = new Sections_Map(
			$context,
			array(
				'total_visitors' => array( 'value' => '1256' ),
			),
			new Golinks( $context )
		);

		$this->assertSame(
			array( 'how_many_people_are_finding_and_visiting_my_site' ),
			array_keys( $sections_map->get_sections() ),
			'`get_sections()` should list the visitors section alone when the payload has no Site Goals data.'
		);
	}

	public function test_get_sections__lists_no_online_store_section_when_its_values_are_all_zero() {
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$sections_map = new Sections_Map(
			$context,
			array(
				'total_visitors'          => array( 'value' => '1256' ),
				'site_goals_online_store' => array( 'values' => array( '0%', '0' ) ),
			),
			new Golinks( $context )
		);

		$this->assertSame(
			array( 'how_many_people_are_finding_and_visiting_my_site' ),
			array_keys( $sections_map->get_sections() ),
			'`get_sections()` should list no online store section when its sales rate and its total sales are both zero.'
		);
	}
}
