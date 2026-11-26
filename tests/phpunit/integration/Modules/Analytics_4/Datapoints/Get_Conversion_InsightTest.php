<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_Conversion_InsightTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Exception;
use Google\Site_Kit\Core\Authentication\Exception\Google_OAuth_Exception;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Tests\AI_Insight_Datapoints_Trait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_Conversion_InsightTest extends TestCase {

	use AI_Insight_Datapoints_Trait;

	public function set_up() {
		parent::set_up();

		$this->set_up_ai_insight_datapoints();
	}

	public function tear_down() {
		parent::tear_down();
		// Leave no server behind for the next test class.
		unset( $GLOBALS['wp_rest_server'] );
	}

	/**
	 * Requests the datapoint.
	 *
	 * @since 1.193.0
	 *
	 * @param array $params Optional. Query parameters. Default the ID of an operation.
	 * @return \WP_REST_Response The response.
	 */
	private function request( array $params = array( 'operationID' => 'YhMZgdgne7B3vkpA7VTLJa' ) ) {
		$request = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/analytics-4/data/conversion-insights' );
		$request->set_query_params( $params );

		return rest_get_server()->dispatch( $request );
	}

	public function test_rest_endpoint__answers_running_for_an_operation_that_is_not_done() {
		$this->enable_insight_datapoints( array( 'siteGoalsInsights' ) );
		$this->answer_service_with(
			200,
			array(
				'done'  => false,
				'state' => 'RUNNING',
			)
		);

		$response = $this->request();

		list( $site_id ) = $this->get_fake_proxy_credentials();

		$this->assertSame( 200, $response->get_status(), 'Reading a running operation should answer 200.' );
		$this->assertSame(
			array(
				'done'  => false,
				'state' => 'RUNNING',
			),
			$response->get_data(),
			'A running operation should answer that it is not done.'
		);
		$this->assertCount( 1, $this->service_requests, 'The datapoint should send one request to the service.' );
		$this->assertSame( $this->get_service_url( '/v1/ai/operations/YhMZgdgne7B3vkpA7VTLJa' ) . '?site_id=' . rawurlencode( $site_id ), $this->service_requests[0]['url'], 'The request should read the operation from the operations endpoint of the service.' );
		$this->assertSame( 'Bearer valid-token', $this->service_requests[0]['args']['headers']['Authorization'], 'The request should be authorized with the access token of the user.' );
	}

	public function test_rest_endpoint__answers_with_the_insight_of_a_succeeded_operation() {
		$this->enable_insight_datapoints( array( 'siteGoalsInsights' ) );
		$this->answer_service_with(
			200,
			array(
				'done'     => true,
				'state'    => 'SUCCEEDED',
				'response' => array(
					'interaction_id' => '01M4B0KB2E2VWF72GMV1X4BE08',
					'scenario'       => 'DECLINE_VOL_DOWN_CR_FLAT',
					'model_version'  => 'model-1',
					'insights'       => array(
						array(
							'event_name'                => 'purchase',
							'code'                      => 'DECLINE_VOL_DOWN',
							'text'                      => 'Purchases are down 20% over the past 28 days.',
							'actionable_recommendation' => 'Fewer visits to your site led to fewer purchases.',
						),
					),
				),
			)
		);

		$response = $this->request();

		$this->assertSame( 200, $response->get_status(), 'Reading a succeeded operation should answer 200.' );
		$this->assertSame(
			array(
				'done'    => true,
				'state'   => 'SUCCEEDED',
				'insight' => array(
					'interactionID'            => '01M4B0KB2E2VWF72GMV1X4BE08',
					'scenario'                 => 'DECLINE_VOL_DOWN_CR_FLAT',
					'code'                     => 'DECLINE_VOL_DOWN',
					'text'                     => 'Purchases are down 20% over the past 28 days.',
					'actionableRecommendation' => 'Fewer visits to your site led to fewer purchases.',
				),
			),
			$response->get_data(),
			'A succeeded operation should have the insight, with the top-level `interaction_id` and `scenario` of its response, unchanged.'
		);
	}

	public function test_rest_endpoint__answers_null_for_a_field_of_the_insight_that_is_not_a_string() {
		$this->enable_insight_datapoints( array( 'siteGoalsInsights' ) );
		$this->answer_service_with(
			200,
			array(
				'done'     => true,
				'state'    => 'SUCCEEDED',
				'response' => array(
					'interaction_id' => 1234,
					'scenario'       => array( 'DECLINE_VOL_DOWN_CR_FLAT' ),
					'insights'       => array(
						array(
							'code'                      => 'DECLINE_VOL_DOWN',
							'text'                      => 'Purchases are down 20% over the past 28 days.',
							'actionable_recommendation' => 20,
						),
					),
				),
			)
		);

		$response = $this->request();

		$this->assertSame( 200, $response->get_status(), 'An insight with a text should answer 200.' );
		$this->assertSame(
			array(
				'interactionID'            => null,
				'scenario'                 => null,
				'code'                     => 'DECLINE_VOL_DOWN',
				'text'                     => 'Purchases are down 20% over the past 28 days.',
				'actionableRecommendation' => null,
			),
			$response->get_data()['insight'],
			'An `interaction_id`, a `scenario` or an `actionable_recommendation` that is not a string should be null.'
		);
	}

	/**
	 * @dataProvider data_responses_without_an_insight
	 *
	 * @param array $operation_response The response of the succeeded operation.
	 */
	public function test_rest_endpoint__answers_a_null_insight_for_a_succeeded_operation_without_one( array $operation_response ) {
		$this->enable_insight_datapoints( array( 'siteGoalsInsights' ) );
		$this->answer_service_with(
			200,
			array(
				'done'     => true,
				'state'    => 'SUCCEEDED',
				'response' => $operation_response,
			)
		);

		$response = $this->request();

		$this->assertSame(
			array(
				'done'    => true,
				'state'   => 'SUCCEEDED',
				'insight' => null,
			),
			$response->get_data(),
			'A succeeded operation without an insight should answer with a null insight.'
		);
	}

	public function data_responses_without_an_insight() {
		return array(
			'an entry with the code NO_INSIGHT' => array(
				array(
					'interaction_id' => '01M4B0KB2E2VWF72GMV1X4BE08',
					'scenario'       => 'NO_INSIGHT',
					'insights'       => array(
						array(
							'event_name' => 'purchase',
							'code'       => 'NO_INSIGHT',
						),
					),
				),
			),
			'no entry'                          => array(
				array(
					'interaction_id' => '01M4B0KB2E2VWF72GMV1X4BE08',
					'scenario'       => 'NO_INSIGHT',
					'insights'       => array(),
				),
			),
		);
	}

	/**
	 * @dataProvider data_unreadable_operations
	 *
	 * @param mixed $operation The operation the service returns.
	 */
	public function test_rest_endpoint__answers_500_for_an_operation_it_cannot_read( $operation ) {
		$this->enable_insight_datapoints( array( 'siteGoalsInsights' ) );
		$this->answer_service_with( 200, $operation );

		$response = $this->request();

		$this->assertSame( 500, $response->get_status(), 'An operation the datapoint cannot read, such as a done one that neither succeeded with a response nor failed, should answer 500.' );
		$this->assertSame( 'invalid_conversion_insight_response', $response->get_data()['code'], 'The error should say the operation could not be read.' );
	}

	public function data_unreadable_operations() {
		return array(
			'a succeeded operation without a response' => array(
				array(
					'done'  => true,
					'state' => 'SUCCEEDED',
				),
			),
			'a done operation without a state'         => array( array( 'done' => true ) ),
			'a succeeded operation whose insight has no text' => array(
				array(
					'done'     => true,
					'state'    => 'SUCCEEDED',
					'response' => array(
						'interaction_id' => '01M4B0KB2E2VWF72GMV1X4BE08',
						'scenario'       => 'DECLINE_VOL_DOWN_CR_FLAT',
						'insights'       => array(
							array(
								'code' => 'DECLINE_VOL_DOWN',
								'text' => '',
							),
						),
					),
				),
			),
			'a succeeded operation whose insight text is not a string' => array(
				array(
					'done'     => true,
					'state'    => 'SUCCEEDED',
					'response' => array(
						'interaction_id' => '01M4B0KB2E2VWF72GMV1X4BE08',
						'scenario'       => 'DECLINE_VOL_DOWN_CR_FLAT',
						'insights'       => array(
							array(
								'code' => 'DECLINE_VOL_DOWN',
								'text' => array( 'Purchases are down 20% over the past 28 days.' ),
							),
						),
					),
				),
			),
			'a succeeded operation whose response is not an object' => array(
				array(
					'done'     => true,
					'state'    => 'SUCCEEDED',
					'response' => 'NO_INSIGHT',
				),
			),
			'a string instead of an operation'         => array( 'RUNNING' ),
		);
	}

	/**
	 * @dataProvider data_failed_operations
	 *
	 * @param array $operation_error The `error` of the failed operation.
	 * @param int   $status          The status the datapoint should answer with.
	 */
	public function test_rest_endpoint__answers_an_error_for_a_failed_operation( array $operation_error, $status ) {
		$this->enable_insight_datapoints( array( 'siteGoalsInsights' ) );
		$this->answer_service_with(
			200,
			array(
				'done'  => true,
				'state' => 'FAILED',
				'error' => $operation_error,
			)
		);

		$response = $this->request();

		$this->assertSame( $status, $response->get_status(), "An operation that failed with code {$operation_error['code']} should answer $status." );
		$this->assertSame(
			array(
				'code'    => 'conversion_insight_failed',
				'message' => $operation_error['message'],
				'data'    => array(
					'status' => $status,
					'reason' => $operation_error['status'],
				),
			),
			$response->get_data(),
			'The error should have the `conversion_insight_failed` code, the message of the operation, and its `status` as `reason`.'
		);
	}

	public function data_failed_operations() {
		return array(
			'an interrupted operation' => array(
				array(
					'code'    => 503,
					'message' => 'The instance shut down.',
					'status'  => 'UNAVAILABLE',
				),
				503,
			),
			'a 503 code as a string'   => array(
				array(
					'code'    => '503',
					'message' => 'The instance died.',
					'status'  => 'UNAVAILABLE',
				),
				503,
			),
			'a failed generation'      => array(
				array(
					'code'    => 13,
					'message' => 'The model failed.',
					'status'  => 'INTERNAL',
				),
				500,
			),
		);
	}

	/**
	 * @dataProvider data_invalid_operation_ids
	 *
	 * @param array  $params        The query parameters of the request.
	 * @param string $expected_code The code of the error the request should answer with.
	 */
	public function test_rest_endpoint__refuses_a_missing_or_unusable_operation_id( array $params, $expected_code ) {
		$this->enable_insight_datapoints( array( 'siteGoalsInsights' ) );

		$response = $this->request( $params );

		$this->assertSame( 400, $response->get_status(), 'A request without a usable operation ID should answer 400.' );
		$this->assertSame( $expected_code, $response->get_data()['code'], 'The error should say whether the operation ID is missing or invalid.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service without a usable operation ID.' );
	}

	public function data_invalid_operation_ids() {
		return array(
			'no operation ID'                   => array( array(), 'rest_missing_callback_param' ),
			'an empty operation ID'             => array( array( 'operationID' => '' ), 'missing_required_param' ),
			'an operation ID of 257 characters' => array( array( 'operationID' => str_repeat( 'a', 257 ) ), 'rest_invalid_param' ),
			'a list of operation IDs'           => array( array( 'operationID' => array( 'YhMZgdgne7B3vkpA7VTLJa' ) ), 'rest_invalid_param' ),
		);
	}

	public function test_rest_endpoint__accepts_an_operation_id_of_256_characters() {
		$this->enable_insight_datapoints( array( 'siteGoalsInsights' ) );
		$this->answer_service_with(
			200,
			array(
				'done'  => false,
				'state' => 'RUNNING',
			)
		);

		$response = $this->request( array( 'operationID' => str_repeat( 'a', 256 ) ) );

		$this->assertSame( 200, $response->get_status(), 'An operation ID of 256 characters should be accepted.' );
	}

	/**
	 * @dataProvider data_service_errors
	 *
	 * @param int $status          The status the service answers with.
	 * @param int $expected_status The status the datapoint should answer with.
	 */
	public function test_rest_endpoint__answers_a_read_error_with_its_status_or_500( $status, $expected_status ) {
		$this->enable_insight_datapoints( array( 'siteGoalsInsights' ) );
		$this->answer_service_with(
			$status,
			array(
				'error' => 'The service refused the read.',
				'code'  => 'NOT_FOUND',
			)
		);

		$response = $this->request();

		$this->assertSame( $expected_status, $response->get_status(), "A $status from the service should answer $expected_status." );
		$this->assertSame( 'NOT_FOUND', $response->get_data()['data']['reason'], 'The error should keep the `code` of the service as `reason`.' );
	}

	public function data_service_errors() {
		return array(
			'400' => array( 400, 400 ),
			'403' => array( 403, 403 ),
			'404' => array( 404, 404 ),
			'429' => array( 429, 500 ),
			'503' => array( 503, 500 ),
		);
	}

	public function test_create_request__sends_the_access_token_the_client_refreshed() {
		$this->enable_insight_datapoints( array( 'siteGoalsInsights' ) );
		$this->answer_service_with(
			200,
			array(
				'done'  => false,
				'state' => 'RUNNING',
			)
		);

		$request = $this->analytics->get_datapoint_definition( 'GET:conversion-insights' )->create_request(
			new Data_Request( 'GET', 'modules', 'analytics-4', 'conversion-insights', array( 'operationID' => 'YhMZgdgne7B3vkpA7VTLJa' ) )
		);

		// The stand-in replaces its token in `authorize()`, as the Google
		// client does for a token that has expired.
		$client = new class() {

			/**
			 * The token `getAccessToken()` returns.
			 *
			 * @var array
			 */
			private $token = array( 'access_token' => 'expired-token' );

			public function authorize() {
				$this->token = array( 'access_token' => 'fresh-token' );
			}

			public function getAccessToken() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid -- Mirrors the Google client.
				return $this->token;
			}
		};

		$request( $client );

		$this->assertCount( 1, $this->service_requests, 'The datapoint should send one request to the service once the client refreshed its token.' );
		$this->assertSame( 'Bearer fresh-token', $this->service_requests[0]['args']['headers']['Authorization'], 'The request should be authorized with the token the client refreshed, not the one it had before.' );
	}

	/**
	 * @dataProvider data_failed_token_refreshes
	 *
	 * @param Exception $exception      The exception the client throws when it refreshes its token.
	 * @param string    $expected_code   The code of the error the closure should answer with.
	 * @param int       $expected_status The status of the error.
	 */
	public function test_create_request__answers_an_error_without_a_request_when_the_token_cannot_be_refreshed( Exception $exception, $expected_code, $expected_status ) {
		$this->enable_insight_datapoints( array( 'siteGoalsInsights' ) );

		$request = $this->analytics->get_datapoint_definition( 'GET:conversion-insights' )->create_request(
			new Data_Request( 'GET', 'modules', 'analytics-4', 'conversion-insights', array( 'operationID' => 'YhMZgdgne7B3vkpA7VTLJa' ) )
		);

		// The stand-in throws in `authorize()`, as the Google client does for a
		// token refresh that fails.
		$client = new class( $exception ) {

			/**
			 * The exception `authorize()` throws.
			 *
			 * @var Exception
			 */
			private $exception;

			public function __construct( Exception $exception ) {
				$this->exception = $exception;
			}

			public function authorize() {
				throw $this->exception;
			}
		};

		$response = $request( $client );

		$this->assertWPError( $response, 'A client whose token refresh fails should give an error.' );
		$this->assertSame( $expected_code, $response->get_error_code(), 'The error should say whether the token is missing or could not be refreshed.' );
		$this->assertSame( array( 'status' => $expected_status ), $response->get_error_data(), "The error should have status $expected_status." );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service without an access token.' );
	}

	public function data_failed_token_refreshes() {
		return array(
			'a refresh that Google refuses'  => array( new Google_OAuth_Exception( 'invalid_grant' ), 'missing_access_token', 403 ),
			'a refresh that fails otherwise' => array( new Exception( 'cURL error 28: Operation timed out.' ), 'access_token_refresh_failed', 500 ),
		);
	}

	/**
	 * @dataProvider data_unusable_tokens
	 *
	 * @param mixed $token The token the client has after `authorize()`.
	 */
	public function test_create_request__answers_403_without_a_request_for_a_client_without_an_access_token( $token ) {
		$this->enable_insight_datapoints( array( 'siteGoalsInsights' ) );

		$request = $this->analytics->get_datapoint_definition( 'GET:conversion-insights' )->create_request(
			new Data_Request( 'GET', 'modules', 'analytics-4', 'conversion-insights', array( 'operationID' => 'YhMZgdgne7B3vkpA7VTLJa' ) )
		);

		$client = new class( $token ) {

			/**
			 * The token `getAccessToken()` returns.
			 *
			 * @var mixed
			 */
			private $token;

			public function __construct( $token ) {
				$this->token = $token;
			}

			public function authorize() {
			}

			public function getAccessToken() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid -- Mirrors the Google client.
				return $this->token;
			}
		};

		$response = $request( $client );

		$this->assertWPError( $response, 'A client without a usable access token should give an error.' );
		$this->assertSame( 'missing_access_token', $response->get_error_code(), 'The error should say the access token is missing.' );
		$this->assertSame( array( 'status' => 403 ), $response->get_error_data(), 'The error should have status 403.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service without an access token.' );
	}

	public function data_unusable_tokens() {
		return array(
			'no token'                    => array( null ),
			'an empty access token'       => array( array( 'access_token' => '' ) ),
			'an access token as a number' => array( array( 'access_token' => 12345 ) ),
		);
	}

	public function test_rest_endpoint__refuses_a_user_who_cannot_view_the_dashboard() {
		$subscriber_id = $this->factory()->user->create( array( 'role' => 'subscriber' ) );

		$this->switch_to_user( $subscriber_id );
		$this->enable_insight_datapoints( array( 'siteGoalsInsights' ) );

		$response = $this->request();

		$this->assertSame( 403, $response->get_status(), 'A user who cannot view the dashboard should be refused.' );
		$this->assertSame( 'rest_forbidden', $response->get_data()['code'], 'The request should be refused by a permission check, before any Google account is looked at.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service for a user who cannot view the dashboard.' );
	}

	public function test_rest_endpoint__answers_a_view_only_user_with_the_owners_account() {
		$view_only_user_id = $this->create_view_only_user_of_analytics();

		$this->switch_to_user( $view_only_user_id );
		$this->enable_insight_datapoints( array( 'siteGoalsInsights' ) );
		$this->answer_service_with(
			200,
			array(
				'done'  => false,
				'state' => 'RUNNING',
			)
		);

		$response = $this->request();

		$this->assertSame( 200, $response->get_status(), 'A view-only user should be able to read the operation.' );
		$this->assertSame( 'Bearer valid-token', $this->service_requests[0]['args']['headers']['Authorization'], 'The read should run with the access token of the administrator who owns Analytics.' );
	}

	/**
	 * @dataProvider data_disconnected_owners
	 *
	 * @param string $state         The state the owner of Analytics is left in.
	 * @param string $expected_code The code of the error the request should answer with.
	 */
	public function test_rest_endpoint__sends_no_request_for_a_view_only_user_whose_owner_is_disconnected( $state, $expected_code ) {
		$view_only_user_id = $this->create_view_only_user_of_analytics();

		$this->switch_to_user( $view_only_user_id );
		$this->enable_insight_datapoints( array( 'siteGoalsInsights' ) );
		$this->disconnect_owner_of_analytics( $state );

		$response = $this->request();

		$this->assertSame( 403, $response->get_status(), 'A view-only user should be refused when the owner of Analytics has no Google account to read the operation with.' );
		$this->assertSame( $expected_code, $response->get_data()['code'], 'The error should say why the request could not run with the account of the owner.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service when the owner of Analytics is disconnected.' );
	}

	public function data_disconnected_owners() {
		return array(
			'a recoverable module'           => array( 'recoverable', 'missing_required_scopes' ),
			'no token and no granted scopes' => array( 'no_scopes', 'missing_required_scopes' ),
			'no token'                       => array( 'no_token', 'missing_access_token' ),
		);
	}

	public function test_rest_endpoint__is_not_registered_without_the_feature_flag() {
		$response = $this->request();

		$this->assertSame( 400, $response->get_status(), 'A request should answer 400 without the `siteGoalsInsights` feature flag.' );
		$this->assertSame( 'invalid_datapoint', $response->get_data()['code'], 'The error code should name the unknown datapoint.' );
	}
}
