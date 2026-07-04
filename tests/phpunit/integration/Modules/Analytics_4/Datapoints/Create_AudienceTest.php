<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Create_AudienceTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Create_Audience;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdminV1alpha;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdminV1alpha\GoogleAnalyticsAdminV1alphaAudience;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use WP_Error;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Create_AudienceTest extends TestCase {

	/**
	 * Create_Audience datapoint instance.
	 *
	 * @var Create_Audience
	 */
	private $datapoint;

	/**
	 * Create audience request instance.
	 *
	 * @var Request
	 */
	private $create_audience_request;

	/**
	 * Analytics_4 instance.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

	public function set_up() {
		parent::set_up();

		$context         = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options         = new Options( $context );
		$user            = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$user_options    = new User_Options( $context, $user->ID );
		$authentication  = new Authentication( $context, $options, $user_options );
		$this->analytics = new Analytics_4( $context, $options, $user_options, $authentication );

		$this->analytics->get_client()->withDefer( true );
		$service = new GoogleAnalyticsAdminV1alpha( $this->analytics->get_client() );

		$this->datapoint = new Create_Audience(
			array(
				'settings'               => $this->analytics->get_settings(),
				'service'                => function () use ( $service ) {
					return $service;
				},
				'scopes'                 => array( Analytics_4::EDIT_SCOPE ),
				'request_scopes_message' => 'You need to grant permission.',
			)
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$this->create_audience_request = $request;

				$response = new GoogleAnalyticsAdminV1alphaAudience();
				$response->setName( 'properties/123456/audiences/789' );
				$response->setDisplayName( 'Recently active users' );

				return new FulfilledPromise( new Response( 200, array(), json_encode( $response ) ) );
			}
		);
	}

	public function test_create_request() {
		$this->create_audience_request = null;

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '123456',
			)
		);

		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'create-audience',
			array(
				'audience' => $this->get_audience(),
			)
		);

		$request = $this->datapoint->create_request( $data_request );
		$this->analytics->get_client()->execute( $request );

		$this->assertEquals(
			'https://analyticsadmin.googleapis.com/v1alpha/properties/123456/audiences',
			$this->create_audience_request->getUri(),
			'The request should be made to the correct endpoint.'
		);
		$this->assertJsonStringEqualsJsonString( json_encode( $this->get_audience() ), $this->create_audience_request->getBody()->getContents(), 'The request body should match the provided value.' );
	}

	public function test_create_request__requires_property_id() {
		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '',
			)
		);

		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'create-audience',
			array(
				'audience' => $this->get_audience(),
			)
		);

		$response = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $response, 'The datapoint should return an error when the `propertyID` setting is missing.' );
		$this->assertEquals( 'missing_required_setting', $response->get_error_code(), 'The datapoint should return a `missing_required_setting` error when the `propertyID` setting is missing.' );
	}

	public function test_create_request__requires_audience() {
		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '123456',
			)
		);

		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'create-audience',
			array()
		);

		try {
			$this->datapoint->create_request( $data_request );
			$this->fail( 'Expected `Missing_Required_Param_Exception` to be thrown.' );
		} catch ( Missing_Required_Param_Exception $exception ) {
			$this->assertEquals( 'Request parameter is empty: audience.', $exception->getMessage(), 'The datapoint should return an error when the `audience` parameter is missing.' );
		}
	}

	public function test_create_request__validates_audience_properties() {
		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '123456',
			)
		);

		$audience                 = $this->get_audience();
		$audience['invalidField'] = 'invalidValue';

		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'create-audience',
			array(
				'audience' => $audience,
			)
		);

		$response = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $response, 'The datapoint should return an error when the audience contains an invalid property.' );
		$this->assertEquals( 'invalid_property_name', $response->get_error_code(), 'The datapoint should return an `invalid_property_name` error when the audience contains an invalid property.' );
	}

	public function test_parse_response() {
		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'create-audience', array( 'audience' => $this->get_audience() ) );
		$test_data    = new GoogleAnalyticsAdminV1alphaAudience();
		$test_data->setName( 'properties/123456/audiences/789' );
		$test_data->setDisplayName( 'Recently active users' );

		$this->assertSame( $test_data, $this->datapoint->parse_response( $test_data, $data_request ), 'The `parse_response` method should return the response unchanged.' );
	}

	private function get_audience() {
		return array(
			'displayName'            => 'Recently active users',
			'description'            => 'Users that have been active in a recent period',
			'membershipDurationDays' => 30,
			'filterClauses'          => array(
				array(
					'clauseType'   => 'INCLUDE',
					'simpleFilter' => array(
						'scope'            => 'AUDIENCE_FILTER_SCOPE_ACROSS_ALL_SESSIONS',
						'filterExpression' => array(
							'andGroup' => array(
								'filterExpressions' => array(
									array(
										'orGroup' => array(
											'filterExpressions' => array(
												array(
													'dimensionOrMetricFilter' => array(
														'fieldName'    => 'newVsReturning',
														'stringFilter' => array(
															'matchType' => 'EXACT',
															'value'     => 'new',
														),
													),
												),
											),
										),
									),
								),
							),
						),
					),
				),
			),
		);
	}
}
