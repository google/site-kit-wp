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

	public function test_build_sections__uses_total_conversion_count_and_top_channel_sidecar_data() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$builder = new Email_Report_Section_Builder( $context );

		$payloads = array(
			array(
				'total_conversion_events'                  => $this->get_conversion_event_total_report( '90' ),
				'conversion_event_add_to_cart'             => $this->get_conversion_event_total_report( '50' ),
				'conversion_event_begin_checkout'          => $this->get_conversion_event_total_report( '30' ),
				'conversion_event_purchase'                => $this->get_conversion_event_total_report( '10' ),
				'conversion_event_top_channel_add_to_cart' => $this->get_conversion_event_top_channel_report( 'Organic Search', '5' ),
				'conversion_event_top_channel_begin_checkout' => $this->get_conversion_event_top_channel_report( 'Direct', '7' ),
				'conversion_event_top_channel_purchase'    => $this->get_conversion_event_top_channel_report( 'Paid Search', '999' ),
			),
		);

		$sections = $builder->build_sections( 'analytics-4', $payloads, 'en_US' );

		$this->assertIsArray( $sections, 'Expected analytics sections array.' );
		$this->assertCount( 4, $sections, 'Expected total plus three conversion event sections; top-channel sidecar reports should not render as standalone sections.' );

		$section_by_key = $this->map_sections_by_key( $sections );

		$this->assertArrayNotHasKey( 'conversion_event_top_channel_add_to_cart', $section_by_key, 'Top-channel sidecar payload should not become a standalone section.' );
		$this->assertArrayHasKey( 'conversion_event_add_to_cart', $section_by_key, 'Expected conversion event section to be present.' );

		$add_to_cart_section = $section_by_key['conversion_event_add_to_cart'];
		$this->assertSame( array( '50' ), $add_to_cart_section->get_values(), 'Conversion event value should come from total event count.' );
		$this->assertSame( array( 'sessionDefaultChannelGroup' ), $add_to_cart_section->get_dimensions(), 'Conversion event should expose top-channel dimension only when sidecar data exists.' );
		$this->assertSame( array( 'Organic Search' ), $add_to_cart_section->get_dimension_values(), 'Conversion event top channel should be merged from sidecar payload.' );

		$sections_payload = $this->to_sections_payload( $sections );
		$golinks          = new Golinks( $context );
		$golinks->register_handler( 'dashboard', new Dashboard_Golink_Handler() );
		$sections_map = new Sections_Map( $context, $sections_payload, $golinks );
		$section_map  = $sections_map->get_sections();

		$this->assertArrayHasKey( 'is_my_site_helping_my_business_grow', $section_map, 'Expected conversions section in section map.' );
		$this->assertSame(
			array(
				'total_conversion_events',
				'conversion_event_add_to_cart',
				'conversion_event_begin_checkout',
			),
			array_keys( $section_map['is_my_site_helping_my_business_grow']['section_parts'] ),
			'Conversion rows should be ranked by total event counts, not top-channel sidecar counts.'
		);
	}

	public function test_build_sections__keeps_conversion_event_row_when_top_channel_sidecar_is_missing() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$builder = new Email_Report_Section_Builder( $context );

		$payloads = array(
			array(
				'total_conversion_events'      => $this->get_conversion_event_total_report( '12' ),
				'conversion_event_add_to_cart' => $this->get_conversion_event_total_report( '4' ),
			),
		);

		$sections = $builder->build_sections( 'analytics-4', $payloads, 'en_US' );

		$this->assertIsArray( $sections, 'Expected analytics sections array.' );
		$this->assertCount( 2, $sections, 'Expected total plus conversion event section.' );

		$section_by_key = $this->map_sections_by_key( $sections );

		$this->assertArrayHasKey( 'conversion_event_add_to_cart', $section_by_key, 'Conversion event should be present even when top-channel sidecar data is missing.' );

		$add_to_cart_section = $section_by_key['conversion_event_add_to_cart'];
		$this->assertSame( array( '4' ), $add_to_cart_section->get_values(), 'Conversion event value should still come from total event count.' );
		$this->assertSame( array(), $add_to_cart_section->get_dimensions(), 'Conversion event should not expose a top-channel dimension when sidecar data is missing.' );
		$this->assertSame( array(), $add_to_cart_section->get_dimension_values(), 'Conversion event should not expose a top-channel value when sidecar data is missing.' );
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
	 * Builds a minimal GA4 conversion event totals report fixture.
	 *
	 * @param string $value Event count value.
	 * @return array
	 */
	private function get_conversion_event_total_report( $value ) {
		return array(
			'metricHeaders' => array(
				array(
					'name' => 'eventCount',
					'type' => 'TYPE_INTEGER',
				),
			),
			'totals'        => array(
				array(
					'metricValues' => array(
						array( 'value' => (string) $value ),
					),
				),
			),
			'rowCount'      => 1,
		);
	}

	/**
	 * Builds a minimal GA4 conversion event top-channel report fixture.
	 *
	 * @param string $channel Top channel name.
	 * @param string $value   Event count value.
	 * @return array
	 */
	private function get_conversion_event_top_channel_report( $channel, $value ) {
		return array(
			'dimensionHeaders' => array(
				array( 'name' => 'sessionDefaultChannelGroup' ),
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
						array( 'value' => (string) $channel ),
					),
					'metricValues'    => array(
						array( 'value' => (string) $value ),
					),
				),
			),
		);
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
