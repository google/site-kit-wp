<?php
/**
 * Tests for Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Data_Requests
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Data_Requests;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Modules\AdSense;
use Google\Site_Kit\Modules\AdSense\Settings as AdSense_Settings;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Audience_Settings as Module_Audience_Settings;
use Google\Site_Kit\Modules\Analytics_4\Custom_Dimensions_Data_Available;
use Google\Site_Kit\Modules\Analytics_4\Settings as Analytics_4_Settings;
use Google\Site_Kit\Modules\Search_Console;
use Google\Site_Kit\Modules\Search_Console\Settings as Search_Console_Settings;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\ModulesHelperTrait;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use Google\Site_Kit_Dependencies\Google\Service\Adsense\ReportResult as Google_Service_Adsense_ReportResult;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\RunReportResponse;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Row as Analytics_Data_Row;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\DimensionValue;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\MetricValue;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\MetricHeader;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole\SearchAnalyticsQueryResponse;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole\ApiDataRow;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client_Base;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use ReflectionProperty;
use WP_Error;

/**
 * @group Email_Reporting
 */
class Email_Reporting_Data_RequestsTest extends TestCase {

	use ModulesHelperTrait;
	use Fake_Site_Connection_Trait;

	private $context;
	private $transients;
	private $modules;
	private $date_range;
	private $options;
	private $user_options;
	private $authentication;
	private $permissions;

	public function set_up() {
		parent::set_up();
		$this->context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->transients     = new Transients( $this->context );
		$this->options        = new Options( $this->context );
		$this->user_options   = new User_Options( $this->context );
		$this->authentication = new Authentication( $this->context, $this->options, $this->user_options );
		$this->modules        = new Modules( $this->context, $this->options, $this->user_options, $this->authentication );
		$this->date_range     = array(
			'startDate'        => '2024-01-01',
			'endDate'          => '2024-01-31',
			'compareStartDate' => '2023-12-01',
			'compareEndDate'   => '2023-12-31',
		);

		add_filter( 'googlesitekit_setup_complete', '__return_true' );
		$this->fake_proxy_site_connection();
	}

	public function test_admin_user_receives_payloads() {
		$admin_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$this->authenticate_and_grant_required_scopes_for_user( $admin_id );

		$options           = new Options( $this->context );
		$audience_settings = new Module_Audience_Settings( $options );
		$audience_settings->register();
		$audience_settings->merge(
			array(
				'audienceSegmentationSetupCompletedBy' => $admin_id,
			)
		);

		$custom_dimension_data = new Custom_Dimensions_Data_Available( new Transients( $this->context ) );
		$custom_dimension_data->set_data_available( Analytics_4::CUSTOM_DIMENSION_POST_AUTHOR );
		$custom_dimension_data->set_data_available( Analytics_4::CUSTOM_DIMENSION_POST_CATEGORIES );

		$conversion_tracking = $this->createMock( Conversion_Tracking::class );
		$conversion_tracking->method( 'get_supported_conversion_events' )->willReturn(
			array( 'add_to_cart', 'purchase' )
		);

		$this->activate_modules( Analytics_4::MODULE_SLUG, Search_Console::MODULE_SLUG, AdSense::MODULE_SLUG );
		$this->set_active_modules(
			array( Analytics_4::MODULE_SLUG, Search_Console::MODULE_SLUG, AdSense::MODULE_SLUG )
		);
		$this->set_analytics_settings_connected();
		$this->set_search_console_settings_connected();
		$this->set_adsense_settings_connected(
			array(
				'accountID'            => 'pub-123456',
				'accountSetupComplete' => true,
				'siteSetupComplete'    => true,
			)
		);

		$analytics      = $this->modules->get_module( Analytics_4::MODULE_SLUG );
		$search_console = $this->modules->get_module( Search_Console::MODULE_SLUG );
		$adsense        = $this->modules->get_module( AdSense::MODULE_SLUG );

		$analytics->register();
		$search_console->register();
		$adsense->register();

		$this->fake_analytics_report( $analytics );
		$this->fake_search_console_report( $search_console );
		$this->fake_adsense_report( $adsense );

		$data_requests = $this->create_data_requests( $conversion_tracking );
		$payload       = $data_requests->get_user_payload( $admin_id, $this->date_range );

		$this->assertIsArray( $payload, 'Payload should be a flat array of section data for admin.' );
		$this->assertArrayHasKey( 'total_conversion_events', $payload, 'Conversion events payload should be included.' );
		$this->assertArrayHasKey( 'products_added_to_cart', $payload, 'Products added to cart payload should be included.' );
		$this->assertArrayHasKey( 'purchases', $payload, 'Purchases payload should be included.' );
		$this->assertArrayHasKey( 'total_visitors', $payload, 'Total visitors payload should be included.' );
		$this->assertArrayHasKey( 'traffic_channels', $payload, 'Traffic channels payload should be included.' );
		$this->assertArrayHasKey( 'popular_content', $payload, 'Popular content payload should be included.' );
		$this->assertArrayHasKey( 'total_impressions', $payload, 'Search Console impressions payload should be included.' );
		$this->assertArrayHasKey( 'total_clicks', $payload, 'Search Console clicks payload should be included.' );
		$this->assertArrayHasKey( 'top_ctr_keywords', $payload, 'Search Console top CTR keywords payload should be included.' );
		$this->assertArrayHasKey( 'top_pages_by_clicks', $payload, 'Search Console top pages payload should be included.' );
		$this->assertArrayHasKey( 'total_earnings', $payload, 'AdSense earnings payload should be included.' );
	}

	public function test_user_without_shared_roles_gets_empty_payload() {
		$viewer_id = self::factory()->user->create( array( 'role' => 'editor' ) );

		$this->activate_modules( Search_Console::MODULE_SLUG );
		$this->set_active_modules( array( Search_Console::MODULE_SLUG ) );
		$this->set_search_console_settings_connected();

		$data_requests = $this->create_data_requests();
		$payload       = $data_requests->get_user_payload( $viewer_id, $this->date_range );

		$this->assertSame( array(), $payload, 'Viewer without shared roles should receive no payload.' );
	}

	public function test_view_only_user_with_shared_module_gets_shared_payload_only() {
		$admin_id  = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$viewer_id = self::factory()->user->create( array( 'role' => 'editor' ) );

		$this->authenticate_and_grant_required_scopes_for_user( $admin_id );

		$this->set_active_modules( array( Analytics_4::MODULE_SLUG, Search_Console::MODULE_SLUG ) );
		$this->activate_modules( Analytics_4::MODULE_SLUG, Search_Console::MODULE_SLUG );
		$this->set_analytics_settings_connected();
		$this->set_search_console_settings_connected();

		$conversion_tracking = $this->createMock( Conversion_Tracking::class );
		$conversion_tracking->method( 'get_supported_conversion_events' )->willReturn(
			array( 'add_to_cart', 'purchase' )
		);

		// Assign ownership to the admin so shared data uses admin tokens.
		$this->options->set(
			Analytics_4_Settings::OPTION,
			array(
				'ownerID'         => $admin_id,
				'accountID'       => '12345678',
				'propertyID'      => '987654321',
				'webDataStreamID' => '1234567890',
				'measurementID'   => 'A1B2C3D4E5',
			)
		);

		// Share Analytics with editors.
		$this->options->set(
			Module_Sharing_Settings::OPTION,
			array(
				Analytics_4::MODULE_SLUG => array(
					'sharedRoles' => array( 'editor' ),
					'management'  => 'owner',
				),
			)
		);

		$analytics = $this->modules->get_module( Analytics_4::MODULE_SLUG );
		$analytics->register();
		$this->fake_analytics_report( $analytics );

		$http_filter = function ( $preempt, $args, $url ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			if ( false !== strpos( $url, 'analyticsdata.googleapis.com' ) ) {
				return array(
					'headers'  => array(),
					'body'     => wp_json_encode(
						array(
							'rows'          => array(
								array(
									'dimensionValues' => array( array( 'value' => '20240101' ) ),
									'metricValues'    => array( array( 'value' => '1' ) ),
								),
							),
							'metricHeaders' => array( array( 'name' => 'totalUsers' ) ),
							'rowCount'      => 1,
						)
					),
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
					'cookies'  => array(),
				);
			}

			return $preempt;
		};
		add_filter( 'pre_http_request', $http_filter, 10, 3 );

		$data_requests = $this->create_data_requests( $conversion_tracking );
		$payload       = $data_requests->get_user_payload( $viewer_id, $this->date_range );

		remove_filter( 'pre_http_request', $http_filter, 10 );

		$this->assertIsArray( $payload, 'Payload for shared viewer should be an array.' );
		$this->assertArrayHasKey( 'total_conversion_events', $payload, 'Shared viewer should see conversion events.' );
		$this->assertArrayHasKey( 'products_added_to_cart', $payload, 'Shared viewer should see products added to cart.' );
		$this->assertArrayHasKey( 'purchases', $payload, 'Shared viewer should see purchases.' );
		$this->assertArrayNotHasKey( 'total_impressions', $payload, 'Unshared Search Console data should be absent.' );
		$this->assertArrayNotHasKey( 'total_clicks', $payload, 'Unshared Search Console clicks should be absent.' );
		$this->assertArrayNotHasKey( 'total_earnings', $payload, 'Unshared AdSense earnings should be absent.' );
		$this->assertArrayNotHasKey( 'new_visitors', $payload, 'Audience segmentation data should be absent.' );
		$this->assertArrayNotHasKey( 'returning_visitors', $payload, 'Audience segmentation data should be absent.' );
		$this->assertArrayNotHasKey( 'top_authors', $payload, 'Custom dimension authors data should be absent.' );
		$this->assertArrayNotHasKey( 'top_categories', $payload, 'Custom dimension categories data should be absent.' );
	}

	public function test_recoverable_or_not_connected_modules_are_skipped() {
		$admin_id = self::factory()->user->create( array( 'role' => 'administrator' ) );

		$this->authenticate_and_grant_required_scopes_for_user( $admin_id );

		$recoverable_filter = function ( $recoverable, $slug ) {
			if ( Search_Console::MODULE_SLUG === $slug ) {
				return true;
			}
			return $recoverable;
		};
		add_filter( 'googlesitekit_is_module_recoverable', $recoverable_filter, 10, 2 );

		$this->activate_modules( Search_Console::MODULE_SLUG, Analytics_4::MODULE_SLUG, AdSense::MODULE_SLUG );
		$this->set_active_modules(
			array( Search_Console::MODULE_SLUG, Analytics_4::MODULE_SLUG, AdSense::MODULE_SLUG )
		);
		$this->set_search_console_settings_connected();
		$this->set_adsense_settings_connected();
		$adsense = $this->modules->get_module( AdSense::MODULE_SLUG );
		$adsense->register();
		$this->fake_adsense_report( $adsense );

		$data_requests = $this->create_data_requests();
		$payload       = $data_requests->get_user_payload( $admin_id, $this->date_range );

		remove_filter( 'googlesitekit_is_module_recoverable', $recoverable_filter, 10 );

		$this->assertArrayNotHasKey( 'total_visitors', $payload, 'Recoverable Analytics should be skipped.' );
		$this->assertArrayNotHasKey( 'total_impressions', $payload, 'Recoverable Search Console should be skipped.' );
		$this->assertArrayHasKey( 'total_earnings', $payload, 'Active AdSense should remain in payload.' );
	}

	private function create_data_requests( Conversion_Tracking $conversion_tracking = null ) {
		if ( null === $conversion_tracking ) {
			$conversion_tracking = $this->createMock( Conversion_Tracking::class );
			$conversion_tracking->method( 'get_supported_conversion_events' )->willReturn( array() );
		}

		return new Email_Reporting_Data_Requests(
			$this->context,
			$this->modules,
			$conversion_tracking,
			$this->transients,
			$this->user_options
		);
	}

	private function set_analytics_settings_connected() {
		$settings = new Analytics_4_Settings( $this->options );
		$settings->merge(
			array(
				'accountID'       => '12345678',
				'propertyID'      => '987654321',
				'webDataStreamID' => '1234567890',
				'measurementID'   => 'A1B2C3D4E5',
			)
		);
	}

	private function set_adsense_settings_connected( array $overrides = array() ) {
		$settings = new AdSense_Settings( $this->options );
		$settings->merge(
			wp_parse_args(
				$overrides,
				array(
					'accountID'            => 'pub-222',
					'accountSetupComplete' => true,
					'siteSetupComplete'    => true,
				)
			)
		);
	}

	private function set_search_console_settings_connected() {
		$settings = new Search_Console_Settings( $this->options );
		$settings->merge( array( 'propertyID' => home_url( '/' ) ) );
	}

	private function set_active_modules( array $slugs ) {
		$this->options->set( Modules::OPTION_ACTIVE_MODULES, $slugs );
	}

	private function fake_analytics_report( Analytics_4 $analytics ) {
		$handler = function ( Request $request ) {
			if ( $request->getUri()->getHost() !== 'analyticsdata.googleapis.com' ) {
				return new FulfilledPromise( new Response( 200 ) );
			}

			$dimension_value = new DimensionValue();
			$dimension_value->setValue( '20240101' );

			$metric_value = new MetricValue();
			$metric_value->setValue( '1' );

			$row = new Analytics_Data_Row();
			$row->setDimensionValues( array( $dimension_value ) );
			$row->setMetricValues( array( $metric_value ) );

			$metric_header = new MetricHeader();
			$metric_header->setName( 'totalUsers' );

			$response = new RunReportResponse();
			$response->setRows( array( $row ) );
			$response->setMetricHeaders( array( $metric_header ) );
			$response->setRowCount( 1 );

			return new FulfilledPromise(
				new Response(
					200,
					array(),
					json_encode( $response )
				)
			);
		};

		FakeHttp::fake_google_http_handler(
			$analytics->get_client(),
			$handler
		);

		if ( $analytics->get_owner_id() ) {
			FakeHttp::fake_google_http_handler(
				$analytics->get_owner_oauth_client()->get_client(),
				$handler
			);
		}
	}

	private function fake_search_console_report( Search_Console $search_console ) {
		FakeHttp::fake_google_http_handler(
			$search_console->get_client(),
			function ( Request $request ) {
				if ( $request->getUri()->getHost() !== 'searchconsole.googleapis.com' ) {
					return new FulfilledPromise( new Response( 200 ) );
				}

				$row = new ApiDataRow();
				$row->setClicks( 1 );
				$row->setImpressions( 2 );
				$row->setCtr( 0.5 );
				$row->setPosition( 3 );
				$row->setKeys( array( '/' ) );

				$response = new SearchAnalyticsQueryResponse();
				$response->setRows( array( $row ) );

				return new FulfilledPromise(
					new Response(
						200,
						array(),
						json_encode( $response )
					)
				);
			}
		);
	}

	private function fake_adsense_report( AdSense $adsense ) {
		FakeHttp::fake_google_http_handler(
			$adsense->get_client(),
			function ( Request $request ) {
				if ( false === strpos( $request->getUri()->getHost(), 'adsense' ) ) {
					return new FulfilledPromise( new Response( 200 ) );
				}

				$response = new Google_Service_Adsense_ReportResult(
					array(
						'rows' => array(
							array(
								'cells' => array(
									array( 'value' => '10' ),
								),
							),
						),
					)
				);

				return new FulfilledPromise(
					new Response(
						200,
						array(),
						json_encode( $response )
					)
				);
			}
		);
	}

	private function authenticate_and_grant_required_scopes_for_user( $user_id ) {
		$previous_user = get_current_user_id();
		wp_set_current_user( $user_id );
		$this->user_options->switch_user( $user_id );

		$this->permissions = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, new Dismissed_Items( $this->user_options ) );
		$this->permissions->register();

		$oauth_client = $this->authentication->get_oauth_client();
		$scopes       = $oauth_client->get_required_scopes();

		foreach ( array( Analytics_4::MODULE_SLUG, Search_Console::MODULE_SLUG, AdSense::MODULE_SLUG ) as $module_slug ) {
			$module_scopes = $this->modules->get_module( $module_slug )->get_scopes();
			if ( is_array( $module_scopes ) ) {
				$scopes = array_merge( $scopes, $module_scopes );
			}
		}

		$this->authentication->verification()->set( true );

		$scopes = array_values( array_unique( $scopes ) );
		$oauth_client->set_token( array( 'access_token' => 'valid-auth-token' ) );
		$oauth_client->set_granted_scopes( $scopes );

		if ( $previous_user ) {
			wp_set_current_user( $previous_user );
		}
	}
}
