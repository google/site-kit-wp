<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Email_Report_Section_BuilderTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Email_Reporting\Email_Log;
use Google\Site_Kit\Core\Email_Reporting\Email_Report_Section_Builder;
use Google\Site_Kit\Core\Email_Reporting\Email_Report_Data_Section_Part;
use Google\Site_Kit\Tests\TestCase;

class Email_Report_Section_BuilderTest extends TestCase {

	public function test_build_sections_with_report_payloads() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$builder = new Email_Report_Section_Builder( $context );

		if ( ! post_type_exists( Email_Log::POST_TYPE ) ) {
			register_post_type(
				Email_Log::POST_TYPE,
				array(
					'public'  => false,
					'show_ui' => false,
					'rewrite' => false,
				)
			);
		}

		$date_range_meta = array(
			'startDate'        => strtotime( '2024-09-01' ),
			'sendDate'         => strtotime( '2024-10-01' ),
			'compareStartDate' => strtotime( '2024-08-01' ),
			'compareEndDate'   => strtotime( '2024-08-31' ),
		);

		$format_date = static function ( $timestamp ) {
			if ( function_exists( 'wp_timezone' ) && function_exists( 'wp_date' ) ) {
				$timezone = wp_timezone();
				if ( $timezone ) {
					return wp_date( 'Y-m-d', $timestamp, $timezone );
				}
			}

			return gmdate( 'Y-m-d', $timestamp );
		};

		$expected_date_range = array(
			'startDate'        => $format_date( $date_range_meta['startDate'] ),
			'endDate'          => $format_date( $date_range_meta['sendDate'] ),
			'compareStartDate' => $format_date( $date_range_meta['compareStartDate'] ),
			'compareEndDate'   => $format_date( $date_range_meta['compareEndDate'] ),
		);

		$email_log_id = self::factory()->post->create(
			array(
				'post_type'   => Email_Log::POST_TYPE,
				'post_status' => Email_Log::STATUS_SENT,
			)
		);
		update_post_meta( $email_log_id, Email_Log::META_REPORT_REFERENCE_DATES, wp_json_encode( $date_range_meta ) );
		$email_log = get_post( $email_log_id );

		// Example payload similar to the How Many People Are Finding and Visiting My Site? email report section.
		$payloads = array(
			array(
				'title'          => 'How many people are finding and visiting my site?',
				'analytics-4'    => array(
					'how_many_people_are_finding_and_visiting_my_site' => array(
						array(
							'dimensionHeaders' => array(
								array( 'name' => 'dateRange' ),
							),
							'metricHeaders'    => array(
								array(
									'name' => 'totalUsers',
									'type' => 'TYPE_INTEGER',
								),
								array(
									'name' => 'newUsers',
									'type' => 'TYPE_INTEGER',
								),
							),
							'rows'             => array(
								array(
									'dimensionValues' => array(
										array( 'value' => 'date_range_0' ),
									),
									'metricValues'    => array(
										array( 'value' => '1234' ),
										array( 'value' => '5678' ),
									),
								),
								array(
									'dimensionValues' => array(
										array( 'value' => 'date_range_1' ),
									),
									'metricValues'    => array(
										array( 'value' => '1000' ),
										array( 'value' => '4800' ),
									),
								),
							),
							'rowCount'         => 2,
						),
					),
				),
				'search-console' => array(
					'how_many_people_are_finding_and_visiting_my_site' => array(
						array(
							'clicks'      => 1250,
							'impressions' => 21370,
						),
					),
				),
			),
		);

		$result = $builder->build_sections( 'analytics-4', $payloads, 'en_US', $email_log );

		$this->assertIsArray( $result, 'Sections should be returned as a flat array.' );
		$this->assertContainsOnlyInstancesOf( Email_Report_Data_Section_Part::class, $result, 'Sections should be Email_Report_Data_Section_Part instances.' );
		$this->assertCount( 2, $result, 'Should have both GA4 and Search Console sections' );
		$this->assertSame(
			range( 0, count( $result ) - 1 ),
			array_keys( $result ),
			'Sections should be a numerically indexed list without module keys.'
		);
		$sections = array_map(
			static function ( Email_Report_Data_Section_Part $section ) {
				return $section->to_array();
			},
			$result
		);

		// Check GA4 section
		$ga4_section = $sections[0];

		$this->assertSame( 'how_many_people_are_finding_and_visiting_my_site', $ga4_section['section_key'], 'GA4 section key should use section slug.' );
		$this->assertSame( 'How many people are finding and visiting my site?', $ga4_section['title'], 'GA4 section title should come from payload.' );
		$this->assertSame( array( 'Total Visitors', 'New Visitors' ), $ga4_section['labels'], 'GA4 labels should be translated from metric names.' );
		$this->assertSame( array( '1234', '5678' ), $ga4_section['values'], 'GA4 totals should be normalized.' );
		$this->assertSame( array( '23.40%', '18.29%' ), $ga4_section['trends'], 'GA4 trends should represent percentage change from previous period.' );
		$this->assertSame( $expected_date_range, $ga4_section['date_range'], 'GA4 date range should come from email log meta.' );

		// Check Search Console section
		$sc_section = $sections[1];

		$this->assertSame( 'how_many_people_are_finding_and_visiting_my_site', $sc_section['section_key'], 'Search Console section key should use payload key.' );
		$this->assertSame( 'How many people are finding and visiting my site?', $sc_section['title'], 'Search Console section title should come from payload.' );
		$this->assertSame( array( 'Total clicks from Search', 'Total impressions in Search' ), $sc_section['labels'], 'Search Console labels should be translated.' );
		$this->assertSame( array( '1250', '21370' ), $sc_section['values'], 'Search Console totals should be aggregated as expected.' );
		$this->assertNull( $sc_section['trends'], 'Search Console section should not include trends until implemented in V1.' ); // TODO: Update to visualise trends in PUE V1.
		$this->assertSame( $expected_date_range, $sc_section['date_range'], 'Search Console date range should come from email log meta.' );
	}
}
