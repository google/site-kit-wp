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

		// Example payload for the business growth section derived from conversions data.
		$payloads = array(
			array(
				'title'                   => 'Is my site helping my business grow?',
				'total_conversion_events' => array(
					array(
						'dimensionHeaders' => array(
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
								'dimensionValues' => array(
									array( 'value' => 'date_range_0' ),
								),
								'metricValues'    => array(
									array( 'value' => '123' ),
								),
							),
							array(
								'dimensionValues' => array(
									array( 'value' => 'date_range_1' ),
								),
								'metricValues'    => array(
									array( 'value' => '100' ),
								),
							),
						),
						'rowCount'         => 2,
					),
				),
			),
		);

		$ga4_sections = $builder->build_sections( 'analytics-4', $payloads, 'en_US', $email_log );
		$this->assertIsArray( $ga4_sections, 'GA4 sections should be returned as a flat array.' );
		$this->assertContainsOnlyInstancesOf( Email_Report_Data_Section_Part::class, $ga4_sections, 'GA4 sections should be Email_Report_Data_Section_Part instances.' );
		$this->assertCount( 1, $ga4_sections, 'GA4 payload should produce one section.' );
		$this->assertSame( array( 0 ), array_keys( $ga4_sections ), 'GA4 sections should be numerically indexed.' );
		$ga4_section = $ga4_sections[0];

		$this->assertSame( 'total_conversion_events', $ga4_section->get_section_key(), 'GA4 section key should use section slug from payload.' );
		$this->assertSame( 'Is my site helping my business grow?', $ga4_section->get_title(), 'GA4 section title should come from payload.' );
		$this->assertSame( array( 'Total conversion events' ), $ga4_section->get_labels(), 'GA4 labels should be translated from metric names.' );
		$this->assertSame( array( '123' ), $ga4_section->get_values(), 'GA4 totals should be normalized.' );
		$this->assertSame( array( '23.00%' ), $ga4_section->get_trends(), 'GA4 trends should represent percentage change from previous period.' );
		$this->assertSame( $expected_date_range, $ga4_section->get_date_range(), 'GA4 date range should come from email log meta.' );
	}
}
