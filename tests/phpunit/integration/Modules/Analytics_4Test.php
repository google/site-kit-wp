<?php
/**
 * Analytics_4Test
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Service_Entity;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Owner_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Scopes_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Service_Entity_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Settings_ContractTests;
use Google\Site_Kit\Tests\FakeHttpClient;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaDataStream;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaDataStreamWebStreamData;
use Google\Site_Kit_Dependencies\GuzzleHttp\Message\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Message\Response;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Query;
use Google\Site_Kit_Dependencies\GuzzleHttp\Stream\Stream;

/**
 * @group Modules
 */
class Analytics_4Test extends TestCase {

	use Module_With_Scopes_ContractTests;
	use Module_With_Settings_ContractTests;
	use Module_With_Owner_ContractTests;
	use Module_With_Service_Entity_ContractTests;

	/**
	 * Context object.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Analytics 4 object.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

	public function set_up() {
		parent::set_up();

		$this->context   = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->analytics = new Analytics_4( $this->context );
	}

	public function test_register() {
		remove_all_filters( 'googlesitekit_auth_scopes' );

		$this->analytics->register();

		// Adding required scopes.
		$this->assertEquals(
			$this->analytics->get_scopes(),
			apply_filters( 'googlesitekit_auth_scopes', array() )
		);
	}

	public function test_handle_provisioning_callback() {
		$account_id       = '12345678';
		$property_id      = '1001';
		$webdatastream_id = '2001';
		$measurement_id   = '1A2BCD345E';

		$options = new Options( $this->context );
		$options->set(
			Settings::OPTION,
			array(
				'accountID'       => $account_id,
				'propertyID'      => '',
				'webDataStreamID' => '',
				'measurementID'   => '',
			)
		);

		$http_client = new FakeHttpClient();
		$http_client->set_request_handler(
			function( Request $request ) use ( $property_id, $webdatastream_id, $measurement_id ) {
				$url = parse_url( $request->getUrl() );

				if ( 'analyticsadmin.googleapis.com' !== $url['host'] ) {
					return new Response( 200 );
				}

				switch ( $url['path'] ) {
					case '/v1beta/properties':
						return new Response(
							200,
							array(),
							Stream::factory(
								json_encode(
									array(
										'name' => "properties/{$property_id}",
									)
								)
							)
						);
					case "/v1beta/properties/{$property_id}/dataStreams":
						$data = new GoogleAnalyticsAdminV1betaDataStreamWebStreamData();
						$data->setMeasurementId( $measurement_id );
						$datastream = new GoogleAnalyticsAdminV1betaDataStream();
						$datastream->setName( "properties/{$property_id}/dataStreams/{$webdatastream_id}" );
						$datastream->setType( 'WEB_DATA_STREAM' );
						$datastream->setWebStreamData( $data );

						return new Response(
							200,
							array(),
							Stream::factory(
								json_encode( $datastream->toSimpleObject() )
							)
						);
					default:
						return new Response( 200 );
				}
			}
		);

		remove_all_actions( 'googlesitekit_analytics_handle_provisioning_callback' );

		$this->analytics->get_client()->setHttpClient( $http_client );
		$this->analytics->register();

		do_action( 'googlesitekit_analytics_handle_provisioning_callback', $account_id );

		$this->assertEqualSetsWithIndex(
			array(
				'accountID'            => $account_id,
				'propertyID'           => $property_id,
				'webDataStreamID'      => $webdatastream_id,
				'measurementID'        => $measurement_id,
				'ownerID'              => 0,
				'useSnippet'           => true,
				'googleTagID'          => '',
				'googleTagAccountID'   => '',
				'googleTagContainerID' => '',
			),
			$options->get( Settings::OPTION )
		);
	}

	public function test_get_scopes() {
		$this->assertEqualSets(
			array(
				'https://www.googleapis.com/auth/analytics.readonly',
			),
			$this->analytics->get_scopes()
		);
	}

	public function test_is_connected() {
		$options   = new Options( $this->context );
		$analytics = new Analytics_4( $this->context, $options );

		$this->assertFalse( $analytics->is_connected() );

		$options->set(
			Settings::OPTION,
			array(
				'accountID'       => '12345678',
				'propertyID'      => '987654321',
				'webDataStreamID' => '1234567890',
				'measurementID'   => 'A1B2C3D4E5',
			)
		);

		$this->assertTrue( $analytics->is_connected() );
	}

	public function test_on_deactivation() {
		$options = new Options( $this->context );
		$options->set( Settings::OPTION, 'test-value' );

		$analytics = new Analytics_4( $this->context, $options );
		$analytics->on_deactivation();

		$this->assertOptionNotExists( Settings::OPTION );
	}

	public function test_get_datapoints() {
		$this->assertEqualSets(
			array(
				'account-summaries',
				'accounts',
				'container-lookup',
				'container-destinations',
				'create-property',
				'create-webdatastream',
				'properties',
				'property',
				'report',
				'webdatastreams',
				'webdatastreams-batch',
			),
			$this->analytics->get_datapoints()
		);
	}

	public function test_get_report() {
		$request_handler_calls = array();

		// Fetch a report that exercises all input parameters, barring the alternative date range formats which are tested separately.
		$data = $this->get_report(
			array(
				'startDate'        => '2022-11-02',
				'endDate'          => '2022-11-04',
				'compareStartDate' => '2022-11-01',
				'compareEndDate'   => '2022-11-02',
				'propertyID'       => '123456789',
				'url'              => 'https://example.org/some-page-here/',
				'limit'            => 321,
				'metrics'          => array(
					array( 'name' => 'sessions' ),
					array( 'name' => 'totalUsers' ),
				),
				'dimensions'       => array( 'date', 'pageTitle' ),
				'dimensionFilters' => array(
					'sessionDefaultChannelGrouping' => 'Organic Search',
					'pageTitle'                     => array( 'Title Foo', 'Title Bar' ),
				),
			),
			$request_handler_calls
		);

		$this->assertNotWPError( $data );

		// Verify the reports are returned by checking a metric value.
		$this->assertEquals( 'some-value', $data[0]['rows'][0][0]['value'] );

		// Verify the request URL and params were correctly generated.
		$this->assertCount( 1, $request_handler_calls );

		$request_url = $request_handler_calls[0]['url'];

		$this->assertEquals( 'analyticsdata.googleapis.com', $request_url['host'] );
		$this->assertEquals( '/v1beta/properties/123456789:batchRunReports', $request_url['path'] );

		$request_params = $request_handler_calls[0]['params']['requests'][0];

		// Verify the request params that are set by default.
		$this->assertEquals(
			1,
			$request_params['keepEmptyRows']
		);

		$this->assertEquals(
			array(
				'TOTAL',
				'MINIMUM',
				'MAXIMUM',
			),
			$request_params['metricAggregations']
		);

		// Verify the request params that are derived from the input parameters.
		$this->assertEquals(
			array(
				array(
					'startDate' => '2022-11-02',
					'endDate'   => '2022-11-04',
				),
				array(
					'startDate' => '2022-11-01',
					'endDate'   => '2022-11-02',
				),
			),
			$request_params['dateRanges']
		);

		$this->assertEquals(
			'properties/123456789',
			$request_params['property']
		);

		$this->assertEquals(
			321,
			$request_params['limit']
		);

		$this->assertEquals(
			array(
				array(
					'name' => 'sessions',
				),
				array(
					'name' => 'totalUsers',
				),
			),
			$request_params['metrics']
		);

		$this->assertEquals(
			array(
				array(
					'name' => 'date',
				),
				array(
					'name' => 'pageTitle',
				),
			),
			$request_params['dimensions']
		);

		$this->assertEquals(
			array(
				'andGroup' => array(
					'expressions' => array(
						// Verify the default page filter is correct.
						array(
							'filter' => array(
								'fieldName'    => 'hostName',
								'inListFilter' => array(
									'values' => array(
										'example.org',
										'www.example.org',
									),
								),
							),
						),
						// Verify the single-value dimension filter is correct.
						array(
							'filter' => array(
								'fieldName'    => 'sessionDefaultChannelGrouping',
								'stringFilter' => array(
									'matchType' => 'EXACT',
									'value'     => 'Organic Search',
								),
							),
						),
						// Verify the multi-value dimension filter is correct.
						array(
							'filter' => array(
								'fieldName'    => 'pageTitle',
								'inListFilter' => array(
									'values' => array( 'Title Foo', 'Title Bar' ),
								),
							),
						),
						// Verify the URL filter is correct.
						array(
							'filter' => array(
								'fieldName'    => 'pagePathPlusQueryString',
								'stringFilter' => array(
									'matchType' => 'EXACT',
									'value'     => 'https://example.org/some-page-here/',
								),
							),
						),
					),
				),
			),
			$request_params['dimensionFilter']
		);
	}

	public function test_get_report__date_range() {
		$request_handler_calls = array();

		$this->get_report(
			array(
				'dateRange'  => 'last-14-days',
				'propertyID' => '123456789',
				'metrics'    => array(
					array( 'name' => 'sessions' ),
				),
			),
			$request_handler_calls
		);

		$request_params = $request_handler_calls[0]['params']['requests'][0];

		$this->assertEquals(
			array(
				array(
					'startDate' => $this->days_ago_date_string( 14 ),
					'endDate'   => $this->days_ago_date_string( 1 ),
				),
			),
			$request_params['dateRanges']
		);
	}

	public function test_get_report__compare_date_ranges() {
		$request_handler_calls = array();

		$this->get_report(
			array(
				'dateRange'         => 'last-14-days',
				'compareDateRanges' => true,
				'propertyID'        => '123456789',
				'metrics'           => array(
					array( 'name' => 'sessions' ),
				),
			),
			$request_handler_calls
		);

		$request_params = $request_handler_calls[0]['params']['requests'][0];

		$this->assertEquals(
			array(
				array(
					'startDate' => $this->days_ago_date_string( 28 ),
					'endDate'   => $this->days_ago_date_string( 1 ),
				),
			),
			$request_params['dateRanges']
		);
	}
	public function test_get_report__multi_date_range() {
		$request_handler_calls = array();

		$this->get_report(
			array(
				'dateRange'      => 'last-14-days',
				'multiDateRange' => true,
				'propertyID'     => '123456789',
				'metrics'        => array(
					array( 'name' => 'sessions' ),
				),
			),
			$request_handler_calls
		);

		$request_params = $request_handler_calls[0]['params']['requests'][0];

		$this->assertEquals(
			array(
				array(
					'startDate' => $this->days_ago_date_string( 14 ),
					'endDate'   => $this->days_ago_date_string( 1 ),
				),
				array(
					'startDate' => $this->days_ago_date_string( 28 ),
					'endDate'   => $this->days_ago_date_string( 15 ),
				),
			),
			$request_params['dateRanges']
		);
	}

	public function test_report__no_property_id() {
		$request_handler_calls = array();

		$data = $this->get_report( array(), $request_handler_calls );

		$this->assertWPErrorWithMessage( 'Request parameter is empty: propertyID.', $data );
	}

	public function test_report__no_metrics() {
		$request_handler_calls = array();

		$data = $this->get_report(
			array(
				'propertyID' => '123456789',
			),
			$request_handler_calls
		);

		$this->assertWPErrorWithMessage( 'Request parameter is empty: metrics.', $data );
	}

	public function test_report__metric_validation() {
		// Enable some metrics.
		add_filter(
			'googlesitekit_shareable_analytics_4_metrics',
			function() {
				return array(
					'sessions',
					'totalUsers',
				);
			}
		);

		$property_id = '123456789';

		$request_handler_calls = array();

		$analytics = $this->setup_report( $property_id, $request_handler_calls, true );

		$data = $analytics->get_data(
			'report',
			array(
				'propertyID' => $property_id,
				'metrics'    => array(
					array( 'name' => 'sessions' ),
					array( 'name' => 'totalUsers' ),
					array( 'name' => 'invalidMetric' ),
					array( 'name' => 'anotherInvalidMetric' ),
				),
			),
			$request_handler_calls
		);

		$this->assertWPErrorWithMessage( 'Unsupported metrics requested: invalidMetric, anotherInvalidMetric', $data );
	}

	public function test_report__dimension_validation() {
		// Enable some metrics and dimensions.
		add_filter(
			'googlesitekit_shareable_analytics_4_metrics',
			function() {
				return array(
					'sessions',
				);
			}
		);

		add_filter(
			'googlesitekit_shareable_analytics_4_dimensions',
			function() {
				return array(
					'date',
					'pageTitle',
				);
			}
		);

		$property_id = '123456789';

		$request_handler_calls = array();

		$analytics = $this->setup_report( $property_id, $request_handler_calls, true );

		$data = $analytics->get_data(
			'report',
			array(
				'propertyID' => $property_id,
				'metrics'    => array(
					array( 'name' => 'sessions' ),
				),
				'dimensions' => array( 'date', 'pageTitle', 'invalidDimension', 'anotherInvalidDimension' ),
			),
			$request_handler_calls
		);

		$this->assertWPErrorWithMessage( 'Unsupported dimensions requested: invalidDimension, anotherInvalidDimension', $data );
	}

	/**
	 * Returns a date string for the given number of days ago.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $days_ago The number of days ago.
	 * @return string The date string, formatted as YYYY-MM-DD.
	 */
	protected function days_ago_date_string( $days_ago ) {
		return gmdate( 'Y-m-d', strtotime( $days_ago . ' days ago' ) );
	}

	/**
	 * Retrieves a mock Analytics 4 report.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $report_params The report parameters.
	 * @return RunReportResponse[] The report response.
	 */
	protected function get_report( array $report_params, array &$request_handler_calls ) {
		$property_id = isset( $report_params['propertyID'] ) ? $report_params['propertyID'] : null;

		$analytics = $this->setup_report( $property_id, $request_handler_calls );

		return $analytics->get_data( 'report', $report_params );
	}

	/**
	 * Sets up a mock Analytics 4 instance in preparation for retrieving a report.
	 *
	 * This is a helper method to avoid duplicating the same code in multiple tests.
	 * It also allows us to mock the HTTP client to verify the request parameters.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $property_id The property ID.
	 * @param array $request_handler_calls Output variable for tracking the request handler calls. Passed by reference.
	 * @param boolean [enable_validation] Whether to enable validation of the metrics and dimensions. Default false.
	 * @return Analytics_4 The Analytics 4 instance.
	 */
	protected function setup_report( $property_id, array &$request_handler_calls, $enable_validation = false ) {
		$user_id        = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$user_options   = new User_Options( $context, $user_id );
		$authentication = new Authentication( $context, $options, $user_options );
		$analytics      = new Analytics_4( $context, $options, $user_options, $authentication );

		$authentication->get_oauth_client()->get_client()->setHttpClient(
			new FakeHttpClient() // Returns 200 by default.
		);
		wp_set_current_user( $user_id );

		// Grant scopes so request doesn't fail.
		$authentication->get_oauth_client()->set_granted_scopes(
			$analytics->get_scopes()
		);

		$http_client = new FakeHttpClient();
		$http_client->set_request_handler(
			function ( Request $request ) use ( $property_id, &$request_handler_calls ) {
				$url    = parse_url( $request->getUrl() );
				$params = json_decode( (string) $request->getBody(), true );

				$request_handler_calls[] = array(
					'url'    => $url,
					'params' => $params,
				);

				if ( 'analyticsdata.googleapis.com' !== $url['host'] ) {
					return new Response( 200 );
				}

				switch ( $url['path'] ) {
					case "/v1beta/properties/$property_id:batchRunReports":
						// Return a mock report.
						return new Response(
							200,
							array(),
							Stream::factory(
								json_encode(
									array(
										'kind'    => 'analyticsData#batchRunReports',
										'reports' => array(
											array(
												'rows' => array(
													array(
														'metricValues' => array(
															array(
																'value' => 'some-value',
															),
														),
													),
												),
											),
										),
									)
								)
							)
						);

					default:
						return new Response( 200 );
				}
			}
		);

		$analytics->get_client()->setHttpClient( $http_client );
		$analytics->register();

		if ( $enable_validation ) {
			// Metrics and dimensions are only validated when using shared credentials; this block of code sets up the shared credentials scenario.

			$this->enable_feature( 'dashboardSharing' );

			// Re-register Permissions after enabling the dashboardSharing feature to include dashboard sharing capabilities.
			// TODO: Remove this when `dashboardSharing` feature flag is removed.
			$modules     = new Modules( $context, null, $user_options, $authentication );
			$permissions = new Permissions( $context, $authentication, $modules, $user_options, new Dismissed_Items( $user_options ) );
			$permissions->register();

			// Ensure the user is authenticated.
			$authentication->get_oauth_client()->set_token(
				array(
					'access_token' => 'valid-auth-token',
				)
			);

			// Ensure the Analytics 4 module is connected and the owner ID is set.
			update_option(
				'googlesitekit_analytics-4_settings',
				array(
					'propertyID'      => '123',
					'webDataStreamID' => '456',
					'measurementID'   => 'G-789',
					'ownerID'         => get_current_user_id(),
				)
			);

			// Setup a user with shared access to the Analytics 4 module.
			$admin = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
			wp_set_current_user( $admin->ID );

			add_option(
				Module_Sharing_Settings::OPTION,
				array(
					'analytics-4' => array(
						'sharedRoles' => array( 'administrator' ),
						'management'  => 'all_admins',
					),
				)
			);
		}

		return $analytics;
	}

	/**
	 * @return Module_With_Scopes
	 */
	protected function get_module_with_scopes() {
		return $this->analytics;
	}

	/**
	 * @return Module_With_Settings
	 */
	protected function get_module_with_settings() {
		return $this->analytics;
	}

	/**
	 * @return Module_With_Owner
	 */
	protected function get_module_with_owner() {
		return $this->analytics;
	}

	/**
	 * @return Module_With_Service_Entity
	 */
	protected function get_module_with_service_entity() {
		return new Analytics_4( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	protected function set_up_check_service_entity_access( Module $module ) {
		$module->get_settings()->merge(
			array(
				'propertyID' => '123456789',
			)
		);
	}

}
