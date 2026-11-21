<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Create_Conversion_InsightTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\Authentication\Exception\Google_OAuth_Exception;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Tests\AI_Insight_Datapoints_Trait;
use Google\Site_Kit\Tests\Fake_Site_Goals_Reports_Trait;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use WP_Error;
use WP_REST_Request;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Create_Conversion_InsightTest extends TestCase {

	use AI_Insight_Datapoints_Trait;
	use Fake_Site_Goals_Reports_Trait;

	/**
	 * Number of `batchRunReports` requests the fake Analytics API received.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $batch_request_count = 0;

	public function set_up() {
		parent::set_up();

		$this->set_up_ai_insight_datapoints();

		update_user_meta( $this->admin_id, 'locale', 'de_DE' );
		$this->analytics->get_settings()->merge( array( 'detectedEvents' => array( 'contact' ) ) );

		$this->report_rows = array(
			'engagement'  => array(
				array( 'date_range_0', '0.5', '1000' ),
				array( 'date_range_1', '0.4', '800' ),
			),
			'key_actions' => array(
				array( 'contact', 'date_range_0', '20' ),
				array( 'contact', 'date_range_1', '10' ),
			),
		);
	}

	public function tear_down() {
		parent::tear_down();
		// Leave no server behind for the next test class.
		unset( $GLOBALS['wp_rest_server'] );
	}

	/**
	 * Turns on the `siteGoalsInsights` feature flag, and answers the reports
	 * of the module the REST routes answer from with the fake Analytics API,
	 * for its own account and for its owner's. The fake API refuses a report
	 * without a token, as Analytics does.
	 *
	 * @since n.e.x.t
	 */
	private function enable_conversion_insights() {
		$this->enable_insight_datapoints( array( 'siteGoalsInsights' ) );

		$this->fake_google_api(
			array( $this->analytics->get_client(), $this->analytics->get_owner_oauth_client()->get_client() ),
			function ( Request $request ) {
				++$this->batch_request_count;

				return $this->create_analytics_batch_response( json_decode( (string) $request->getBody(), true ) );
			}
		);
	}

	/**
	 * Requests the datapoint.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $data The `data` of the request.
	 * @return \WP_REST_Response The response.
	 */
	private function request( array $data ) {
		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/analytics-4/data/conversion-insights' );
		$request->set_body_params( array( 'data' => $data ) );

		return rest_get_server()->dispatch( $request );
	}

	public function test_rest_endpoint__sends_the_entry_of_the_widget_to_the_service() {
		$this->enable_conversion_insights();
		$this->answer_service_with(
			200,
			array(
				'operation_id'   => 'YhMZgdgne7B3vkpA7VTLJa',
				'interaction_id' => '01M4B0KB2E2VWF72GMV1X4BE08',
				'model_version'  => 'model-1',
			)
		);

		$response = $this->request(
			array(
				'goalType' => 'lead',
				'endDate'  => '2026-09-15',
			)
		);

		$this->assertSame( 200, $response->get_status(), 'A request for the insight of a widget with conversions should answer 200.' );
		$this->assertSame( array( 'operationID' => 'YhMZgdgne7B3vkpA7VTLJa' ), $response->get_data(), 'The response should have only the ID of the operation the service started.' );
		$this->assertCount( 1, $this->service_requests, 'The datapoint should send one request to the service.' );

		list( $site_id, $site_secret ) = $this->get_fake_proxy_credentials();

		$service_request = $this->service_requests[0];

		$this->assertSame( $this->get_service_url( '/v1/ai/conversion-insights?hl=de_DE' ), $service_request['url'], 'The request should reach the conversion insights endpoint of the service, with the locale of the user as `hl`.' );
		$this->assertSame( 'Bearer valid-token', $service_request['args']['headers']['Authorization'], 'The request should be authorized with the access token of the user.' );
		$this->assertSame( Google_Proxy::get_application_name(), $service_request['args']['headers']['User-Agent'], 'The request should name the plugin release in its `User-Agent` header.' );
		$this->assertSame(
			array(
				'events'      => array(
					array(
						'event_name'       => 'generate_lead',
						'month_start_date' => '2026-08-19',
						'current'          => array(
							'conversions'     => 20,
							'conversion_rate' => 0.02,
							'sessions'        => 1000,
							'engagement_rate' => 0.5,
						),
						'previous'         => array(
							'conversions'     => 10,
							'conversion_rate' => 0.0125,
							'sessions'        => 800,
							'engagement_rate' => 0.4,
						),
					),
				),
				'async'       => true,
				'site_id'     => $site_id,
				'site_secret' => $site_secret,
			),
			json_decode( $service_request['args']['body'], true ),
			'The body should be the entry the payload builder built from the reports of `2026-09-15`, with `async` set to true and the site credentials.'
		);
	}

	public function test_rest_endpoint__answers_with_the_wait_the_service_asks_for_before_the_first_read() {
		$this->enable_conversion_insights();
		$this->answer_service_with(
			200,
			array(
				'operation_id'   => 'YhMZgdgne7B3vkpA7VTLJa',
				'interaction_id' => '01M4B0KB2E2VWF72GMV1X4BE08',
				'model_version'  => 'model-1',
			),
			array( 'retry-after' => '2' )
		);

		$response = $this->request(
			array(
				'goalType' => 'lead',
				'endDate'  => '2026-09-15',
			)
		);

		$this->assertSame(
			array(
				'operationID' => 'YhMZgdgne7B3vkpA7VTLJa',
				'retryAfter'  => 2,
			),
			$response->get_data(),
			'The response should carry the `Retry-After` of the service, in seconds, as `retryAfter`.'
		);
	}

	public function test_rest_endpoint__answers_with_the_insight_the_service_had_in_its_cache() {
		$this->enable_conversion_insights();
		$this->answer_service_with(
			200,
			array(
				'interaction_id' => '01M4B0KB2E2VWF72GMV1X4BE08',
				'scenario'       => 'GROWTH_VOL_UP_CR_UP_NOT_SEASONAL',
				'model_version'  => 'model-1',
				'insights'       => array(
					array(
						'event_name'                => 'generate_lead',
						'code'                      => 'GROWTH_VOL_UP_CR_UP',
						'text'                      => 'Leads are up 100% over the past 28 days.',
						'actionable_recommendation' => 'Both more site traffic and a higher conversion rate contributed to this lead growth.',
					),
				),
			)
		);

		$response = $this->request(
			array(
				'goalType' => 'lead',
				'endDate'  => '2026-09-15',
			)
		);

		$this->assertSame( 200, $response->get_status(), 'An insight from the cache of the service should answer 200.' );
		$this->assertSame(
			array(
				'insight' => array(
					'interactionID'            => '01M4B0KB2E2VWF72GMV1X4BE08',
					'scenario'                 => 'GROWTH_VOL_UP_CR_UP_NOT_SEASONAL',
					'code'                     => 'GROWTH_VOL_UP_CR_UP',
					'text'                     => 'Leads are up 100% over the past 28 days.',
					'actionableRecommendation' => 'Both more site traffic and a higher conversion rate contributed to this lead growth.',
				),
			),
			$response->get_data(),
			'The insight should have the top-level `interaction_id` and `scenario` of the answer, unchanged, and the texts of its first entry, without `model_version`.'
		);
	}

	public function test_rest_endpoint__answers_null_for_a_cached_answer_without_an_insight() {
		$this->enable_conversion_insights();
		$this->answer_service_with(
			200,
			array(
				'interaction_id' => '01M4B0KB2E2VWF72GMV1X4BE08',
				'scenario'       => 'NO_INSIGHT',
				'insights'       => array(
					array(
						'event_name' => 'generate_lead',
						'code'       => 'NO_INSIGHT',
					),
				),
			)
		);

		$response = $this->request(
			array(
				'goalType' => 'lead',
				'endDate'  => '2026-09-15',
			)
		);

		$this->assertSame( array( 'insight' => null ), $response->get_data(), 'A cached answer whose entry has the code `NO_INSIGHT` should give a null insight.' );
	}

	/**
	 * @dataProvider data_unreadable_service_answers
	 *
	 * @param array $body The body the service answers with.
	 */
	public function test_rest_endpoint__answers_500_for_an_answer_it_cannot_read( array $body ) {
		$this->enable_conversion_insights();
		$this->answer_service_with( 200, $body );

		$response = $this->request(
			array(
				'goalType' => 'lead',
				'endDate'  => '2026-09-15',
			)
		);

		$this->assertSame( 500, $response->get_status(), 'An answer the datapoint cannot read should answer 500.' );
		$this->assertSame( 'invalid_conversion_insight_response', $response->get_data()['code'], 'The error should say the answer of the service could not be read.' );
	}

	public function data_unreadable_service_answers() {
		return array(
			'an empty operation ID'       => array( array( 'operation_id' => '' ) ),
			'an operation ID as a number' => array( array( 'operation_id' => 123 ) ),
			'an insight without a text'   => array(
				array(
					'interaction_id' => '01M4B0KB2E2VWF72GMV1X4BE08',
					'scenario'       => 'GROWTH_VOL_UP_CR_UP_NOT_SEASONAL',
					'insights'       => array(
						array( 'code' => 'GROWTH_VOL_UP_CR_UP_NOT_SEASONAL' ),
					),
				),
			),
		);
	}

	public function test_rest_endpoint__answers_null_without_a_request_to_the_service_when_neither_period_has_a_conversion() {
		$this->enable_conversion_insights();
		unset( $this->report_rows['key_actions'] );

		$response = $this->request(
			array(
				'goalType' => 'lead',
				'endDate'  => '2026-09-15',
			)
		);

		$this->assertSame( 1, $this->batch_request_count, 'The datapoint should run the reports of the payload.' );
		$this->assertSame( array( 'insight' => null ), $response->get_data(), 'A widget without a conversion in either period should give a null insight.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service when the payload builder builds no entry.' );
	}

	/**
	 * @dataProvider data_report_errors
	 *
	 * @param int    $status          The status Analytics answers the reports with.
	 * @param string $message         The message of the Analytics error.
	 * @param int    $expected_status The status the datapoint should answer with.
	 */
	public function test_rest_endpoint__answers_the_error_of_the_reports_without_a_request_to_the_service( $status, $message, $expected_status ) {
		$this->enable_conversion_insights();

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			fn() => new FulfilledPromise(
				new Response(
					$status,
					array(),
					wp_json_encode(
						array(
							'error' => array(
								'code'    => $status,
								'message' => $message,
								'errors'  => array(
									array(
										'message' => $message,
										'domain'  => 'global',
									),
								),
							),
						)
					)
				)
			)
		);

		$response = $this->request(
			array(
				'goalType' => 'lead',
				'endDate'  => '2026-09-15',
			)
		);

		$this->assertSame( $expected_status, $response->get_status(), "Reports that Analytics answers with a $status should answer $expected_status." );
		$this->assertSame( $message, $response->get_data()['message'], 'The error should keep the message Analytics returned.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service when the reports of the payload fail.' );
	}

	public function data_report_errors() {
		return array(
			'a refusal for permissions' => array( 403, 'User does not have sufficient permissions for this property.', 403 ),
			'a conflict'                => array( 409, 'The request conflicts with another one.', 500 ),
			// A 502, which the Google client doesn't retry, keeps the test
			// free of the waits between retries.
			'a server error'            => array( 502, 'The service is currently unavailable.', 500 ),
		);
	}

	/**
	 * @dataProvider data_invalid_params
	 *
	 * @param array $data The `data` of the request.
	 */
	public function test_rest_endpoint__answers_400_without_a_request_for_an_invalid_param( array $data ) {
		$this->enable_conversion_insights();

		$response = $this->request( $data );

		$this->assertSame( 400, $response->get_status(), 'A request with an invalid parameter should answer 400.' );
		$this->assertSame( 'rest_invalid_param', $response->get_data()['code'], 'The error should say a parameter is invalid.' );
		$this->assertSame( 0, $this->batch_request_count, 'No report should run for a request with an invalid parameter.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service for a request with an invalid parameter.' );
	}

	public function data_invalid_params() {
		return array(
			'a goal type other than lead or ecommerce' => array(
				array(
					'goalType' => 'other',
					'endDate'  => '2026-09-15',
				),
			),
			'a tab of 501 characters'                  => array(
				array(
					'goalType' => 'lead',
					'tab'      => str_repeat( 'a', 501 ),
					'endDate'  => '2026-09-15',
				),
			),
			'an end date that is not a real day'       => array(
				array(
					'goalType' => 'lead',
					'endDate'  => '2026-13-45',
				),
			),
		);
	}

	public function test_rest_endpoint__accepts_a_tab_of_500_characters() {
		$this->enable_conversion_insights();

		$response = $this->request(
			array(
				'goalType' => 'ecommerce',
				'tab'      => str_repeat( 'ž', 500 ),
				'endDate'  => '2026-09-15',
			)
		);

		$this->assertSame( 200, $response->get_status(), 'A tab of 500 characters, the most Analytics keeps of an event parameter value, should be accepted, even when its characters take more than one byte.' );
	}

	/**
	 * @dataProvider data_service_errors
	 *
	 * @param int   $status   The status the service answers with.
	 * @param array $headers  The headers the service answers with.
	 * @param array $expected The data the error should have.
	 */
	public function test_rest_endpoint__answers_a_service_error_with_its_status_or_500( $status, array $headers, array $expected ) {
		$this->enable_conversion_insights();
		$this->answer_service_with(
			$status,
			array(
				'error' => 'The service refused the request.',
				'code'  => $expected['reason'],
			),
			$headers
		);

		$response = $this->request(
			array(
				'goalType' => 'lead',
				'endDate'  => '2026-09-15',
			)
		);

		$this->assertSame( $expected['status'], $response->get_status(), "A $status from the service should answer {$expected['status']}." );
		$this->assertSame( $expected, $response->get_data()['data'], "The error of a $status should have status {$expected['status']}, the service's `code` as `reason`, and `retryAfter` only when the service sent `Retry-After`." );
	}

	public function data_service_errors() {
		return array(
			'400'                  => array(
				400,
				array(),
				array(
					'status' => 400,
					'reason' => 'INVALID_ARGUMENT',
				),
			),
			'403'                  => array(
				403,
				array(),
				array(
					'status' => 403,
					'reason' => 'PERMISSION_DENIED',
				),
			),
			'409'                  => array(
				409,
				array(),
				array(
					'status' => 409,
					'reason' => 'GENERATION_IN_PROGRESS',
				),
			),
			'429 with Retry-After' => array(
				429,
				array( 'retry-after' => '120' ),
				array(
					'status'     => 429,
					'reason'     => 'RESOURCE_EXHAUSTED',
					'retryAfter' => 120,
				),
			),
			'503'                  => array(
				503,
				array(),
				array(
					'status' => 503,
					'reason' => 'SERVICE_BUSY',
				),
			),
			'404'                  => array(
				404,
				array(),
				array(
					'status' => 500,
					'reason' => 'NOT_FOUND',
				),
			),
			'502'                  => array(
				502,
				array(),
				array(
					'status' => 500,
					'reason' => 'BAD_GATEWAY',
				),
			),
		);
	}

	public function test_rest_endpoint__answers_500_when_the_service_cannot_be_reached() {
		$this->enable_conversion_insights();
		$this->fail_service_requests_with( new WP_Error( 'http_request_failed', 'cURL error 28: Operation timed out.' ) );

		$response = $this->request(
			array(
				'goalType' => 'lead',
				'endDate'  => '2026-09-15',
			)
		);

		$this->assertSame( 500, $response->get_status(), 'A request that did not reach the service should answer 500.' );
		$this->assertSame( 'http_request_failed', $response->get_data()['code'], 'The error should keep the code of the failed request.' );
	}

	public function test_create_request__answers_403_without_a_request_when_the_token_cannot_be_refreshed() {
		$this->enable_conversion_insights();

		$request = $this->analytics->get_datapoint_definition( 'POST:conversion-insights' )->create_request(
			new Data_Request(
				'POST',
				'modules',
				'analytics-4',
				'conversion-insights',
				array(
					'goalType' => 'lead',
					'tab'      => '',
					'endDate'  => '2026-09-15',
				)
			)
		);

		// The reports of the payload run with the module's client. The
		// stand-in, which the request to the service runs with, throws in
		// `authorize()`, as the Google client does for a token refresh that
		// Google refuses.
		$client = new class() {
			public function authorize() {
				throw new Google_OAuth_Exception( 'invalid_grant' );
			}
		};

		$response = $request( $client );

		$this->assertSame( 1, $this->batch_request_count, 'The reports of the payload should run before the token is refreshed.' );
		$this->assertWPError( $response, 'A client whose token refresh fails should give an error.' );
		$this->assertSame( 'missing_access_token', $response->get_error_code(), 'The error should say the access token is missing.' );
		$this->assertSame( array( 'status' => 403 ), $response->get_error_data(), 'The error should have status 403.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service without an access token.' );
	}

	public function test_rest_endpoint__answers_a_view_only_user_with_the_owners_account() {
		$view_only_user_id = $this->create_view_only_user_of_analytics();

		$this->switch_to_user( $view_only_user_id );
		$this->enable_conversion_insights();
		$this->answer_service_with( 200, array( 'operation_id' => 'YhMZgdgne7B3vkpA7VTLJa' ) );

		$response = $this->request(
			array(
				'goalType' => 'lead',
				'endDate'  => '2026-09-15',
			)
		);

		$this->assertSame( 200, $response->get_status(), 'A view-only user should be able to ask for the insight.' );
		$this->assertSame( array( 'operationID' => 'YhMZgdgne7B3vkpA7VTLJa' ), $response->get_data(), 'The view-only user should get the operation the service started.' );
		$this->assertSame( array( 'Bearer valid-token' ), $this->google_api_authorizations['analyticsdata.googleapis.com'], 'The reports should run with the access token of the administrator who owns Analytics.' );
		$this->assertSame( 'Bearer valid-token', $this->service_requests[0]['args']['headers']['Authorization'], 'The request should run with the access token of the administrator who owns Analytics.' );
	}

	/**
	 * @dataProvider data_disconnected_owners
	 *
	 * @param string $state           The state the owner of Analytics is left in.
	 * @param int    $expected_status The status of the error the request should answer with.
	 * @param mixed  $expected_code   The code of the error the request should answer with.
	 */
	public function test_rest_endpoint__sends_no_request_for_a_view_only_user_whose_owner_is_disconnected( $state, $expected_status, $expected_code ) {
		$view_only_user_id = $this->create_view_only_user_of_analytics();

		$this->switch_to_user( $view_only_user_id );
		// The owner's Google client keeps the token it was built with, so the
		// owner is disconnected before the client is built and faked.
		$this->disconnect_owner_of_analytics( $state );
		$this->enable_conversion_insights();

		$response = $this->request(
			array(
				'goalType' => 'lead',
				'endDate'  => '2026-09-15',
			)
		);

		$this->assertSame( $expected_status, $response->get_status(), 'A view-only user should be refused when the owner of Analytics has no Google account to ask for the insight with.' );
		$this->assertSame( $expected_code, $response->get_data()['code'], 'The error should say why the request could not run with the account of the owner.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service when the owner of Analytics is disconnected.' );
	}

	public function data_disconnected_owners() {
		return array(
			'a recoverable module'           => array( 'recoverable', 403, 'missing_required_scopes' ),
			'no token and no granted scopes' => array( 'no_scopes', 403, 'missing_required_scopes' ),
			// Analytics refuses the reports of the payload before the
			// datapoint asks for the token.
			'no token'                       => array( 'no_token', 401, 401 ),
		);
	}

	public function test_rest_endpoint__is_not_registered_without_the_feature_flag() {
		$response = $this->request(
			array(
				'goalType' => 'lead',
				'endDate'  => '2026-09-15',
			)
		);

		$this->assertSame( 400, $response->get_status(), 'A request should answer 400 without the `siteGoalsInsights` feature flag.' );
		$this->assertSame( 'invalid_datapoint', $response->get_data()['code'], 'The error code should name the unknown datapoint.' );
	}
}
