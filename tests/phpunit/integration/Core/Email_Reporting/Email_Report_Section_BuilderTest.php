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
use Google\Site_Kit\Core\Email_Reporting\Sections_Map;
use Google\Site_Kit\Core\Golinks\Dashboard_Golink_Handler;
use Google\Site_Kit\Core\Golinks\Golinks;
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
			'endDate'          => strtotime( '2024-10-01' ),
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
			'endDate'          => $format_date( $date_range_meta['endDate'] ),
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

		// Example payload for the visitors section.
		$payloads = array(
			array(
				'title'          => 'How many visitors do I have?',
				'total_visitors' => array(
					array(
						'dimensionHeaders' => array(
							array( 'name' => 'dateRange' ),
						),
						'metricHeaders'    => array(
							array(
								'name' => 'totalUsers',
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

		$this->assertSame( 'total_visitors', $ga4_section->get_section_key(), 'GA4 section key should use section slug from payload.' );
		$this->assertSame( 'How many visitors do I have?', $ga4_section->get_title(), 'GA4 section title should come from payload.' );
		$this->assertSame( array( 'Total visitors' ), $ga4_section->get_labels(), 'GA4 labels should be translated when a translation exists.' );
		$this->assertSame( array( '123' ), $ga4_section->get_values(), 'GA4 totals should be normalized.' );
		$this->assertSame( array( '23.00%' ), $ga4_section->get_trends(), 'GA4 trends should represent percentage change from previous period.' );
		$this->assertSame( $expected_date_range, $ga4_section->get_date_range(), 'GA4 date range should come from email log meta.' );
	}

	public function test_build_sections__returns_wp_error_for_search_console_error_payload() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$builder = new Email_Report_Section_Builder( $context );

		$payloads = array(
			array(
				'total_clicks' => new \WP_Error(
					'email_report_search_console_missing_result',
					'Search Console data could not be retrieved.'
				),
			),
		);

		$sections = $builder->build_sections( 'search-console', $payloads, 'en_US' );

		$this->assertWPError( $sections, 'Search Console errors should be propagated as WP_Error.' );
		$this->assertSame( 'email_report_search_console_missing_result', $sections->get_error_code(), 'Expected original Search Console error code to be preserved.' );
	}

	/**
	 * Converts built section parts into section payload used by sections map.
	 *
	 * @param Email_Report_Data_Section_Part[] $sections Built section parts.
	 * @return array
	 */
	private function to_sections_payload( array $sections ) {
		$payload = array();

		foreach ( $sections as $section ) {
			$dimensions       = $section->get_dimensions();
			$dimension_values = $section->get_dimension_values();
			$first_dimension  = $dimensions[0] ?? '';
			$first_value      = $dimension_values[0] ?? '';
			$first_label      = is_array( $first_value ) ? ( $first_value['label'] ?? '' ) : $first_value;

			$payload[ $section->get_section_key() ] = array(
				'value'           => $section->get_values()[0] ?? '',
				'label'           => $section->get_labels()[0] ?? '',
				'event_name'      => $section->get_event_names()[0] ?? '',
				'dimension'       => $first_dimension,
				'dimension_value' => $first_label,
				'change_context'  => 'Compared to previous 7 days',
			);
		}

		return $payload;
	}

	/**
	 * Maps section parts by section key for easier assertions.
	 *
	 * @param Email_Report_Data_Section_Part[] $sections Built section parts.
	 * @return Email_Report_Data_Section_Part[]
	 */
	private function map_sections_by_key( array $sections ) {
		$section_by_key = array();

		foreach ( $sections as $section ) {
			$section_by_key[ $section->get_section_key() ] = $section;
		}

		return $section_by_key;
	}
}
