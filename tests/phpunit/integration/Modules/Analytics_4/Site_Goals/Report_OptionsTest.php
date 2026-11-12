<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Site_Goals\Report_OptionsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Site_Goals
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Site_Goals;

use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Site_Goals\Report_Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Analytics_4
 */
class Report_OptionsTest extends TestCase {

	public function test_get_primary_store_event__returns_add_to_cart_when_analytics_has_found_no_purchase() {
		$report_options = $this->create_report_options( array( 'add_to_cart', 'contact' ) );

		$this->assertSame(
			'add_to_cart',
			$report_options->get_primary_store_event(),
			'The `get_primary_store_event()` method should return `add_to_cart` when Analytics has found no `purchase` event.'
		);
	}

	/**
	 * @dataProvider data_found_events
	 *
	 * @param string $goal_type       The goal type to check.
	 * @param array  $detected_events The event names Analytics has found.
	 * @param bool   $expected        Whether Analytics has found an event of the goal type.
	 */
	public function test_has_detected_events__is_true_only_for_an_event_of_the_goal_type( $goal_type, array $detected_events, $expected ) {
		$this->assertSame(
			$expected,
			$this->create_report_options( $detected_events )->has_detected_events( $goal_type ),
			sprintf( 'The `has_detected_events()` method should return `%s` for `%s` and the events `%s`.', $expected ? 'true' : 'false', $goal_type, implode( ', ', $detected_events ) )
		);
	}

	public function data_found_events() {
		return array(
			'lead, with a lead event'                => array( 'lead', array( 'purchase', 'generate_lead' ), true ),
			'lead, with store events alone'          => array( 'lead', array( 'purchase', 'add_to_cart' ), false ),
			'ecommerce, with add_to_cart'            => array( 'ecommerce', array( 'add_to_cart', 'contact' ), true ),
			'ecommerce, with lead events alone'      => array( 'ecommerce', array( 'contact', 'generate_lead' ), false ),
			'a goal type no Site Goals widget shows' => array( 'content', array( 'purchase', 'contact' ), false ),
		);
	}

	public function test_get_key_action_options__counts_every_lead_event_analytics_has_found_in_both_periods_for_lead() {
		$report_options = $this->create_report_options( array( 'submit_lead_form', 'purchase', 'contact' ) );

		$this->assertSame(
			array(
				'metrics'          => array(
					array( 'name' => 'eventCount' ),
				),
				'dimensions'       => array(
					array( 'name' => 'eventName' ),
				),
				'dimensionFilters' => array(
					'eventName' => array(
						'filterType' => 'inListFilter',
						'value'      => array( 'contact', 'submit_lead_form' ),
					),
				),
				'startDate'        => '2026-08-19',
				'endDate'          => '2026-09-15',
				'compareStartDate' => '2026-07-22',
				'compareEndDate'   => '2026-08-18',
			),
			$report_options->get_key_action_options( 'lead' ),
			'The `get_key_action_options()` method should count `contact` and `submit_lead_form` for `lead`, in both periods and in the order `LEAD_EVENT_NAMES` names them. It should leave `purchase` out.'
		);
	}

	public function test_get_key_action_options__counts_the_primary_store_event_in_both_periods_for_ecommerce() {
		$report_options = $this->create_report_options( array( 'add_to_cart', 'purchase', 'contact' ) );

		$this->assertSame(
			array(
				'metrics'          => array(
					array( 'name' => 'eventCount' ),
				),
				'dimensions'       => array(
					array( 'name' => 'eventName' ),
				),
				'dimensionFilters' => array(
					'eventName' => 'purchase',
				),
				'startDate'        => '2026-08-19',
				'endDate'          => '2026-09-15',
				'compareStartDate' => '2026-07-22',
				'compareEndDate'   => '2026-08-18',
			),
			$report_options->get_key_action_options( 'ecommerce' ),
			'The `get_key_action_options()` method should count `purchase` alone, in the current and the compare period, for `ecommerce`.'
		);
	}

	/**
	 * @dataProvider data_breakdown_dimensions
	 *
	 * @param string       $goal_type        The goal type of the widget.
	 * @param string       $custom_dimension The custom dimension slug of the widget's tabs.
	 * @param string|array $event_filter     The `eventName` filter the report should send.
	 */
	public function test_get_key_action_options__splits_the_count_by_the_breakdown_dimension( $goal_type, $custom_dimension, $event_filter ) {
		$report_options = $this->create_report_options( array( 'purchase', 'contact' ) );

		$this->assertSame(
			array(
				'metrics'          => array(
					array( 'name' => 'eventCount' ),
				),
				'dimensions'       => array(
					array( 'name' => 'eventName' ),
					array( 'name' => "customEvent:$custom_dimension" ),
				),
				'dimensionFilters' => array(
					'eventName' => $event_filter,
				),
				'keepEmptyRows'    => true,
				'startDate'        => '2026-08-19',
				'endDate'          => '2026-09-15',
				'compareStartDate' => '2026-07-22',
				'compareEndDate'   => '2026-08-18',
			),
			$report_options->get_key_action_options( $goal_type, $custom_dimension ),
			"The `get_key_action_options()` method should count the key actions of `{$goal_type}` by event name and by `customEvent:{$custom_dimension}`, and keep the groups that sent no event."
		);
	}

	public function data_breakdown_dimensions() {
		return array(
			'lead, by form'                => array(
				'lead',
				Analytics_4::CUSTOM_DIMENSION_FORM_ID,
				array(
					'filterType' => 'inListFilter',
					'value'      => array( 'contact' ),
				),
			),
			'ecommerce, by event provider' => array(
				'ecommerce',
				Analytics_4::CUSTOM_DIMENSION_EVENT_PROVIDER,
				'purchase',
			),
		);
	}

	public function test_get_engagement_options__asks_for_the_engagement_rate_and_the_sessions_of_the_whole_site_in_both_periods() {
		$this->assertSame(
			array(
				'metrics'          => array(
					array( 'name' => 'engagementRate' ),
					array( 'name' => 'sessions' ),
				),
				'startDate'        => '2026-08-19',
				'endDate'          => '2026-09-15',
				'compareStartDate' => '2026-07-22',
				'compareEndDate'   => '2026-08-18',
			),
			$this->create_report_options( array( 'purchase' ) )->get_engagement_options(),
			'The `get_engagement_options()` method should ask for `engagementRate` and `sessions` with no dimension, in the current and the compare period.'
		);
	}

	public function test_get_engagement_options__splits_the_sessions_by_the_breakdown_dimension() {
		$this->assertSame(
			array(
				'metrics'          => array(
					array( 'name' => 'engagementRate' ),
					array( 'name' => 'sessions' ),
				),
				'dimensions'       => array(
					array( 'name' => 'customEvent:googlesitekit_form_id' ),
				),
				'keepEmptyRows'    => true,
				'startDate'        => '2026-08-19',
				'endDate'          => '2026-09-15',
				'compareStartDate' => '2026-07-22',
				'compareEndDate'   => '2026-08-18',
			),
			$this->create_report_options( array( 'contact' ) )->get_engagement_options( Analytics_4::CUSTOM_DIMENSION_FORM_ID ),
			'The `get_engagement_options()` method should split the sessions by `customEvent:googlesitekit_form_id`, and keep the forms with no sessions.'
		);
	}

	public function test_get_event_count_options__counts_the_events_of_the_filter_with_no_date_range() {
		$event_filter = array(
			'filterType' => 'inListFilter',
			'value'      => array( 'purchase', 'add_to_cart' ),
		);

		$this->assertSame(
			array(
				'metrics'          => array(
					array( 'name' => 'eventCount' ),
				),
				'dimensions'       => array(
					array( 'name' => 'eventName' ),
					array( 'name' => 'customEvent:googlesitekit_event_provider' ),
				),
				'dimensionFilters' => array(
					'eventName' => $event_filter,
				),
				'keepEmptyRows'    => true,
			),
			$this->create_report_options( array( 'purchase' ) )->get_event_count_options( $event_filter, Analytics_4::CUSTOM_DIMENSION_EVENT_PROVIDER ),
			'The `get_event_count_options()` method should count the events the filter selects by event name and by event provider, with no date range.'
		);
	}

	/**
	 * Creates report options for `2026-08-19` to `2026-09-15`, compared with
	 * `2026-07-22` to `2026-08-18`.
	 *
	 * @since 1.192.0
	 *
	 * @param array $detected_events The event names Analytics has found.
	 * @return Report_Options The report options.
	 */
	private function create_report_options( array $detected_events ) {
		return new Report_Options(
			array(
				'startDate' => '2026-08-19',
				'endDate'   => '2026-09-15',
			),
			array(
				'startDate' => '2026-07-22',
				'endDate'   => '2026-08-18',
			),
			$detected_events
		);
	}
}
