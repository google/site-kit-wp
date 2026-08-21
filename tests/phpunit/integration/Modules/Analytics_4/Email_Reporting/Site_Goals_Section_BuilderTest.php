<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Email_Reporting\Site_Goals_Section_BuilderTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Email_Reporting;

use Google\Site_Kit\Modules\Analytics_4\Email_Reporting\Site_Goals_Section_Builder;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Email_Reporting
 */
class Site_Goals_Section_BuilderTest extends TestCase {

	/**
	 * Section builder under test.
	 *
	 * @var Site_Goals_Section_Builder
	 */
	private $builder;

	public function set_up() {
		parent::set_up();
		$this->builder = new Site_Goals_Section_Builder();
	}

	/**
	 * Builds a report in the shape the Analytics batch endpoint returns.
	 *
	 * @param array $dimension_names Dimension names, in the order each row lists its dimension values.
	 * @param array $metric_names    Metric names, in the order each row lists its metric values.
	 * @param array $rows            Each row, holding its dimension values and then its metric values.
	 * @return array Report.
	 */
	private function build_report( array $dimension_names, array $metric_names, array $rows ) {
		$wrap_value = static function ( $value ) {
			return array( 'value' => $value );
		};

		return array(
			'dimensionHeaders' => array_map(
				static function ( $dimension_name ) {
					return array( 'name' => $dimension_name );
				},
				$dimension_names
			),
			'metricHeaders'    => array_map(
				static function ( $metric_name ) {
					return array(
						'name' => $metric_name,
						'type' => 'TYPE_INTEGER',
					);
				},
				$metric_names
			),
			'rows'             => array_map(
				static function ( $row ) use ( $wrap_value ) {
					list( $dimension_values, $metric_values ) = $row;

					return array(
						'dimensionValues' => array_map( $wrap_value, $dimension_values ),
						'metricValues'    => array_map( $wrap_value, $metric_values ),
					);
				},
				$rows
			),
		);
	}

	/**
	 * Builds a key action count report that names one event and holds no breakdown.
	 *
	 * @param string $event_name     Event name the report counted.
	 * @param string $current_count  Event count of the current period.
	 * @param string $previous_count Event count of the previous period.
	 * @return array Report.
	 */
	private function build_primary_report( $event_name, $current_count, $previous_count ) {
		return $this->build_report(
			array( 'eventName', 'dateRange' ),
			array( 'eventCount' ),
			array(
				array( array( $event_name, 'date_range_0' ), array( $current_count ) ),
				array( array( $event_name, 'date_range_1' ), array( $previous_count ) ),
			)
		);
	}

	/**
	 * Builds an engagement report that holds no breakdown.
	 *
	 * @param string $current_sessions  Session count of the current period.
	 * @param string $previous_sessions Session count of the previous period.
	 * @return array Report.
	 */
	private function build_engagement_report( $current_sessions, $previous_sessions ) {
		return $this->build_report(
			array( 'dateRange' ),
			array( 'engagementRate', 'sessions' ),
			array(
				array( array( 'date_range_0' ), array( '0.55', $current_sessions ) ),
				array( array( 'date_range_1' ), array( '0.5', $previous_sessions ) ),
			)
		);
	}

	/**
	 * Builds an engagement report split by a breakdown dimension.
	 *
	 * @param string $dimension_name Dimension the report splits its rows by.
	 * @param array  $sessions       Session counts of the current and the previous period, keyed by
	 *                               dimension value.
	 * @return array Report.
	 */
	private function build_engagement_report_by_dimension( $dimension_name, array $sessions ) {
		$rows = array();

		foreach ( $sessions as $dimension_value => $session_counts ) {
			list( $current_sessions, $previous_sessions ) = $session_counts;

			$rows[] = array( array( (string) $dimension_value, 'date_range_0' ), array( '0.55', $current_sessions ) );
			$rows[] = array( array( (string) $dimension_value, 'date_range_1' ), array( '0.5', $previous_sessions ) );
		}

		return $this->build_report(
			array( $dimension_name, 'dateRange' ),
			array( 'engagementRate', 'sessions' ),
			$rows
		);
	}

	/**
	 * Creates a published form post and returns its ID.
	 *
	 * `Get_Form_Metadata::FORM_POST_TYPES` holds `wpforms`, and the datapoint reads a title
	 * only from a post of one of those types, so the form group takes this post's title.
	 *
	 * @param string $title The form title.
	 * @return int The form post ID.
	 */
	private function create_form( $title ) {
		return self::factory()->post->create(
			array(
				'post_title' => $title,
				'post_type'  => 'wpforms',
			)
		);
	}

	public function test_build_sections__builds_no_section_when_the_payload_holds_no_site_goals_report() {
		$this->assertSame(
			array(),
			$this->builder->build_sections( array( 'total_visitors' => array() ) ),
			'build_sections() should build no section when the payload holds no Site Goals report.'
		);
	}

	public function test_build_sections__builds_no_section_when_the_payload_is_not_an_array() {
		$this->assertSame(
			array(),
			$this->builder->build_sections( null ),
			'build_sections() should build no section when it receives no payload to read.'
		);
	}

	public function test_build_sections__gives_the_online_store_one_group_and_the_breakdown_prompt() {
		$sections = $this->builder->build_sections(
			array(
				'site_goals_online_store_primary' => $this->build_primary_report( 'purchase', '116', '100' ),
				'site_goals_engagement'           => $this->build_engagement_report( '2000', '2600' ),
			)
		);

		$this->assertCount( 1, $sections, 'build_sections() should build the online store section alone when the payload holds no lead report.' );
		$this->assertSame( 'site_goals_online_store', $sections[0]['section_key'], 'build_sections() should key the online store section as site_goals_online_store.' );
		$this->assertSame(
			array(
				array(
					'label'   => '',
					'metrics' => array(
						array(
							'label' => 'Sales rate',
							'value' => '5.8%',
							'trend' => 50.8,
						),
						array(
							'label' => 'Total sales',
							'value' => '116',
							'trend' => 16.0,
						),
					),
				),
			),
			$sections[0]['groups'],
			'build_sections() should give the online store one group with no name, holding the sales rate and the total sales, each with its change against the previous period.'
		);
		$this->assertSame(
			array(
				'text'      => 'Your events data may be grouped together across plugins. To see separate results by plugin, %s.',
				'link_text' => 'enable data breakdown',
			),
			$sections[0]['prompt'],
			'build_sections() should ask the reader to turn the data breakdown on when the online store results are not split by plugin.'
		);
	}

	public function test_build_sections__labels_the_online_store_tiles_for_the_add_to_cart_event() {
		$sections = $this->builder->build_sections(
			array(
				'site_goals_online_store_primary' => $this->build_primary_report( 'add_to_cart', '116', '100' ),
				'site_goals_engagement'           => $this->build_engagement_report( '2000', '2600' ),
			)
		);

		$this->assertSame(
			array( 'Add to cart rate', 'Products added to cart' ),
			array_column( $sections[0]['groups'][0]['metrics'], 'label' ),
			'build_sections() should label the online store tiles for the add to cart event when the report counted add_to_cart.'
		);
	}

	public function test_build_sections__gives_the_online_store_one_group_for_each_plugin_and_no_prompt() {
		$provider_dimension = 'customEvent:googlesitekit_event_provider';

		$sections = $this->builder->build_sections(
			array(
				'site_goals_online_store_primary_by_provider' => $this->build_report(
					array( 'eventName', $provider_dimension, 'dateRange' ),
					array( 'eventCount' ),
					array(
						array( array( 'purchase', 'easy-digital-downloads', 'date_range_0' ), array( '21' ) ),
						array( array( 'purchase', 'easy-digital-downloads', 'date_range_1' ), array( '20' ) ),
						array( array( 'purchase', 'woocommerce', 'date_range_0' ), array( '116' ) ),
						array( array( 'purchase', 'woocommerce', 'date_range_1' ), array( '100' ) ),
						array( array( 'purchase', '(not set)', 'date_range_0' ), array( '7' ) ),
						array( array( 'purchase', '(not set)', 'date_range_1' ), array( '4' ) ),
					)
				),
				'site_goals_engagement_by_provider' => $this->build_engagement_report_by_dimension(
					$provider_dimension,
					array(
						'woocommerce'            => array( '2000', '2600' ),
						'easy-digital-downloads' => array( '875', '1000' ),
					)
				),
			)
		);

		$this->assertSame(
			array(
				array(
					'label'   => 'WooCommerce',
					'metrics' => array(
						array(
							'label' => 'Sales rate',
							'value' => '5.8%',
							'trend' => 50.8,
						),
						array(
							'label' => 'Total sales',
							'value' => '116',
							'trend' => 16.0,
						),
					),
				),
				array(
					'label'   => 'Easy Digital Downloads',
					'metrics' => array(
						array(
							'label' => 'Sales rate',
							'value' => '2.4%',
							'trend' => 20.0,
						),
						array(
							'label' => 'Total sales',
							'value' => '21',
							'trend' => 5.0,
						),
					),
				),
				array(
					'label'   => 'Other sources',
					'metrics' => array(
						array(
							'label' => 'Total sales',
							'value' => '7',
							'trend' => 75.0,
						),
					),
				),
			),
			$sections[0]['groups'],
			'build_sections() should give the online store one group for each plugin, biggest first, and gather the sales no plugin claimed into an "Other sources" group holding the total alone.'
		);
		$this->assertSame(
			array(),
			$sections[0]['prompt'],
			'build_sections() should ask the reader nothing when the online store results are already split by plugin.'
		);
	}

	public function test_build_sections__gives_a_plugin_other_than_woocommerce_and_easy_digital_downloads_no_group_of_its_own() {
		$provider_dimension = 'customEvent:googlesitekit_event_provider';

		$sections = $this->builder->build_sections(
			array(
				'site_goals_online_store_primary_by_provider' => $this->build_report(
					array( 'eventName', $provider_dimension, 'dateRange' ),
					array( 'eventCount' ),
					array(
						array( array( 'purchase', 'woocommerce', 'date_range_0' ), array( '116' ) ),
						array( array( 'purchase', 'woocommerce', 'date_range_1' ), array( '100' ) ),
						array( array( 'purchase', 'some-other-plugin', 'date_range_0' ), array( '7' ) ),
						array( array( 'purchase', 'some-other-plugin', 'date_range_1' ), array( '4' ) ),
					)
				),
				'site_goals_engagement_by_provider' => $this->build_engagement_report_by_dimension(
					$provider_dimension,
					array( 'woocommerce' => array( '2000', '2600' ) )
				),
			)
		);

		$this->assertSame(
			array( 'WooCommerce', 'Other sources' ),
			array_column( $sections[0]['groups'], 'label' ),
			'build_sections() should gather a plugin other than WooCommerce and Easy Digital Downloads into the "Other sources" group, rather than give it a group of its own.'
		);
		$this->assertSame(
			'7',
			$sections[0]['groups'][1]['metrics'][0]['value'],
			'build_sections() should count the sales of a plugin other than WooCommerce and Easy Digital Downloads in the "Other sources" total.'
		);
	}

	public function test_build_sections__builds_no_other_sources_group_when_every_sale_names_a_plugin() {
		$provider_dimension = 'customEvent:googlesitekit_event_provider';

		$sections = $this->builder->build_sections(
			array(
				'site_goals_online_store_primary_by_provider' => $this->build_report(
					array( 'eventName', $provider_dimension, 'dateRange' ),
					array( 'eventCount' ),
					array(
						array( array( 'purchase', 'woocommerce', 'date_range_0' ), array( '116' ) ),
						array( array( 'purchase', 'woocommerce', 'date_range_1' ), array( '100' ) ),
					)
				),
				'site_goals_engagement_by_provider' => $this->build_engagement_report_by_dimension(
					$provider_dimension,
					array( 'woocommerce' => array( '2000', '2600' ) )
				),
			)
		);

		$this->assertSame(
			array( 'WooCommerce' ),
			array_column( $sections[0]['groups'], 'label' ),
			'build_sections() should build no "Other sources" group when every sale names a plugin.'
		);
	}

	public function test_build_sections__gives_lead_generation_one_group_and_the_breakdown_prompt() {
		$sections = $this->builder->build_sections(
			array(
				'site_goals_lead_primary' => $this->build_report(
					array( 'eventName', 'dateRange' ),
					array( 'eventCount' ),
					array(
						array( array( 'contact', 'date_range_0' ), array( '30' ) ),
						array( array( 'contact', 'date_range_1' ), array( '20' ) ),
						array( array( 'submit_lead_form', 'date_range_0' ), array( '55' ) ),
						array( array( 'submit_lead_form', 'date_range_1' ), array( '48' ) ),
					)
				),
				'site_goals_engagement'   => $this->build_engagement_report( '5000', '6000' ),
			)
		);

		$this->assertCount( 1, $sections, 'build_sections() should build the lead generation section alone when the payload holds no store report.' );
		$this->assertSame( 'site_goals_lead_generation', $sections[0]['section_key'], 'build_sections() should key the lead generation section as site_goals_lead_generation.' );
		$this->assertSame(
			array(
				array(
					'label'   => '',
					'metrics' => array(
						array(
							'label' => 'Form completion rate',
							'value' => '1.7%',
							'trend' => 50.0,
						),
						array(
							'label' => 'Total form completions',
							'value' => '85',
							'trend' => 25.0,
						),
					),
				),
			),
			$sections[0]['groups'],
			'build_sections() should add up every lead event into one nameless group, so 30 contact events and 55 submit_lead_form events read as 85 form completions.'
		);
		$this->assertSame(
			array(
				'text'      => 'Your events data may be grouped together across forms. To see separate results by form, %s.',
				'link_text' => 'enable data breakdown',
			),
			$sections[0]['prompt'],
			'build_sections() should ask the reader to turn the data breakdown on when the lead generation results are not split by form.'
		);
	}

	public function test_build_sections__gives_lead_generation_one_group_for_each_form() {
		$form_dimension     = 'customEvent:googlesitekit_form_id';
		$newsletter_form_id = $this->create_form( 'Newsletter signup form' );
		$missing_form_id    = 999999;

		$sections = $this->builder->build_sections(
			array(
				'site_goals_lead_primary_by_form' => $this->build_report(
					array( 'eventName', $form_dimension, 'dateRange' ),
					array( 'eventCount' ),
					array(
						array( array( 'contact', (string) $missing_form_id, 'date_range_0' ), array( '21' ) ),
						array( array( 'contact', (string) $missing_form_id, 'date_range_1' ), array( '20' ) ),
						array( array( 'contact', (string) $newsletter_form_id, 'date_range_0' ), array( '116' ) ),
						array( array( 'contact', (string) $newsletter_form_id, 'date_range_1' ), array( '100' ) ),
						array( array( 'contact', '(not set)', 'date_range_0' ), array( '9' ) ),
						array( array( 'contact', '(not set)', 'date_range_1' ), array( '4' ) ),
					)
				),
				'site_goals_engagement_by_form'   => $this->build_engagement_report_by_dimension(
					$form_dimension,
					array(
						$newsletter_form_id => array( '2000', '2600' ),
						$missing_form_id    => array( '875', '1000' ),
					)
				),
			)
		);

		$this->assertSame(
			array(
				array(
					'label'   => 'Newsletter signup form',
					'metrics' => array(
						array(
							'label' => 'Form completion rate',
							'value' => '5.8%',
							'trend' => 50.8,
						),
						array(
							'label' => 'Total form completions',
							'value' => '116',
							'trend' => 16.0,
						),
					),
				),
				array(
					'label'   => 'Form #999999',
					'metrics' => array(
						array(
							'label' => 'Form completion rate',
							'value' => '2.4%',
							'trend' => 20.0,
						),
						array(
							'label' => 'Total form completions',
							'value' => '21',
							'trend' => 5.0,
						),
					),
				),
				array(
					'label'   => 'Other sources',
					'metrics' => array(
						array(
							'label' => 'Total form completions',
							'value' => '9',
							'trend' => 125.0,
						),
					),
				),
			),
			$sections[0]['groups'],
			'build_sections() should name each form group by its title, fall back to "Form #999999" when no form has that ID, and gather the completions no form claimed into an "Other sources" group.'
		);
		$this->assertSame(
			array(),
			$sections[0]['prompt'],
			'build_sections() should ask the reader nothing when the lead generation results are already split by form.'
		);
	}

	public function test_build_sections__builds_both_sections_when_the_payload_holds_both_reports() {
		$sections = $this->builder->build_sections(
			array(
				'site_goals_online_store_primary' => $this->build_primary_report( 'purchase', '116', '100' ),
				'site_goals_lead_primary'         => $this->build_primary_report( 'contact', '30', '20' ),
				'site_goals_engagement'           => $this->build_engagement_report( '2000', '2600' ),
			)
		);

		$this->assertSame(
			array( 'site_goals_online_store', 'site_goals_lead_generation' ),
			array_column( $sections, 'section_key' ),
			'build_sections() should build the online store section and then the lead generation section when the payload holds both reports.'
		);
	}

	public function test_build_sections__lists_every_tile_the_plain_text_email_reads() {
		$sections = $this->builder->build_sections(
			array(
				'site_goals_online_store_primary' => $this->build_primary_report( 'purchase', '116', '100' ),
				'site_goals_engagement'           => $this->build_engagement_report( '2000', '2600' ),
			)
		);

		$this->assertSame(
			array( 'Sales rate', 'Total sales' ),
			$sections[0]['labels'],
			'build_sections() should list every tile label, so the plain text email reads the same tiles the card shows.'
		);
		$this->assertSame(
			array( '5.8%', '116' ),
			$sections[0]['values'],
			'build_sections() should list every tile value, because Email_Report_Section_Builder drops a section whose values list holds nothing.'
		);
		$this->assertSame(
			array( 50.8, 16.0 ),
			$sections[0]['trends'],
			'build_sections() should list every tile trend beside its value.'
		);
		$this->assertSame(
			array( 'TYPE_STANDARD', 'TYPE_STANDARD' ),
			$sections[0]['value_types'],
			'build_sections() should mark each value as already formatted, so Email_Report_Section_Builder passes the percentage and the count through unchanged.'
		);
	}

	public function test_build_sections__reads_a_period_with_no_session_as_a_rate_of_zero() {
		$sections = $this->builder->build_sections(
			array(
				'site_goals_online_store_primary' => $this->build_primary_report( 'purchase', '116', '100' ),
				'site_goals_engagement'           => $this->build_engagement_report( '0', '0' ),
			)
		);

		$this->assertSame(
			array(
				'label' => 'Sales rate',
				'value' => '0%',
				'trend' => null,
			),
			$sections[0]['groups'][0]['metrics'][0],
			'build_sections() should show a sales rate of 0% with no trend when neither period holds a session to divide by.'
		);
	}

	public function test_build_sections__builds_no_online_store_section_when_the_report_names_no_event() {
		$sections = $this->builder->build_sections(
			array(
				'site_goals_online_store_primary' => $this->build_report(
					array( 'eventName', 'dateRange' ),
					array( 'eventCount' ),
					array()
				),
				'site_goals_engagement'           => $this->build_engagement_report( '2000', '2600' ),
			)
		);

		$this->assertSame(
			array(),
			$sections,
			'build_sections() should build no online store section when the report names no event, because both tile labels name the event it counted.'
		);
	}
}
