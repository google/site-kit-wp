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
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Owner_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Scopes_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Service_Entity_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Settings_ContractTests;
use Google\Site_Kit\Tests\FakeHttpClient;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\UserAuthenticationTrait;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaConversionEvent;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaDataStream;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaDataStreamWebStreamData;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaListConversionEventsResponse;
use Google\Site_Kit_Dependencies\Google\Service\TagManager\Container;
use Google\Site_Kit_Dependencies\GuzzleHttp\Message\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Message\Response;
use Google\Site_Kit_Dependencies\GuzzleHttp\Stream\Stream;
use WP_User;

/**
 * @group Modules
 */
class Analytics_4Test extends TestCase {

	use Module_With_Scopes_ContractTests;
	use Module_With_Settings_ContractTests;
	use Module_With_Owner_ContractTests;
	use Module_With_Service_Entity_ContractTests;
	use UserAuthenticationTrait;

	/**
	 * Context object.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * User object.
	 *
	 * @var WP_User
	 */
	private $user;

	/**
	 * User Options object.
	 *
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Authentication object.
	 *
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * Analytics 4 object.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

	/**
	 * Fake HTTP request handler calls.
	 *
	 * @var array
	 */
	private $request_handler_calls;

	public function set_up() {
		parent::set_up();

		$this->context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options              = new Options( $this->context );
		$this->user           = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$this->user_options   = new User_Options( $this->context, $this->user->ID );
		$this->authentication = new Authentication( $this->context, $options, $this->user_options );
		$this->analytics      = new Analytics_4( $this->context, $options, $this->user_options, $this->authentication );
		wp_set_current_user( $this->user->ID );
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

	public function test_handle_provisioning_callback__gteSupport() {
		$this->enable_feature( 'gteSupport' );
		$account_id              = '12345678';
		$property_id             = '1001';
		$webdatastream_id        = '2001';
		$measurement_id          = '1A2BCD345E';
		$google_tag_account_id   = '123';
		$google_tag_container_id = '456';
		$tag_ids                 = array( 'GT-123', 'G-456' );

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
			function( Request $request ) use ( $property_id, $webdatastream_id, $measurement_id, $google_tag_account_id, $google_tag_container_id, $tag_ids ) {
				$url = parse_url( $request->getUrl() );

				if ( ! in_array( $url['host'], array( 'analyticsadmin.googleapis.com', 'tagmanager.googleapis.com' ), true ) ) {
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
					case '/tagmanager/v2/accounts/containers:lookup':
						$data = new Container();
						$data->setAccountId( $google_tag_account_id );
						$data->setContainerId( $google_tag_container_id );
						$data->setTagIds( $tag_ids );
						return new Response(
							200,
							array(),
							Stream::factory(
								json_encode(
									$data->toSimpleObject()
								)
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

		$this->assertEqualSetsWithIndex(
			array(
				'accountID'            => $account_id,
				'propertyID'           => '',
				'webDataStreamID'      => '',
				'measurementID'        => '',
				'ownerID'              => 0,
				'useSnippet'           => true,
				'googleTagID'          => '',
				'googleTagAccountID'   => '',
				'googleTagContainerID' => '',
			),
			$options->get( Settings::OPTION )
		);

		do_action( 'googlesitekit_analytics_handle_provisioning_callback', $account_id );

		$this->assertEqualSetsWithIndex(
			array(
				'accountID'            => $account_id,
				'propertyID'           => $property_id,
				'webDataStreamID'      => $webdatastream_id,
				'measurementID'        => $measurement_id,
				'ownerID'              => 0,
				'useSnippet'           => true,
				'googleTagID'          => 'GT-123',
				'googleTagAccountID'   => $google_tag_account_id,
				'googleTagContainerID' => $google_tag_container_id,
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

	public function test_get_scopes__gteSupport() {
		$this->enable_feature( 'gteSupport' );

		$this->assertEqualSets(
			array(
				'https://www.googleapis.com/auth/analytics.readonly',
				'https://www.googleapis.com/auth/tagmanager.readonly',
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
				'google-tag-settings',
				'conversion-events',
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

	/**
	 * @dataProvider data_google_tag_ids
	 *
	 * @param array $tag_ids_data Tag IDs and expected result.
	 */
	public function test_google_tag_settings_datapoint( $tag_ids_data ) {
		$this->enable_feature( 'gteSupport' );

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		$http_client = new FakeHttpClient();
		$http_client->set_request_handler(
			function ( Request $request ) use ( $tag_ids_data ) {
				$url = parse_url( $request->getUrl() );

				if ( 'tagmanager.googleapis.com' !== $url['host'] ) {
					return new Response( 200 );
				}
				switch ( $url['path'] ) {
					case '/tagmanager/v2/accounts/containers:lookup':
						$data = new Container();
						$data->setAccountId( '123' );
						$data->setContainerId( '456' );
						$data->setTagIds( $tag_ids_data[0] );
						return new Response(
							200,
							array(),
							Stream::factory(
								json_encode(
									$data->toSimpleObject()
								)
							)
						);

					default:
						return new Response( 200 );
				}
			}
		);

		$this->analytics->get_client()->setHttpClient( $http_client );
		$this->analytics->register();

		$data = $this->analytics->get_data(
			'google-tag-settings',
			array(
				'measurementID' => 'A1B2C3D4E5',
			)
		);

		$this->assertNotWPError( $data );

		$this->assertEquals(
			$tag_ids_data[1],
			$data['googleTagID']
		);
	}

	public function data_google_tag_ids() {
		return array(
			'one tag ID'                                 => array(
				array(
					array( 'GT-123' ),
					'GT-123',
				),
			),
			'multiple tag IDs - returns first GT tag ID' => array(
				array(
					array( 'G-123', 'GT-123', 'A1B2C3D4E5' ),
					'GT-123',
				),
			),
			'multiple tag IDs, including the current measurement ID - returns the measurement ID' => array(
				array(
					array( 'G-123', 'A1B2C3D4E5' ),
					'A1B2C3D4E5',
				),
			),
			'multiple tag IDs - no GT or measurement ID' => array(
				array(
					array( 'AW-012', 'G-123' ),
					'G-123',
				),
			),
			'multiple tag IDs - no GT, G or measurement ID - returns first tag ID' => array(
				array(
					array( 'AW-012', 'AW-123' ),
					'AW-012',
				),
			),
		);
	}

	/**
	 * @dataProvider data_access_token
	 *
	 * When an access token is provided, the user will be authenticated for the test.
	 *
	 * @param string $access_token Access token, or empty string if none.
	 */
	public function test_get_report( $access_token ) {
		$this->setup_user_authentication( $access_token );

		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		// Grant scopes so request doesn't fail.
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		$http_client = $this->create_fake_http_client( $property_id );
		$this->analytics->get_client()->setHttpClient( $http_client );
		$this->analytics->register();

		// Fetch a report that exercises all input parameters, barring the alternative date range,
		// metric and dimension formats which are tested separately.
		$data = $this->analytics->get_data(
			'report',
			array(
				// Note, metrics is a required parameter.
				'metrics'          => array(
					// Provide metrics in both string and array formats.
					'sessions',
					array(
						'name'       => 'total',
						'expression' => 'totalUsers',
					),
				),
				// All other parameters are optional.
				'url'              => 'https://example.org/some-page-here/',
				'limit'            => 321,
				'startDate'        => '2022-11-02',
				'endDate'          => '2022-11-04',
				'compareStartDate' => '2022-11-01',
				'compareEndDate'   => '2022-11-02',
				'dimensions'       => array(
					// Provide dimensions in both string and array formats.
					'sessionDefaultChannelGrouping',
					array(
						'name' => 'pageTitle',
					),
				),
				'dimensionFilters' => array(
					// Provide dimension filters with single and multiple values.
					'sessionDefaultChannelGrouping' => 'Organic Search',
					'pageTitle'                     => array( 'Title Foo', 'Title Bar' ),
				),
				'orderby'          => array(
					array(
						'fieldName' => 'sessions',
						'sortOrder' => 'DESCENDING',
					),
					array(
						'fieldName' => 'total',
						'sortOrder' => 'ASCENDING',
					),
				),
			)
		);

		$this->assertNotWPError( $data );

		// Verify the reports are returned by checking a metric value.
		$this->assertEquals( 'some-value', $data['modelData'][0]['rows'][0]['metricValues'][0]['value'] );

		// Verify the request URL and params were correctly generated.
		$this->assertCount( 1, $this->request_handler_calls );

		$request_url = $this->request_handler_calls[0]['url'];

		$this->assertEquals( 'analyticsdata.googleapis.com', $request_url['host'] );
		$this->assertEquals( '/v1beta/properties/123456789:runReport', $request_url['path'] );

		$request_params = $this->request_handler_calls[0]['params'];

		// Verify the request params that are set by default.
		$this->assertEquals(
			'properties/123456789',
			$request_params['property']
		);

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
					'name' => 'sessions',
				),
				array(
					'name'       => 'total',
					'expression' => 'totalUsers',
				),
			),
			$request_params['metrics']
		);

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
			321,
			$request_params['limit']
		);

		$this->assertEquals(
			array(
				array(
					'name' => 'sessionDefaultChannelGrouping',
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
								'fieldName'    => 'pagePath',
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

		$this->assertEquals(
			array(
				array(
					'metric' => array(
						'metricName' => 'sessions',
					),
					'desc'   => '1',
				),
				array(
					'metric' => array(
						'metricName' => 'total',
					),
					'desc'   => '',
				),
			),
			$request_params['orderBys']
		);
	}

	/**
	 * @dataProvider data_access_token
	 *
	 * When an access token is provided, the user will be authenticated for the test.
	 *
	 * @param string $access_token Access token, or empty string if none.
	 */
	public function test_get_report__default_date_range( $access_token ) {
		$this->setup_user_authentication( $access_token );

		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		// Grant scopes so request doesn't fail.
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		$http_client = $this->create_fake_http_client( $property_id );
		$this->analytics->get_client()->setHttpClient( $http_client );
		$this->analytics->register();

		$this->analytics->get_data(
			'report',
			array(
				// Note, metrics is a required parameter.
				'metrics' => array(
					array( 'name' => 'sessions' ),
				),
			)
		);

		$request_params = $this->request_handler_calls[0]['params'];

		// Verify the default date range is correct.
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

	/**
	 * @dataProvider data_access_token
	 *
	 * When an access token is provided, the user will be authenticated for the test.
	 *
	 * @param string $access_token Access token, or empty string if none.
	 */
	public function test_get_report__metrics_as_string( $access_token ) {
		$this->setup_user_authentication( $access_token );

		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		// Grant scopes so request doesn't fail.
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		$http_client = $this->create_fake_http_client( $property_id );
		$this->analytics->get_client()->setHttpClient( $http_client );
		$this->analytics->register();

		$this->analytics->get_data(
			'report',
			array(
				// Note, metrics is a required parameter.
				'metrics' => 'sessions,totalUsers',
			)
		);

		$request_params = $this->request_handler_calls[0]['params'];

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
	}

	/**
	 * @dataProvider data_access_token
	 *
	 * When an access token is provided, the user will be authenticated for the test.
	 *
	 * @param string $access_token Access token, or empty string if none.
	 */
	public function test_get_report__metrics_as_single_object( $access_token ) {
		$this->setup_user_authentication( $access_token );

		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		// Grant scopes so request doesn't fail.
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		$http_client = $this->create_fake_http_client( $property_id );
		$this->analytics->get_client()->setHttpClient( $http_client );
		$this->analytics->register();

		$this->analytics->get_data(
			'report',
			array(
				// Note, metrics is a required parameter.
				'metrics' => array(
					'name'       => 'total',
					'expression' => 'totalUsers',
				),
			)
		);

		$request_params = $this->request_handler_calls[0]['params'];

		$this->assertEquals(
			array(
				array(
					'name'       => 'total',
					'expression' => 'totalUsers',
				),
			),
			$request_params['metrics']
		);
	}

	/**
	 * @dataProvider data_access_token
	 *
	 * When an access token is provided, the user will be authenticated for the test.
	 *
	 * @param string $access_token Access token, or empty string if none.
	 */
	public function test_get_report__dimensions_as_string( $access_token ) {
		$this->setup_user_authentication( $access_token );

		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		// Grant scopes so request doesn't fail.
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		$http_client = $this->create_fake_http_client( $property_id );
		$this->analytics->get_client()->setHttpClient( $http_client );
		$this->analytics->register();

		$this->analytics->get_data(
			'report',
			array(
				// Note, metrics is a required parameter.
				'metrics'    => 'sessions',
				'dimensions' => 'sessionDefaultChannelGrouping,pageTitle',
			)
		);

		$request_params = $this->request_handler_calls[0]['params'];

		$this->assertEquals(
			array(
				array(
					'name' => 'sessionDefaultChannelGrouping',
				),
				array(
					'name' => 'pageTitle',
				),
			),
			$request_params['dimensions']
		);
	}

	/**
	 * @dataProvider data_access_token
	 *
	 * When an access token is provided, the user will be authenticated for the test.
	 *
	 * @param string $access_token Access token, or empty string if none.
	 */
	public function test_get_report__dimensions_as_single_object( $access_token ) {
		$this->setup_user_authentication( $access_token );

		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		// Grant scopes so request doesn't fail.
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		$http_client = $this->create_fake_http_client( $property_id );
		$this->analytics->get_client()->setHttpClient( $http_client );
		$this->analytics->register();

		$this->analytics->get_data(
			'report',
			array(
				// Note, metrics is a required parameter.
				'metrics'    => 'sessions',
				'dimensions' => array(
					'name' => 'pageTitle',
				),
			)
		);

		$request_params = $this->request_handler_calls[0]['params'];

		$this->assertEquals(
			array(
				array(
					'name' => 'pageTitle',
				),
			),
			$request_params['dimensions']
		);
	}

	/**
	 * @dataProvider data_access_token
	 *
	 * When an access token is provided, the user will be authenticated for the test.
	 *
	 * @param string $access_token Access token, or empty string if none.
	 */
	public function test_report__insufficient_permissions( $access_token ) {
		$this->setup_user_authentication( $access_token );

		$data = $this->analytics->get_data( 'report', array() );

		$this->assertWPErrorWithMessage( 'Site Kit can’t access the relevant data from Analytics 4 because you haven’t granted all permissions requested during setup.', $data );
		$this->assertEquals( 'missing_required_scopes', $data->get_error_code() );
	}

	/**
	 * @dataProvider data_access_token
	 *
	 * When an access token is provided, the user will be authenticated for the test.
	 *
	 * @param string $access_token Access token, or empty string if none.
	 */
	public function test_report__no_metrics( $access_token ) {
		$this->setup_user_authentication( $access_token );

		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		$data = $this->analytics->get_data( 'report', array() );

		$this->assertWPErrorWithMessage( 'Request parameter is empty: metrics.', $data );
		$this->assertEquals( 'missing_required_param', $data->get_error_code() );
		$this->assertEquals( array( 'status' => 400 ), $data->get_error_data( 'missing_required_param' ) );
	}

	public function test_report__metric_validation() {
		$this->enable_feature( 'dashboardSharing' );

		$this->context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options              = new Options( $this->context );
		$this->user           = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$this->user_options   = new User_Options( $this->context, $this->user->ID );
		$this->authentication = new Authentication( $this->context, $options, $this->user_options );
		$this->analytics      = new Analytics_4( $this->context, $options, $this->user_options, $this->authentication );

		// Re-register Permissions after enabling the dashboardSharing feature to include dashboard sharing capabilities.
		// TODO: Remove this when `dashboardSharing` feature flag is removed.
		$modules     = new Modules( $this->context, null, $this->user_options, $this->authentication );
		$permissions = new Permissions( $this->context, $this->authentication, $modules, $this->user_options, new Dismissed_Items( $this->user_options ) );
		$permissions->register();

		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		$this->set_shareable_metrics( 'sessions', 'totalUsers' );

		$this->enable_shared_credentials();

		$data = $this->analytics->get_data(
			'report',
			array(
				// Note, metrics is a required parameter.
				'metrics' => array(
					array( 'name' => 'sessions' ),
					array( 'name' => 'totalUsers' ),
					array( 'name' => 'invalidMetric' ),
					array( 'name' => 'anotherInvalidMetric' ),
				),
			)
		);

		$this->assertWPErrorWithMessage( 'Unsupported metrics requested: invalidMetric, anotherInvalidMetric', $data );
		$this->assertEquals( 'invalid_analytics_4_report_metrics', $data->get_error_code() );
	}

	public function test_report__dimension_validation() {
		$this->enable_feature( 'dashboardSharing' );

		$this->context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options              = new Options( $this->context );
		$this->user           = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$this->user_options   = new User_Options( $this->context, $this->user->ID );
		$this->authentication = new Authentication( $this->context, $options, $this->user_options );
		$this->analytics      = new Analytics_4( $this->context, $options, $this->user_options, $this->authentication );

		// Re-register Permissions after enabling the dashboardSharing feature to include dashboard sharing capabilities.
		// TODO: Remove this when `dashboardSharing` feature flag is removed.
		$modules     = new Modules( $this->context, null, $this->user_options, $this->authentication );
		$permissions = new Permissions( $this->context, $this->authentication, $modules, $this->user_options, new Dismissed_Items( $this->user_options ) );
		$permissions->register();

		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		$this->set_shareable_metrics( 'sessions' );
		$this->set_shareable_dimensions( 'date', 'pageTitle' );

		$this->enable_shared_credentials();

		$data = $this->analytics->get_data(
			'report',
			array(
				// Note, metrics is a required parameter.
				'metrics'    => array(
					array( 'name' => 'sessions' ),
				),
				'dimensions' => array( 'date', 'pageTitle', 'invalidDimension', 'anotherInvalidDimension' ),
			)
		);

		$this->assertWPErrorWithMessage( 'Unsupported dimensions requested: invalidDimension, anotherInvalidDimension', $data );
		$this->assertEquals( 'invalid_analytics_4_report_dimensions', $data->get_error_code() );
	}

	/**
	 * @dataProvider data_access_token
	 *
	 * When an access token is provided, the user will be authenticated for the test.
	 *
	 * @param string $access_token Access token, or empty string if none.
	 */
	public function test_report__no_property_id( $access_token ) {
		$this->setup_user_authentication( $access_token );

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		$data = $this->analytics->get_data(
			'report',
			array(
				// Note, metrics is a required parameter.
				'metrics' => array(
					array( 'name' => 'sessions' ),
				),
			)
		);

		$this->assertWPErrorWithMessage( 'No connected Google Analytics 4 property ID.', $data );
		$this->assertEquals( 'missing_required_setting', $data->get_error_code() );
		$this->assertEquals( array( 'status' => 500 ), $data->get_error_data( 'missing_required_setting' ) );
	}

	/**
	 * @dataProvider data_access_token
	 *
	 * When an access token is provided, the user will be authenticated for the test.
	 *
	 * @param string $access_token Access token, or empty string if none.
	 */
	public function test_get_conversion_events( $access_token ) {
		$this->setup_user_authentication( $access_token );

		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		// Grant scopes so request doesn't fail.
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		$http_client = $this->create_fake_http_client( $property_id );
		$this->analytics->get_client()->setHttpClient( $http_client );
		$this->analytics->register();

		// Fetch conversion events.
		$data = $this->analytics->get_data(
			'conversion-events',
			array(
				'propertyID' => $property_id,
			)
		);

		$this->assertNotWPError( $data );

		// Verify the conversion events are returned by checking an event name.
		$this->assertEquals( 'some-event', $data[0]['eventName'] );

		// Verify the request URL and params were correctly generated.
		$this->assertCount( 1, $this->request_handler_calls );

		$request_url = $this->request_handler_calls[0]['url'];

		$this->assertEquals( 'analyticsadmin.googleapis.com', $request_url['host'] );
		$this->assertEquals( "/v1beta/properties/$property_id/conversionEvents", $request_url['path'] );
	}

	/**
	 * Returns a date string for the given number of days ago.
	 *
	 * @param int $days_ago The number of days ago.
	 * @return string The date string, formatted as YYYY-MM-DD.
	 */
	protected function days_ago_date_string( $days_ago ) {
		return gmdate( 'Y-m-d', strtotime( $days_ago . ' days ago' ) );
	}

	/**
	 * Sets the shareable metrics for the Analytics_4 module.
	 *
	 * @param string[] $metrics The metrics to set.
	 */
	protected function set_shareable_metrics( ...$metrics ) {
		add_filter(
			'googlesitekit_shareable_analytics_4_metrics',
			function() use ( $metrics ) {
				return $metrics;
			}
		);
	}

	/**
	 * Sets the shareable dimensions for the Analytics_4 module.
	 *
	 * @param string[] $dimensions The dimensions to set.
	 */
	protected function set_shareable_dimensions( ...$dimensions ) {
		add_filter(
			'googlesitekit_shareable_analytics_4_dimensions',
			function() use ( $dimensions ) {
				return $dimensions;
			}
		);
	}

	/**
	 * Creates a fake HTTP client with call tracking.
	 *
	 * @param string $property_id The GA4 property ID to use.
	 * @return FakeHttpClient The fake HTTP client.
	 */
	protected function create_fake_http_client( $property_id ) {
		$this->request_handler_calls = array();

		$http_client = new FakeHttpClient();
		$http_client->set_request_handler(
			function ( Request $request ) use ( $property_id ) {
				$url    = parse_url( $request->getUrl() );
				$params = json_decode( (string) $request->getBody(), true );

				$this->request_handler_calls[] = array(
					'url'    => $url,
					'params' => $params,
				);

				if (
					! in_array(
						$url['host'],
						array( 'analyticsdata.googleapis.com', 'analyticsadmin.googleapis.com' ),
						true
					)
				) {
					return new Response( 200 );
				}

				switch ( $url['path'] ) {
					case "/v1beta/properties/$property_id:runReport":
						// Return a mock report.
						return new Response(
							200,
							array(),
							Stream::factory(
								json_encode(
									array(
										'kind' => 'analyticsData#runReport',
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
									)
								)
							)
						);

					case "/v1beta/properties/$property_id/conversionEvents":
						$conversion_event = new GoogleAnalyticsAdminV1betaConversionEvent();
						$conversion_event->setName( "properties/$property_id/conversionEvents/some-name" );
						$conversion_event->setEventName( 'some-event' );

						$conversion_events = new GoogleAnalyticsAdminV1betaListConversionEventsResponse();
						$conversion_events->setConversionEvents( array( $conversion_event ) );

						return new Response(
							200,
							array(),
							Stream::factory(
								json_encode( $conversion_events )
							)
						);

					default:
						return new Response( 200 );
				}
			}
		);

		return $http_client;
	}

	/**
	 * Metrics and dimensions are only validated when using shared credentials. This helper method sets up the shared credentials scenario.
	 */
	protected function enable_shared_credentials() {
		// Create a user to set as the Analytics 4 module owner.
		$admin = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );

		$this->setup_user_authentication( 'valid-auth-token', $admin->ID );

		// Ensure the new user has the necessary scopes to make the request.
		$restore_user = $this->user_options->switch_user( $admin->ID );
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);
		$restore_user();

		// Ensure the Analytics 4 module is connected and the owner ID is set.
		update_option(
			'googlesitekit_analytics-4_settings',
			array(
				'propertyID'      => '123',
				'webDataStreamID' => '456',
				'measurementID'   => 'G-789',
				'ownerID'         => $admin->ID,
			)
		);

		// Ensure sharing is enabled for the Analytics 4 module.
		add_option(
			Module_Sharing_Settings::OPTION,
			array(
				'analytics-4' => array(
					'sharedRoles' => $this->user->roles,
					'management'  => 'owner',
				),
			)
		);
	}

	/**
	 * Provides data for testing access states.
	 *
	 * @return array
	 */
	public function data_access_token() {
		return array(
			'unauthenticated user' => array( '' ),
			'authenticated user'   => array( 'valid-auth-token' ),
		);
	}

	/**
	 * Sets up user authentication if an access token is provided.
	 *
	 * @param string $access_token The access token to use.
	 * @param int    [$user_id] The user ID to set up authentication for. Will default to the current user.
	 */
	protected function setup_user_authentication( $access_token, $user_id = null ) {
		if ( empty( $access_token ) ) {
			return;
		}

		if ( empty( $user_id ) ) {
			$user_id = $this->user->ID;
		}

		$this->set_user_access_token( $user_id, $access_token );
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
