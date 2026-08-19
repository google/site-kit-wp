<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Email_Reporting\Report_OptionsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * phpcs:disable PHPCS.Commenting.RequireDocTagDescription -- Pre-existing violations; tracked for follow-up cleanup.
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options as Core_Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Audience_Settings as User_Audience_Settings;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Audience_Settings as Module_Audience_Settings;
use Google\Site_Kit\Modules\Analytics_4\Email_Reporting\Report_Options as Analytics_4_Report_Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Email_Reporting
 */
class Analytics_4_Report_OptionsTest extends TestCase {

	/**
	 * Plugin context.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Test user ID.
	 *
	 * @var int
	 */
	private $user_id;

	public function set_up() {
		parent::set_up();
		$this->user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $this->user_id );
		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->reset_audience_settings();
	}

	public function tear_down() {
		wp_set_current_user( 0 );
		$this->reset_audience_settings();
		parent::tear_down();
	}

	public function test_total_visitors_report_includes_compare_dates() {
		$builder = $this->create_builder();
		$options = $builder->get_total_visitors_options();

		$this->assertArrayHasKey( 'startDate', $options, 'Total visitors report should include startDate.' );
		$this->assertArrayHasKey( 'endDate', $options, 'Total visitors report should include endDate.' );
		$this->assertArrayHasKey( 'compareStartDate', $options, 'Total visitors report should include compareStartDate.' );
		$this->assertArrayHasKey( 'compareEndDate', $options, 'Total visitors report should include compareEndDate.' );

		$this->assertEquals(
			array( array( 'name' => 'totalUsers' ) ),
			$options['metrics'],
			'Total visitors report should request the totalUsers metric.'
		);
	}

	public function test_total_visitors_respects_custom_date_range() {
		$date_range = array(
			'startDate'        => '2024-02-01',
			'endDate'          => '2024-02-07',
			'compareStartDate' => '2024-01-25',
			'compareEndDate'   => '2024-01-31',
		);

		$builder = $this->create_builder( $date_range );
		$options = $builder->get_total_visitors_options();

		$this->assertSame( '2024-02-01', $options['startDate'], 'Start date should match provided date range.' );
		$this->assertSame( '2024-02-07', $options['endDate'], 'End date should match provided date range.' );
		$this->assertSame( '2024-01-25', $options['compareStartDate'], 'Compare start should match provided compare range.' );
		$this->assertSame( '2024-01-31', $options['compareEndDate'], 'Compare end should match provided compare range.' );
	}

	public function test_top_authors_uses_custom_dimension() {
		$builder = $this->create_builder();
		$options = $builder->get_top_authors_options();

		$expected_dimension = sprintf(
			'customEvent:%s',
			Analytics_4::CUSTOM_DIMENSION_POST_AUTHOR
		);

		$this->assertSame(
			$expected_dimension,
			$options['dimensions'][0]['name'],
			'Top authors report should reference the custom author dimension.'
		);

		$this->assertSame( 3, $options['limit'], 'Top authors report should limit to three rows.' );
	}

	public function test_top_categories_uses_custom_dimension() {
		$builder = $this->create_builder();
		$options = $builder->get_top_categories_options();

		$expected_dimension = sprintf(
			'customEvent:%s',
			Analytics_4::CUSTOM_DIMENSION_POST_CATEGORIES
		);

		$this->assertSame(
			$expected_dimension,
			$options['dimensions'][0]['name'],
			'Top categories report should reference the custom category dimension.'
		);

		$this->assertSame( 3, $options['limit'], 'Top categories report should limit to three rows.' );
	}

	public function test_new_visitors_uses_site_kit_audience_when_available() {
		$audience_resource = 'properties/1234/audiences/567';
		$this->set_available_audiences(
			array(
				array(
					'name'         => $audience_resource,
					'displayName'  => 'New Visitors',
					'audienceSlug' => 'new-visitors',
				),
			)
		);
		$builder = $this->create_builder();
		$options = $builder->get_new_visitors_options();

		$this->assertSame(
			'audienceResourceName',
			$options['dimensions'][0]['name'],
			'When an audience resource exists, the report should target the audience dimension.'
		);
		$this->assertSame(
			$audience_resource,
			$options['dimensionFilters']['audienceResourceName']['value'],
			'Audience resource name should be applied as a dimension filter.'
		);
		$this->assertEquals(
			array( array( 'name' => 'totalUsers' ) ),
			$options['metrics'],
			'Audience-backed report should request totalUsers.'
		);
	}

	public function test_returning_visitors_falls_back_without_audience() {
		$builder = $this->create_builder();
		$options = $builder->get_returning_visitors_options();

		$this->assertSame(
			'newVsReturning',
			$options['dimensions'][0]['name'],
			'Fallback should rely on the newVsReturning dimension.'
		);
		$this->assertSame(
			'returning',
			$options['dimensionFilters']['newVsReturning']['value'],
			'Fallback should restrict to the returning cohort.'
		);
	}

	public function test_get_custom_audiences_options_returns_empty_array_when_missing() {
		$this->reset_audience_settings();
		$builder = $this->create_builder();
		$options = $builder->get_custom_audiences_options();

		$this->assertSame(
			array(
				'options'   => array(),
				'audiences' => array(),
			),
			$options,
			'When no audiences are configured the helper should return empty payload data.'
		);
	}

	public function test_get_custom_audiences_options_builds_expected_payload() {
		$resource_one = 'properties/12345/audiences/1';
		$resource_two = 'properties/12345/audiences/2';
		$this->set_configured_audiences( array( $resource_one, $resource_two, $resource_one ) );
		$this->set_available_audiences(
			array(
				array(
					'name'        => $resource_one,
					'displayName' => 'Audience One',
				),
				array(
					'name'        => $resource_two,
					'displayName' => 'Audience Two',
				),
			)
		);

		$builder = $this->create_builder();

		$result = $builder->get_custom_audiences_options();

		$this->assertArrayHasKey( 'options', $result, 'Custom audiences payload should include options key.' );
		$this->assertArrayHasKey( 'audiences', $result, 'Custom audiences payload should include audiences key.' );

		$options = $result['options'];

		$this->assertArrayHasKey( 'dimensionFilters', $options, 'Custom audiences options should include dimension filters.' );
		$this->assertArrayHasKey( 'audienceResourceName', $options['dimensionFilters'], 'Custom audiences filters should include audienceResourceName.' );

		$this->assertSame(
			array( $resource_one, $resource_two ),
			$options['dimensionFilters']['audienceResourceName'],
			'Configured audience resource names should be applied as filters.'
		);

		$metric_names = wp_list_pluck( $options['metrics'], 'name' );
		$this->assertEquals( array( 'totalUsers' ), $metric_names, 'Custom audiences should request totalUsers metric.' );

		$this->assertSame(
			'audienceResourceName',
			$options['dimensions'][0]['name'],
			'Custom audiences should dimension on audienceResourceName.'
		);

		$this->assertSame(
			array(
				array(
					'resourceName' => $resource_one,
					'displayName'  => 'Audience One',
				),
				array(
					'resourceName' => $resource_two,
					'displayName'  => 'Audience Two',
				),
			),
			$result['audiences'],
			'Custom audiences payload should return matching audience metadata.'
		);
	}

	public function test_get_online_store_primary_options__counts_the_purchase_event() {
		$builder = $this->create_builder_with_events( array( 'add_to_cart', 'purchase' ) );
		$options = $builder->get_online_store_primary_options();

		$this->assertEquals(
			array( array( 'name' => 'eventCount' ) ),
			$options['metrics'],
			'get_online_store_primary_options() should request the eventCount metric.'
		);
		$this->assertEquals(
			array( array( 'name' => 'eventName' ) ),
			$options['dimensions'],
			'get_online_store_primary_options() should group the count by event name alone.'
		);
		$this->assertArrayNotHasKey(
			'keepEmptyRows',
			$options,
			'get_online_store_primary_options() should add no keepEmptyRows option when it groups by event name alone.'
		);
		$this->assertSame(
			'purchase',
			$options['dimensionFilters']['eventName'],
			'get_online_store_primary_options() should filter the count to purchase when the site sends both store events.'
		);
		$this->assert_report_covers_both_periods( $options, 'get_online_store_primary_options()' );
	}

	public function test_get_online_store_primary_options__counts_add_to_cart_when_the_site_sends_no_purchase() {
		$builder = $this->create_builder_with_events( array( 'add_to_cart' ) );
		$options = $builder->get_online_store_primary_options();

		$this->assertSame(
			'add_to_cart',
			$options['dimensionFilters']['eventName'],
			'get_online_store_primary_options() should filter the count to add_to_cart when the site sends no purchase event.'
		);
	}

	public function test_get_online_store_primary_options__splits_the_count_by_event_provider() {
		$builder = $this->create_builder_with_events( array( 'purchase' ) );
		$options = $builder->get_online_store_primary_options( Analytics_4::CUSTOM_DIMENSION_EVENT_PROVIDER );

		$this->assertEquals(
			array(
				array( 'name' => 'eventName' ),
				array( 'name' => 'customEvent:googlesitekit_event_provider' ),
			),
			$options['dimensions'],
			'get_online_store_primary_options() should group the count by event name and by event provider when given the event provider dimension.'
		);
		$this->assertTrue(
			$options['keepEmptyRows'],
			'get_online_store_primary_options() should keep an event provider that sent no event in the report.'
		);
		$this->assertSame(
			'purchase',
			$options['dimensionFilters']['eventName'],
			'get_online_store_primary_options() should still filter the count to the purchase event when given the event provider dimension.'
		);
		$this->assert_report_covers_both_periods( $options, 'get_online_store_primary_options()' );
	}

	public function test_get_lead_primary_options__counts_every_lead_event_the_site_sends() {
		$builder = $this->create_builder_with_events( array( 'submit_lead_form', 'purchase', 'contact' ) );
		$options = $builder->get_lead_primary_options();

		$this->assertEquals(
			array( array( 'name' => 'eventCount' ) ),
			$options['metrics'],
			'get_lead_primary_options() should request the eventCount metric.'
		);
		$this->assertSame(
			'inListFilter',
			$options['dimensionFilters']['eventName']['filterType'],
			'get_lead_primary_options() should filter the event name with an in-list filter, because a site can send several lead events.'
		);
		$this->assertSame(
			array( 'contact', 'submit_lead_form' ),
			$options['dimensionFilters']['eventName']['value'],
			'get_lead_primary_options() should list the detected lead events in the order Conversion_Reporting_Events_Sync names them, and leave the purchase event out.'
		);
		$this->assert_report_covers_both_periods( $options, 'get_lead_primary_options()' );
	}

	public function test_get_lead_primary_options__lists_no_event_when_the_site_sends_none() {
		$builder = $this->create_builder();
		$options = $builder->get_lead_primary_options();

		$this->assertSame(
			array(),
			$options['dimensionFilters']['eventName']['value'],
			'get_lead_primary_options() should list no event before any detected event is set.'
		);
	}

	public function test_get_lead_primary_options__splits_the_count_by_form() {
		$builder = $this->create_builder_with_events( array( 'contact' ) );
		$options = $builder->get_lead_primary_options( Analytics_4::CUSTOM_DIMENSION_FORM_ID );

		$this->assertEquals(
			array(
				array( 'name' => 'eventName' ),
				array( 'name' => 'customEvent:googlesitekit_form_id' ),
			),
			$options['dimensions'],
			'get_lead_primary_options() should group the count by event name and by form when given the form ID dimension.'
		);
		$this->assertTrue(
			$options['keepEmptyRows'],
			'get_lead_primary_options() should keep a form that got no lead event in the report.'
		);
		$this->assertSame(
			array( 'contact' ),
			$options['dimensionFilters']['eventName']['value'],
			'get_lead_primary_options() should still list the detected lead events when given the form ID dimension.'
		);
		$this->assert_report_covers_both_periods( $options, 'get_lead_primary_options()' );
	}

	public function test_get_engagement_options__requests_the_engagement_rate_and_sessions_for_the_whole_site() {
		$builder = $this->create_builder();
		$options = $builder->get_engagement_options();

		$this->assertEquals(
			array(
				array( 'name' => 'engagementRate' ),
				array( 'name' => 'sessions' ),
			),
			$options['metrics'],
			'get_engagement_options() should request the engagementRate and sessions metrics.'
		);
		$this->assertArrayNotHasKey(
			'dimensions',
			$options,
			'get_engagement_options() should total the sessions for the whole site when given no dimension.'
		);
		$this->assertArrayNotHasKey(
			'keepEmptyRows',
			$options,
			'get_engagement_options() should add no keepEmptyRows option when it adds no breakdown dimension.'
		);
		$this->assert_report_covers_both_periods( $options, 'get_engagement_options()' );
	}

	public function test_get_engagement_options__splits_the_sessions_by_event_provider() {
		$builder = $this->create_builder();
		$options = $builder->get_engagement_options( Analytics_4::CUSTOM_DIMENSION_EVENT_PROVIDER );

		$this->assertEquals(
			array( array( 'name' => 'customEvent:googlesitekit_event_provider' ) ),
			$options['dimensions'],
			'get_engagement_options() should group the sessions by event provider when given the event provider dimension.'
		);
		$this->assertTrue(
			$options['keepEmptyRows'],
			'get_engagement_options() should keep an event provider with no sessions in the report.'
		);
		$this->assert_report_covers_both_periods( $options, 'get_engagement_options()' );
	}

	public function test_has_ecommerce_events__is_true_when_the_site_sends_a_store_event() {
		$builder = $this->create_builder_with_events( array( 'add_to_cart', 'contact' ) );

		$this->assertTrue(
			$builder->has_ecommerce_events(),
			'has_ecommerce_events() should be true when the detected events hold a store event.'
		);
	}

	public function test_has_ecommerce_events__is_false_when_the_site_sends_no_store_event() {
		$builder = $this->create_builder_with_events( array( 'contact', 'generate_lead' ) );

		$this->assertFalse(
			$builder->has_ecommerce_events(),
			'has_ecommerce_events() should be false when the detected events hold lead events alone.'
		);
	}

	public function test_has_lead_events__is_true_when_the_site_sends_a_lead_event() {
		$builder = $this->create_builder_with_events( array( 'purchase', 'generate_lead' ) );

		$this->assertTrue(
			$builder->has_lead_events(),
			'has_lead_events() should be true when the detected events hold a lead event.'
		);
	}

	public function test_has_lead_events__is_false_when_the_site_sends_no_lead_event() {
		$builder = $this->create_builder_with_events( array( 'purchase' ) );

		$this->assertFalse(
			$builder->has_lead_events(),
			'has_lead_events() should be false when the detected events hold store events alone.'
		);
	}

	/**
	 * Asserts that a report covers the report period and the period before it.
	 *
	 * @param array  $options        Report request options.
	 * @param string $builder_method Name of the builder method under test, with its
	 *                               parentheses. For example, `get_lead_primary_options()`.
	 */
	private function assert_report_covers_both_periods( array $options, $builder_method ) {
		$this->assertSame( '2024-01-01', $options['startDate'], sprintf( '%s should request the report period start date.', $builder_method ) );
		$this->assertSame( '2024-01-07', $options['endDate'], sprintf( '%s should request the report period end date.', $builder_method ) );
		$this->assertSame( '2023-12-25', $options['compareStartDate'], sprintf( '%s should request the previous period start date.', $builder_method ) );
		$this->assertSame( '2023-12-31', $options['compareEndDate'], sprintf( '%s should request the previous period end date.', $builder_method ) );
	}

	/**
	 * Creates a builder that reports the given events as detected.
	 *
	 * @param array $detected_events Detected event names.
	 * @return Analytics_4_Report_Options
	 */
	private function create_builder_with_events( array $detected_events ) {
		$builder = $this->create_builder();
		$builder->set_detected_events( $detected_events );

		return $builder;
	}

	/**
	 * Creates a builder instance with the shared context.
	 *
	 * @param array $date_range    Optional date range payload.
	 * @param array $compare_range Optional compare range override.
	 * @return Analytics_4_Report_Options
	 */
	private function create_builder( $date_range = array(), $compare_range = array() ) {
		if ( empty( $date_range ) ) {
			$date_range = $this->get_default_date_range();
		}

		return new Analytics_4_Report_Options( $date_range, $compare_range, $this->context );
	}

	/**
	 * Resets audience settings to defaults.
	 */
	private function reset_audience_settings() {
		$user_settings = new User_Audience_Settings( new User_Options( $this->context ) );
		$user_settings->set(
			array(
				'configuredAudiences'                => null,
				'isAudienceSegmentationWidgetHidden' => false,
				'didSetAudiences'                    => false,
			)
		);

		$module_settings = new Module_Audience_Settings( new Core_Options( $this->context ) );
		$module_settings->set(
			array(
				'availableAudiences'                   => null,
				'availableAudiencesLastSyncedAt'       => 0,
				'audienceSegmentationSetupCompletedBy' => null,
			)
		);
	}

	/**
	 * Helper to set configured audiences.
	 *
	 * @param array $resource_names Resource names to configure.
	 */
	private function set_configured_audiences( array $resource_names ) {
		$user_settings = new User_Audience_Settings( new User_Options( $this->context ) );
		$user_settings->set(
			array(
				'configuredAudiences'                => $resource_names,
				'isAudienceSegmentationWidgetHidden' => false,
				'didSetAudiences'                    => ! empty( $resource_names ),
			)
		);
	}

	/**
	 * Helper to set available audience metadata.
	 *
	 * @param array $audiences Audience metadata list.
	 */
	private function set_available_audiences( array $audiences ) {
		$module_settings = new Module_Audience_Settings( new Core_Options( $this->context ) );
		$module_settings->set(
			array(
				'availableAudiences'                   => $audiences,
				'availableAudiencesLastSyncedAt'       => time(),
				'audienceSegmentationSetupCompletedBy' => null,
			)
		);
	}

	/**
	 * Default date range payload for tests.
	 *
	 * @return array
	 */
	private function get_default_date_range() {
		return array(
			'startDate'        => '2024-01-01',
			'endDate'          => '2024-01-07',
			'compareStartDate' => '2023-12-25',
			'compareEndDate'   => '2023-12-31',
		);
	}
}
