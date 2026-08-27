<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Email_Reporting\Analytics_4_Report_Request_AssemblerTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Email_Reporting\Report_Options as Analytics_4_Report_Options;
use Google\Site_Kit\Modules\Analytics_4\Email_Reporting\Report_Request_Assembler as Analytics_4_Report_Request_Assembler;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Email_Reporting
 */
class Analytics_4_Report_Request_AssemblerTest extends TestCase {

	/**
	 * Plugin context.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Report options `Report_Request_Assembler` reads, kept so a test can compare a
	 * registered request against the `Report_Options` method that built it.
	 *
	 * @var Analytics_4_Report_Options
	 */
	private $report_options;

	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
	}

	public function tear_down() {
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	public function test_build_requests__registers_the_store_count_and_sessions_split_by_provider_when_the_event_provider_dimension_has_data() {
		$requests = $this->build_requests_for_events(
			array( 'purchase' ),
			array( Analytics_4::CUSTOM_DIMENSION_EVENT_PROVIDER => true )
		);

		$this->assertArrayHasKey( 'site_goals_online_store_primary_by_provider', $requests, 'build_requests() should register the store count split by provider when the event provider dimension has data.' );
		$this->assertArrayHasKey( 'site_goals_engagement_by_provider', $requests, 'build_requests() should register the sessions split by provider when the event provider dimension has data.' );
		$this->assertSame(
			$this->report_options->get_online_store_primary_options( Analytics_4::CUSTOM_DIMENSION_EVENT_PROVIDER ),
			$requests['site_goals_online_store_primary_by_provider'],
			'build_requests() should register the store count split by provider under site_goals_online_store_primary_by_provider.'
		);
		$this->assertSame(
			$this->report_options->get_engagement_options( Analytics_4::CUSTOM_DIMENSION_EVENT_PROVIDER ),
			$requests['site_goals_engagement_by_provider'],
			'build_requests() should register the sessions split by provider under site_goals_engagement_by_provider.'
		);
		$this->assertArrayNotHasKey( 'site_goals_online_store_primary', $requests, 'build_requests() should leave out the site-wide store count when it registers site_goals_online_store_primary_by_provider.' );
		$this->assertArrayNotHasKey( 'site_goals_engagement', $requests, 'build_requests() should register no site-wide sessions when the store count splits by provider and the site sends no lead event.' );
	}

	public function test_build_requests__registers_the_site_wide_store_count_and_sessions_when_the_event_provider_dimension_has_no_data() {
		$requests = $this->build_requests_for_events( array( 'purchase' ) );

		$this->assertArrayHasKey( 'site_goals_online_store_primary', $requests, 'build_requests() should register the site-wide store count when the event provider dimension has no data.' );
		$this->assertArrayHasKey( 'site_goals_engagement', $requests, 'build_requests() should register the site-wide sessions when the event provider dimension has no data.' );
		$this->assertSame(
			$this->report_options->get_online_store_primary_options(),
			$requests['site_goals_online_store_primary'],
			'build_requests() should register the site-wide store count under site_goals_online_store_primary.'
		);
		$this->assertSame(
			$this->report_options->get_engagement_options(),
			$requests['site_goals_engagement'],
			'build_requests() should register the site-wide sessions under site_goals_engagement.'
		);
		$this->assertArrayNotHasKey( 'site_goals_online_store_primary_by_provider', $requests, 'build_requests() should not split the store count by provider when the event provider dimension has no data.' );
		$this->assertArrayNotHasKey( 'site_goals_engagement_by_provider', $requests, 'build_requests() should not split the sessions by provider when the event provider dimension has no data.' );
	}

	public function test_build_requests__registers_the_lead_count_and_sessions_split_by_form_when_the_form_id_dimension_has_data() {
		$requests = $this->build_requests_for_events(
			array( 'contact' ),
			array( Analytics_4::CUSTOM_DIMENSION_FORM_ID => true )
		);

		$this->assertArrayHasKey( 'site_goals_lead_primary_by_form', $requests, 'build_requests() should register the lead count split by form when the form ID dimension has data.' );
		$this->assertArrayHasKey( 'site_goals_engagement_by_form', $requests, 'build_requests() should register the sessions split by form when the form ID dimension has data.' );
		$this->assertSame(
			$this->report_options->get_lead_primary_options( Analytics_4::CUSTOM_DIMENSION_FORM_ID ),
			$requests['site_goals_lead_primary_by_form'],
			'build_requests() should register the lead count split by form under site_goals_lead_primary_by_form.'
		);
		$this->assertSame(
			$this->report_options->get_engagement_options( Analytics_4::CUSTOM_DIMENSION_FORM_ID ),
			$requests['site_goals_engagement_by_form'],
			'build_requests() should register the sessions split by form under site_goals_engagement_by_form.'
		);
		$this->assertArrayNotHasKey( 'site_goals_lead_primary', $requests, 'build_requests() should leave out the site-wide lead count when it registers site_goals_lead_primary_by_form.' );
		$this->assertArrayNotHasKey( 'site_goals_engagement', $requests, 'build_requests() should register no site-wide sessions when the lead count splits by form and the site sends no store event.' );
	}

	public function test_build_requests__registers_the_site_wide_lead_count_and_sessions_when_the_form_id_dimension_has_no_data() {
		$requests = $this->build_requests_for_events( array( 'contact' ) );

		$this->assertArrayHasKey( 'site_goals_lead_primary', $requests, 'build_requests() should register the site-wide lead count when the form ID dimension has no data.' );
		$this->assertArrayHasKey( 'site_goals_engagement', $requests, 'build_requests() should register the site-wide sessions when the form ID dimension has no data.' );
		$this->assertSame(
			$this->report_options->get_lead_primary_options(),
			$requests['site_goals_lead_primary'],
			'build_requests() should register the site-wide lead count under site_goals_lead_primary.'
		);
		$this->assertSame(
			$this->report_options->get_engagement_options(),
			$requests['site_goals_engagement'],
			'build_requests() should register the site-wide sessions under site_goals_engagement.'
		);
		$this->assertArrayNotHasKey( 'site_goals_lead_primary_by_form', $requests, 'build_requests() should not split the lead count by form when the form ID dimension has no data.' );
		$this->assertArrayNotHasKey( 'site_goals_engagement_by_form', $requests, 'build_requests() should not split the sessions by form when the form ID dimension has no data.' );
	}

	public function test_build_requests__registers_no_store_request_when_the_site_sends_no_store_event() {
		$requests = $this->build_requests_for_events(
			array( 'contact' ),
			array( Analytics_4::CUSTOM_DIMENSION_EVENT_PROVIDER => true )
		);

		$this->assertSame(
			array(),
			$this->request_keys_starting_with( $requests, 'site_goals_online_store' ),
			'build_requests() should register no online store request when the site sends no store event.'
		);
	}

	public function test_build_requests__registers_no_lead_request_when_the_site_sends_no_lead_event() {
		$requests = $this->build_requests_for_events(
			array( 'purchase' ),
			array( Analytics_4::CUSTOM_DIMENSION_FORM_ID => true )
		);

		$this->assertSame(
			array(),
			$this->request_keys_starting_with( $requests, 'site_goals_lead' ),
			'build_requests() should register no lead generation request when the site sends no lead event.'
		);
	}

	public function test_build_requests__registers_one_engagement_report_for_the_store_and_lead_widgets_when_neither_breakdown_dimension_has_data() {
		$requests = $this->build_requests_for_events( array( 'purchase', 'contact' ) );

		$this->assertSame(
			array( 'site_goals_engagement' ),
			$this->request_keys_starting_with( $requests, 'site_goals_engagement' ),
			'build_requests() should register one engagement report when neither widget splits its rows, because the store and lead widgets then read the same site-wide sessions.'
		);
		$this->assertSame(
			$this->report_options->get_engagement_options(),
			$requests['site_goals_engagement'],
			'build_requests() should register the site-wide engagement options under site_goals_engagement when the store and lead widgets share one report.'
		);
	}

	public function test_build_requests__registers_one_engagement_report_for_each_breakdown_dimension() {
		$requests = $this->build_requests_for_events(
			array( 'purchase', 'contact' ),
			$this->breakdown_dimension_availability()
		);

		$this->assertSame(
			array( 'site_goals_engagement_by_provider', 'site_goals_engagement_by_form' ),
			$this->request_keys_starting_with( $requests, 'site_goals_engagement' ),
			'build_requests() should register one engagement report for each breakdown dimension, because the online store splits its rows by provider and lead generation splits its rows by form.'
		);
	}

	public function test_build_requests__registers_the_top_authors_report_when_the_post_author_dimension_has_data() {
		$requests = $this->build_requests_for_events(
			array(),
			array( Analytics_4::CUSTOM_DIMENSION_POST_AUTHOR => true )
		);

		$this->assertArrayHasKey( 'top_authors', $requests, 'build_requests() should register the top authors report when the post author dimension has data.' );
		$this->assertSame(
			$this->report_options->get_top_authors_options(),
			$requests['top_authors'],
			'build_requests() should register the top authors options under top_authors.'
		);
		$this->assertArrayNotHasKey( 'top_categories', $requests, 'build_requests() should register no top categories report when the post categories dimension has no data.' );
	}

	public function test_build_requests__registers_the_top_categories_report_when_the_post_categories_dimension_has_data() {
		$requests = $this->build_requests_for_events(
			array(),
			array( Analytics_4::CUSTOM_DIMENSION_POST_CATEGORIES => true )
		);

		$this->assertArrayHasKey( 'top_categories', $requests, 'build_requests() should register the top categories report when the post categories dimension has data.' );
		$this->assertSame(
			$this->report_options->get_top_categories_options(),
			$requests['top_categories'],
			'build_requests() should register the top categories options under top_categories.'
		);
		$this->assertArrayNotHasKey( 'top_authors', $requests, 'build_requests() should register no top authors report when the post author dimension has no data.' );
	}

	public function test_build_requests__still_registers_the_reports_outside_site_goals() {
		$requests = $this->build_requests_for_events( array( 'purchase', 'contact' ) );

		$this->assertArrayHasKey( 'total_visitors', $requests, 'build_requests() should still register the total visitors report alongside the Site Goals reports.' );
		$this->assertArrayHasKey( 'traffic_channels', $requests, 'build_requests() should still register the traffic channels report alongside the Site Goals reports.' );
		$this->assertArrayHasKey( 'popular_content', $requests, 'build_requests() should still register the popular content report alongside the Site Goals reports.' );
	}

	public function test_build_requests__registers_every_site_goals_request_key_and_no_other() {
		$site_wide_keys = $this->request_keys_starting_with(
			$this->build_requests_for_events( array( 'purchase', 'contact' ) ),
			'site_goals_'
		);
		$breakdown_keys = $this->request_keys_starting_with(
			$this->build_requests_for_events( array( 'purchase', 'contact' ), $this->breakdown_dimension_availability() ),
			'site_goals_'
		);

		$site_goals_keys = array(
			'site_goals_online_store_primary',
			'site_goals_online_store_primary_by_provider',
			'site_goals_lead_primary',
			'site_goals_lead_primary_by_form',
			'site_goals_engagement',
			'site_goals_engagement_by_provider',
			'site_goals_engagement_by_form',
		);

		$this->assertEqualSets(
			$site_goals_keys,
			Analytics_4_Report_Request_Assembler::SITE_GOALS_REQUEST_KEYS,
			'SITE_GOALS_REQUEST_KEYS should hold every Site Goals payload key.'
		);
		$this->assertEqualSets(
			$site_goals_keys,
			array_merge( $site_wide_keys, $breakdown_keys ),
			'build_requests() should register every Site Goals payload key, and no other.'
		);
	}

	/**
	 * Builds the report requests for the given detected events and dimension availability.
	 *
	 * The `Report_Options` that built the requests stays in `$this->report_options`.
	 *
	 * @param array $detected_events Detected event names.
	 * @param array $availability    Optional. Custom dimension availability keyed by dimension slug. Default empty.
	 * @return array Report requests keyed by payload key.
	 */
	private function build_requests_for_events( array $detected_events, array $availability = array() ) {
		$this->report_options = new Analytics_4_Report_Options(
			array(
				'startDate'        => '2024-01-01',
				'endDate'          => '2024-01-07',
				'compareStartDate' => '2023-12-25',
				'compareEndDate'   => '2023-12-31',
			),
			array(),
			$this->context
		);

		// The test sets the same three options `Email_Reporting_Data_Requests` sets
		// before it builds the requests.
		$this->report_options->set_audience_segmentation_enabled( false );
		$this->report_options->set_detected_events( $detected_events );
		$this->report_options->set_custom_dimension_availability( $availability );

		$assembler = new Analytics_4_Report_Request_Assembler( $this->report_options );

		list( $requests ) = $assembler->build_requests();

		return $requests;
	}

	/**
	 * Gets a custom dimension availability map where the event provider and form ID
	 * dimensions both hold data.
	 *
	 * @return array Custom dimension availability keyed by dimension slug.
	 */
	private function breakdown_dimension_availability() {
		return array(
			Analytics_4::CUSTOM_DIMENSION_EVENT_PROVIDER => true,
			Analytics_4::CUSTOM_DIMENSION_FORM_ID        => true,
		);
	}

	/**
	 * Gets the request keys that start with the given prefix, as a plain list.
	 *
	 * @param array  $requests Report requests keyed by payload key.
	 * @param string $prefix   Payload key prefix.
	 * @return array Matching request keys.
	 */
	private function request_keys_starting_with( array $requests, $prefix ) {
		return array_values(
			array_filter(
				array_keys( $requests ),
				function ( $key ) use ( $prefix ) {
					return 0 === strpos( $key, $prefix );
				}
			)
		);
	}
}
