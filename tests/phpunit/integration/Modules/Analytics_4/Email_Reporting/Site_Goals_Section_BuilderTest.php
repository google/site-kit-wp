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
	 * Builds one report in the shape of one entry in the Analytics batch response.
	 *
	 * @param array $dimension_names Dimension names, in the order each row lists its dimension values.
	 * @param array $metric_names    Metric names, in the order each row lists its metric values.
	 * @param array $rows            Each row, holding its dimension values and then its metric values.
	 * @return array Report holding its headers and its rows.
	 */
	private function build_report( array $dimension_names, array $metric_names, array $rows ) {
		$wrap_value = static function ( $value ) {
			return is_array( $value ) ? $value : array( 'value' => $value );
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
	 * @return array Report holding one row per date range.
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
	 * @return array Report holding one row per date range.
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
	 * @return array Report holding one row per dimension value and date range.
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
	 * Builds a discovery report, which names the groups a card shows.
	 *
	 * The report covers one stretch of days, so its rows carry no `dateRange` dimension.
	 *
	 * @param string $event_name     Event name every row counted.
	 * @param string $dimension_name Dimension whose value names the group.
	 * @param array  $counts         Event count over the discovery days, keyed by dimension value.
	 * @return array Report holding one row per dimension value.
	 */
	private function build_discovery_report( $event_name, $dimension_name, array $counts ) {
		$rows = array();

		foreach ( $counts as $dimension_value => $count ) {
			$rows[] = array( array( $event_name, (string) $dimension_value ), array( $count ) );
		}

		return $this->build_report(
			array( 'eventName', $dimension_name ),
			array( 'eventCount' ),
			$rows
		);
	}

	/**
	 * Creates a published `wpforms` post, which is what `Get_Form_Metadata` reads a title
	 * from.
	 *
	 * @param string $title Title the email shows for this form's group.
	 * @return int ID the report names as the form ID.
	 */
	private function create_form( $title ) {
		return self::factory()->post->create(
			array(
				'post_title' => $title,
				'post_type'  => 'wpforms',
			)
		);
	}

	/**
	 * Builds the payload of an online store report split by event provider.
	 *
	 * WooCommerce and Easy Digital Downloads each get a group of their own, and the
	 * "(not set)" row goes into the "Other sources" group.
	 *
	 * @return array Module payload holding the key action report, the engagement report and
	 *               the discovery report.
	 */
	private function build_online_store_by_provider_payload() {
		$provider_dimension = 'customEvent:googlesitekit_event_provider';

		return array(
			'site_goals_online_store_discovery'           => $this->build_discovery_report(
				'purchase',
				$provider_dimension,
				array(
					'woocommerce'            => '1200',
					'easy-digital-downloads' => '300',
					'(not set)'              => '60',
				)
			),
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
			'site_goals_engagement_by_provider'           => $this->build_engagement_report_by_dimension(
				$provider_dimension,
				array(
					'woocommerce'            => array( '2000', '2600' ),
					'easy-digital-downloads' => array( '875', '1000' ),
				)
			),
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
		$this->assertSame( 'site_goals_online_store', $sections[0]['section_key'], 'build_sections() should give the online store section the key site_goals_online_store.' );
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
				'text'      => 'Your events data might be grouped together across plugins. To see separate results by plugin, %s.',
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
			'build_sections() should show "Add to cart rate" and "Products added to cart" when the report counted add_to_cart.'
		);
	}

	public function test_build_sections__gives_the_online_store_one_group_for_each_plugin_and_no_prompt() {
		$sections = $this->builder->build_sections( $this->build_online_store_by_provider_payload() );

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
			'build_sections() should give the online store one group for each plugin, biggest first, and put the rest in an "Other sources" group that holds the total alone.'
		);
		$this->assertSame(
			array(),
			$sections[0]['prompt'],
			'build_sections() should ask the reader nothing when the online store results are already split by plugin.'
		);
	}

	public function test_build_sections__shows_no_group_for_a_plugin_other_than_woocommerce_and_easy_digital_downloads() {
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
				'site_goals_online_store_discovery' => $this->build_discovery_report(
					'purchase',
					$provider_dimension,
					array(
						'woocommerce'       => '1200',
						'some-other-plugin' => '90',
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
			'build_sections() should show a plugin other than WooCommerce and Easy Digital Downloads in the "Other sources" group, rather than in a group of its own.'
		);
		$this->assertSame(
			'7',
			$sections[0]['groups'][1]['metrics'][0]['value'],
			'build_sections() should count the sales of a plugin other than WooCommerce and Easy Digital Downloads in the "Other sources" total.'
		);
	}

	public function test_build_sections__builds_no_other_sources_group_when_the_discovery_report_names_a_plugin_for_every_sale() {
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
				'site_goals_online_store_discovery' => $this->build_discovery_report(
					'purchase',
					$provider_dimension,
					array( 'woocommerce' => '1200' )
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
			'build_sections() should build no "Other sources" group when the discovery report names a plugin for every sale.'
		);
	}

	public function test_build_sections__orders_two_plugins_on_the_same_sales_count_by_name() {
		$provider_dimension = 'customEvent:googlesitekit_event_provider';

		$sections = $this->builder->build_sections(
			array(
				'site_goals_online_store_primary_by_provider' => $this->build_report(
					array( 'eventName', $provider_dimension, 'dateRange' ),
					array( 'eventCount' ),
					array(
						array( array( 'purchase', 'woocommerce', 'date_range_0' ), array( '50' ) ),
						array( array( 'purchase', 'woocommerce', 'date_range_1' ), array( '40' ) ),
						array( array( 'purchase', 'easy-digital-downloads', 'date_range_0' ), array( '50' ) ),
						array( array( 'purchase', 'easy-digital-downloads', 'date_range_1' ), array( '30' ) ),
					)
				),
				// The discovery report ties too, because that is what the order is read from.
				'site_goals_online_store_discovery' => $this->build_discovery_report(
					'purchase',
					$provider_dimension,
					array(
						'woocommerce'            => '500',
						'easy-digital-downloads' => '500',
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
			array( 'Easy Digital Downloads', 'WooCommerce' ),
			array_column( $sections[0]['groups'], 'label' ),
			'build_sections() should order two plugins on the same sales count by name, so the section shows the same order on every run.'
		);
	}

	public function test_build_sections__orders_the_online_store_groups_by_the_discovery_report_rather_than_the_report_period() {
		$provider_dimension = 'customEvent:googlesitekit_event_provider';

		$sections = $this->builder->build_sections(
			array(
				// Easy Digital Downloads outsells WooCommerce over the report period, and
				// WooCommerce outsells it over the discovery days.
				'site_goals_online_store_primary_by_provider' => $this->build_report(
					array( 'eventName', $provider_dimension, 'dateRange' ),
					array( 'eventCount' ),
					array(
						array( array( 'purchase', 'woocommerce', 'date_range_0' ), array( '10' ) ),
						array( array( 'purchase', 'woocommerce', 'date_range_1' ), array( '8' ) ),
						array( array( 'purchase', 'easy-digital-downloads', 'date_range_0' ), array( '100' ) ),
						array( array( 'purchase', 'easy-digital-downloads', 'date_range_1' ), array( '80' ) ),
					)
				),
				'site_goals_online_store_discovery' => $this->build_discovery_report(
					'purchase',
					$provider_dimension,
					array(
						'woocommerce'            => '1200',
						'easy-digital-downloads' => '300',
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
			array( 'WooCommerce', 'Easy Digital Downloads' ),
			array_column( $sections[0]['groups'], 'label' ),
			'build_sections() should order the online store groups by their sales over the discovery days, so the report period never reorders them.'
		);
	}

	public function test_build_sections__gives_a_group_the_discovery_report_names_a_rate_of_zero_and_no_badge_when_the_report_period_holds_no_sale() {
		$provider_dimension = 'customEvent:googlesitekit_event_provider';

		$sections = $this->builder->build_sections(
			array(
				// Easy Digital Downloads sold nothing over either period, so it holds no row.
				'site_goals_online_store_primary_by_provider' => $this->build_report(
					array( 'eventName', $provider_dimension, 'dateRange' ),
					array( 'eventCount' ),
					array(
						array( array( 'purchase', 'woocommerce', 'date_range_0' ), array( '116' ) ),
						array( array( 'purchase', 'woocommerce', 'date_range_1' ), array( '100' ) ),
					)
				),
				'site_goals_online_store_discovery' => $this->build_discovery_report(
					'purchase',
					$provider_dimension,
					array(
						'woocommerce'            => '1200',
						'easy-digital-downloads' => '300',
					)
				),
				'site_goals_engagement_by_provider' => $this->build_engagement_report_by_dimension(
					$provider_dimension,
					array( 'woocommerce' => array( '2000', '2600' ) )
				),
			)
		);

		$this->assertSame(
			array(
				'label'   => 'Easy Digital Downloads',
				'metrics' => array(
					array(
						'label' => 'Sales rate',
						'value' => '0%',
						'trend' => null,
					),
					array(
						'label' => 'Total sales',
						'value' => '0',
						'trend' => null,
					),
				),
			),
			$sections[0]['groups'][1],
			'build_sections() should give a plugin the discovery report names a rate of 0% and a total of 0, and no badge, when neither period holds a sale for it.'
		);
	}

	public function test_build_sections__shows_a_minus_one_hundred_percent_badge_when_the_previous_period_alone_holds_sales() {
		$provider_dimension = 'customEvent:googlesitekit_event_provider';

		$sections = $this->builder->build_sections(
			array(
				'site_goals_online_store_primary_by_provider' => $this->build_report(
					array( 'eventName', $provider_dimension, 'dateRange' ),
					array( 'eventCount' ),
					array(
						array( array( 'purchase', 'woocommerce', 'date_range_0' ), array( '116' ) ),
						array( array( 'purchase', 'woocommerce', 'date_range_1' ), array( '100' ) ),
						array( array( 'purchase', 'easy-digital-downloads', 'date_range_1' ), array( '20' ) ),
					)
				),
				'site_goals_online_store_discovery' => $this->build_discovery_report(
					'purchase',
					$provider_dimension,
					array(
						'woocommerce'            => '1200',
						'easy-digital-downloads' => '300',
					)
				),
				'site_goals_engagement_by_provider' => $this->build_engagement_report_by_dimension(
					$provider_dimension,
					array(
						'woocommerce'            => array( '2000', '2600' ),
						'easy-digital-downloads' => array( '0', '1000' ),
					)
				),
			)
		);

		$this->assertSame(
			array( -100.0, -100.0 ),
			array_column( $sections[0]['groups'][1]['metrics'], 'trend' ),
			'build_sections() should show a -100% badge on both tiles of a plugin that sold over the previous period alone.'
		);
	}

	public function test_build_sections__shows_other_sources_when_the_discovery_days_alone_hold_a_sale_outside_the_named_plugins() {
		$provider_dimension = 'customEvent:googlesitekit_event_provider';

		$sections = $this->builder->build_sections(
			array(
				// The report period names WooCommerce for every sale it holds.
				'site_goals_online_store_primary_by_provider' => $this->build_report(
					array( 'eventName', $provider_dimension, 'dateRange' ),
					array( 'eventCount' ),
					array(
						array( array( 'purchase', 'woocommerce', 'date_range_0' ), array( '116' ) ),
						array( array( 'purchase', 'woocommerce', 'date_range_1' ), array( '100' ) ),
					)
				),
				'site_goals_online_store_discovery' => $this->build_discovery_report(
					'purchase',
					$provider_dimension,
					array(
						'woocommerce' => '1200',
						'(not set)'   => '60',
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
			'build_sections() should show the "Other sources" group the widget shows, which the discovery days decide.'
		);
		$this->assertSame(
			'0',
			$sections[0]['groups'][1]['metrics'][0]['value'],
			'build_sections() should count the report period in the "Other sources" total, which holds no sale here.'
		);
	}

	public function test_build_sections__builds_no_section_when_the_report_period_holds_no_key_action_although_the_discovery_report_names_a_group() {
		$provider_dimension = 'customEvent:googlesitekit_event_provider';
		$form_dimension     = 'customEvent:googlesitekit_form_id';

		$sections = $this->builder->build_sections(
			array(
				'site_goals_online_store_primary_by_provider' => $this->build_report(
					array( 'eventName', $provider_dimension, 'dateRange' ),
					array( 'eventCount' ),
					array()
				),
				'site_goals_online_store_discovery' => $this->build_discovery_report(
					'purchase',
					$provider_dimension,
					array( 'woocommerce' => '1200' )
				),
				'site_goals_lead_primary_by_form'   => $this->build_report(
					array( 'eventName', $form_dimension, 'dateRange' ),
					array( 'eventCount' ),
					array()
				),
				'site_goals_lead_discovery'         => $this->build_discovery_report(
					'contact',
					$form_dimension,
					array( '17' => '1200' )
				),
			)
		);

		$this->assertSame(
			array(),
			$sections,
			'build_sections() should leave a card out of the email when the report period holds no key action, whatever the discovery days name.'
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
		$this->assertSame( 'site_goals_lead_generation', $sections[0]['section_key'], 'build_sections() should give the lead generation section the key site_goals_lead_generation.' );
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
			'build_sections() should add up every lead event name into one nameless group.'
		);
		$this->assertSame(
			array(
				'text'      => 'Your events data might be grouped together across forms. To see separate results by form, %s.',
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
				'site_goals_lead_discovery'       => $this->build_discovery_report(
					'contact',
					$form_dimension,
					array(
						$newsletter_form_id => '1200',
						$missing_form_id    => '300',
						'(not set)'         => '90',
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
			'build_sections() should name each form group by its stored title, show "Form #999999" when no form has that ID, and put the rest in an "Other sources" group.'
		);
		$this->assertSame(
			array(),
			$sections[0]['prompt'],
			'build_sections() should ask the reader nothing when the lead generation results are already split by form.'
		);
	}

	public function test_build_sections__orders_the_lead_generation_groups_by_the_discovery_report_rather_than_the_report_period() {
		$form_dimension = 'customEvent:googlesitekit_form_id';
		$busy_form_id   = $this->create_form( 'Busy form' );
		$quiet_form_id  = $this->create_form( 'Quiet form' );

		$sections = $this->builder->build_sections(
			array(
				// The quiet form takes more completions over the report period, and fewer
				// over the discovery days.
				'site_goals_lead_primary_by_form' => $this->build_report(
					array( 'eventName', $form_dimension, 'dateRange' ),
					array( 'eventCount' ),
					array(
						array( array( 'contact', (string) $busy_form_id, 'date_range_0' ), array( '10' ) ),
						array( array( 'contact', (string) $busy_form_id, 'date_range_1' ), array( '8' ) ),
						array( array( 'contact', (string) $quiet_form_id, 'date_range_0' ), array( '100' ) ),
						array( array( 'contact', (string) $quiet_form_id, 'date_range_1' ), array( '80' ) ),
					)
				),
				'site_goals_lead_discovery'       => $this->build_discovery_report(
					'contact',
					$form_dimension,
					array(
						$busy_form_id  => '1200',
						$quiet_form_id => '300',
					)
				),
				'site_goals_engagement_by_form'   => $this->build_engagement_report_by_dimension(
					$form_dimension,
					array(
						$busy_form_id  => array( '2000', '2600' ),
						$quiet_form_id => array( '875', '1000' ),
					)
				),
			)
		);

		$this->assertSame(
			array( 'Busy form', 'Quiet form' ),
			array_column( $sections[0]['groups'], 'label' ),
			'build_sections() should order the lead generation groups by their completions over the discovery days, so the report period never reorders them.'
		);
	}

	public function test_build_sections__reads_the_store_event_the_card_counts_alone_when_it_decides_other_sources() {
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
				// The discovery report counts both store events. Only WooCommerce sold, and
				// the unnamed plugin took carts alone, which this card never counts.
				'site_goals_online_store_discovery' => $this->build_report(
					array( 'eventName', $provider_dimension ),
					array( 'eventCount' ),
					array(
						array( array( 'purchase', 'woocommerce' ), array( '1200' ) ),
						array( array( 'add_to_cart', '(not set)' ), array( '500' ) ),
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
			'build_sections() should build no "Other sources" group for a plugin that took carts alone, because the card counts sales.'
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

	public function test_build_sections__lists_the_tiles_of_every_group_in_flat_lists_beside_the_groups() {
		$sections = $this->builder->build_sections( $this->build_online_store_by_provider_payload() );

		$this->assertSame(
			array( 'Sales rate', 'Total sales', 'Sales rate', 'Total sales', 'Total sales' ),
			$sections[0]['labels'],
			'build_sections() should list the tile labels of every group.'
		);
		$this->assertSame(
			array( '5.8%', '116', '2.4%', '21', '7' ),
			$sections[0]['values'],
			'build_sections() should list the tile values of every group.'
		);
		$this->assertSame(
			array( 50.8, 16.0, 20.0, 5.0, 75.0 ),
			$sections[0]['trends'],
			'build_sections() should list the tile trends of every group, each one beside its value.'
		);
		$this->assertSame(
			array( 'TYPE_STANDARD', 'TYPE_STANDARD', 'TYPE_STANDARD', 'TYPE_STANDARD', 'TYPE_STANDARD' ),
			$sections[0]['value_types'],
			'build_sections() should mark every value as already formatted, so nothing reformats "5.8%" and "116".'
		);
	}

	public function test_build_sections__writes_the_rate_with_a_dot_when_the_site_writes_decimals_with_a_comma() {
		global $wp_locale;

		$original_number_format   = $wp_locale->number_format;
		$wp_locale->number_format = array(
			'decimal_point' => ',',
			'thousands_sep' => '.',
		);

		try {
			$sections = $this->builder->build_sections(
				array(
					'site_goals_online_store_primary' => $this->build_primary_report( 'purchase', '116', '100' ),
					'site_goals_engagement'           => $this->build_engagement_report( '2000', '2600' ),
				)
			);

			$this->assertSame(
				'5.8%',
				$sections[0]['groups'][0]['metrics'][0]['value'],
				'build_sections() should write the rate with a dot even when the site writes decimals with a comma.'
			);
		} finally {
			$wp_locale->number_format = $original_number_format;
		}
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

	public function test_build_sections__labels_the_online_store_tiles_from_the_first_row_that_names_an_event() {
		$sections = $this->builder->build_sections(
			array(
				'site_goals_online_store_primary' => $this->build_report(
					array( 'eventName', 'dateRange' ),
					array( 'eventCount' ),
					array(
						array( array( '', 'date_range_0' ), array( '5' ) ),
						array( array( 'purchase', 'date_range_0' ), array( '116' ) ),
						array( array( 'purchase', 'date_range_1' ), array( '100' ) ),
					)
				),
				'site_goals_engagement'           => $this->build_engagement_report( '2000', '2600' ),
			)
		);

		$this->assertCount( 1, $sections, 'build_sections() should build the online store section when a later row names the event, even though the first row names none.' );
		$this->assertSame(
			array( 'Sales rate', 'Total sales' ),
			array_column( $sections[0]['groups'][0]['metrics'], 'label' ),
			'build_sections() should label the online store tiles from the first row that names an event.'
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
			'build_sections() should build no online store section when the report names no event.'
		);
	}

	public function test_build_sections__shows_no_form_group_for_a_row_analytics_did_not_name() {
		$form_dimension     = 'customEvent:googlesitekit_form_id';
		$newsletter_form_id = $this->create_form( 'Newsletter signup form' );

		$sections = $this->builder->build_sections(
			array(
				'site_goals_lead_primary_by_form' => $this->build_report(
					array( 'eventName', $form_dimension, 'dateRange' ),
					array( 'eventCount' ),
					array(
						array( array( 'contact', (string) $newsletter_form_id, 'date_range_0' ), array( '116' ) ),
						array( array( 'contact', (string) $newsletter_form_id, 'date_range_1' ), array( '100' ) ),
						array( array( 'contact', '(other)', 'date_range_0' ), array( '9' ) ),
						array( array( 'contact', '(other)', 'date_range_1' ), array( '4' ) ),
					)
				),
				'site_goals_lead_discovery'       => $this->build_discovery_report(
					'contact',
					$form_dimension,
					array(
						$newsletter_form_id => '1200',
						'(other)'           => '90',
					)
				),
				'site_goals_engagement_by_form'   => $this->build_engagement_report_by_dimension(
					$form_dimension,
					array( $newsletter_form_id => array( '2000', '2600' ) )
				),
			)
		);

		$this->assertSame(
			array( 'Newsletter signup form', 'Other sources' ),
			array_column( $sections[0]['groups'], 'label' ),
			'build_sections() should show no form group for the "(other)" row, because Analytics writes that one row for every form it stopped naming.'
		);
		$this->assertSame(
			'9',
			$sections[0]['groups'][1]['metrics'][0]['value'],
			'build_sections() should count the completions of the "(other)" row in the "Other sources" total.'
		);
	}

	public function test_build_sections__counts_a_row_whose_form_dimension_holds_no_value_in_other_sources() {
		$form_dimension     = 'customEvent:googlesitekit_form_id';
		$newsletter_form_id = $this->create_form( 'Newsletter signup form' );

		$sections = $this->builder->build_sections(
			array(
				'site_goals_lead_primary_by_form' => $this->build_report(
					array( 'eventName', $form_dimension, 'dateRange' ),
					array( 'eventCount' ),
					array(
						array( array( 'contact', (string) $newsletter_form_id, 'date_range_0' ), array( '116' ) ),
						array( array( 'contact', (string) $newsletter_form_id, 'date_range_1' ), array( '100' ) ),
						array( array( 'contact', array(), 'date_range_0' ), array( '9' ) ),
						array( array( 'contact', array(), 'date_range_1' ), array( '4' ) ),
					)
				),
				'site_goals_lead_discovery'       => $this->build_discovery_report(
					'contact',
					$form_dimension,
					array(
						$newsletter_form_id => '1200',
						''                  => '90',
					)
				),
				'site_goals_engagement_by_form'   => $this->build_engagement_report_by_dimension(
					$form_dimension,
					array( $newsletter_form_id => array( '2000', '2600' ) )
				),
			)
		);

		$this->assertSame(
			array( 'Newsletter signup form', 'Other sources' ),
			array_column( $sections[0]['groups'], 'label' ),
			'build_sections() should show no form group for a row whose form dimension holds no value, rather than a group labelled "Form #".'
		);
		$this->assertSame(
			'9',
			$sections[0]['groups'][1]['metrics'][0]['value'],
			'build_sections() should count the completions of a row whose form dimension holds no value in the "Other sources" total.'
		);
	}

	public function test_build_sections__builds_no_lead_generation_section_when_the_report_holds_no_row() {
		$sections = $this->builder->build_sections(
			array(
				'site_goals_lead_primary' => $this->build_report(
					array( 'eventName', 'dateRange' ),
					array( 'eventCount' ),
					array()
				),
				'site_goals_engagement'   => $this->build_engagement_report( '2000', '2600' ),
			)
		);

		$this->assertSame(
			array(),
			$sections,
			'build_sections() should build no lead generation section when the report holds no row.'
		);
	}
}
