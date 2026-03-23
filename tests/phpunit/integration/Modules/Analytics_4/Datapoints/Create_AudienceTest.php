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

	public function test_create_request_returns_error_when_property_setting_is_missing() {
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

		$this->assertInstanceOf( WP_Error::class, $response, 'Create audience should return a WP_Error when propertyID is missing from settings.' );
		$this->assertEquals( 'missing_required_setting', $response->get_error_code(), 'Create audience should return missing_required_setting when propertyID is missing from settings.' );
	}

	public function test_create_request_validates_required_audience_param() {
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

		$this->expectException( Missing_Required_Param_Exception::class );
		$this->datapoint->create_request( $data_request );
	}

	public function test_create_request_validates_audience_keys() {
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

		$this->assertInstanceOf( WP_Error::class, $response, 'Create audience should return a WP_Error when audience contains invalid keys.' );
		$this->assertEquals( 'invalid_property_name', $response->get_error_code(), 'Create audience should return invalid_property_name when audience contains invalid keys.' );
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
			$this->create_audience_request->getUri()->__toString(),
			'Create audience request should target the expected API endpoint.'
		);
	}

	public function test_parse_response() {
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

		$request  = $this->datapoint->create_request( $data_request );
		$response = $this->datapoint->parse_response(
			$this->analytics->get_client()->execute( $request ),
			$data_request
		);

		$this->assertNotWPError( $response, 'Audience creation should succeed when all required parameters are provided.' );
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
