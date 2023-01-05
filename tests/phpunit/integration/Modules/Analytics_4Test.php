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
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Service_Entity;
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
		$user_id        = $this->factory()->user->create();
		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$user_options   = new User_Options( $context, $user_id );
		$authentication = new Authentication( $context, $options, $user_options );
		$analytics      = new Analytics_4( $context, $options, $user_options, $authentication );
		$authentication->get_oauth_client()->get_client()->setHttpClient(
			new FakeHttpClient() // Returns 200 by default.
		);

		$invocations = array();

		$http_client = new FakeHttpClient();
		$http_client->set_request_handler(
			function ( Request $request ) use ( &$invocations ) {
				$url    = parse_url( $request->getUrl() );
				$body   = Query::parse( $request->getBody() );
				$params = json_decode( array_keys( $body )[0], true );

				$invocations[] = array(
					'url'    => $url,
					'params' => $params,
				);

				if ( 'analyticsdata.googleapis.com' !== $url['host'] ) {
					return new Response( 200 );
				}

				switch ( $url['path'] ) {
					case '/v1beta/properties/123456789:batchRunReports':
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

		// Grant scopes so request doesn't fail.
		$authentication->get_oauth_client()->set_granted_scopes(
			$analytics->get_scopes()
		);

		$data = $analytics->get_data(
			'report',
			array(
				'startDate'        => '2022-11-02',
				'endDate'          => '2022-11-04',
				'compareStartDate' => '2022-11-01',
				'compareEndDate'   => '2022-11-02',
				'propertyID'       => '123456789',
				'metrics'          => array(
					array( 'name' => 'totalUsers' ),
				),
				'dimensions'       => array( 'date' ),
				'dimensionFilters' => array(
					'sessionDefaultChannelGrouping' => 'Organic Search',
				),
			)
		);

		$this->assertNotWPError( $data );

		// TODO: Refactor the below tests to use a @dataProvider.

		// Verify the reports are returned by checking a metric value.
		$this->assertEquals( 'some-value', $data[0]['rows'][0][0]['value'] );

		// Verify the request URL and body.
		$this->assertCount( 1, $invocations );

		$request_url = $invocations[0]['url'];

		$this->assertEquals( 'analyticsdata.googleapis.com', $request_url['host'] );
		$this->assertEquals( '/v1beta/properties/123456789:batchRunReports', $request_url['path'] );

		$request_params = $invocations[0]['params']['requests'][0];

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
			array(
				'andGroup' => array(
					'expressions' => array(
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
						array(
							'filter' => array(
								'fieldName'    => 'sessionDefaultChannelGrouping',
								'stringFilter' => array(
									'matchType' => 'EXACT',
									'value'     => 'Organic Search',
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
					'name' => 'date',
				),
			),
			$request_params['dimensions']
		);

		$this->assertEquals(
			array(
				'TOTAL',
				'MINIMUM',
				'MAXIMUM',
			),
			$request_params['metricAggregations']
		);

		$this->assertEquals(
			array(
				array(
					'name' => 'totalUsers',
				),
			),
			$request_params['metrics']
		);

		$this->assertEquals(
			'properties/123456789',
			$request_params['property']
		);
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
