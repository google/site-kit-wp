<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_AI_Insight_OperationTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Exception;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Exception\Google_OAuth_Exception;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\AI_Insight_Datapoints_Trait;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;
use WP_REST_Request;

/**
 * The datapoint reads the operation of every insight the same way, so most
 * tests read it through `GET:benchmarking-insight`. The tests at the end check
 * that each insight's route reads its own insight, under its own feature flag.
 * `Benchmarking_Insight_ReaderTest` and `Conversion_Insight_ReaderTest` test
 * how each insight is read.
 *
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_AI_Insight_OperationTest extends TestCase {

	use AI_Insight_Datapoints_Trait;

	/**
	 * The operation the browser reads.
	 */
	const OPERATION_ID = 'YhMZgdgne7B3vkpA7VTLJa';

	/**
	 * The route most tests read the operation through.
	 */
	const DATAPOINT = 'benchmarking-insight';

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
	 * Requests the datapoint through the REST API.
	 *
	 * @param array  $params    Optional. Query parameters. Default the ID of the operation.
	 * @param string $datapoint Optional. The route of the datapoint. Default `DATAPOINT`.
	 * @return \WP_REST_Response The response.
	 */
	private function request( array $params = array( 'operationID' => self::OPERATION_ID ), $datapoint = self::DATAPOINT ) {
		$request = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/analytics-4/data/' . $datapoint );
		$request->set_query_params( $params );

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Gets the closure the datapoint creates for a request, without the
	 * validation a REST request runs first.
	 *
	 * @param mixed $operation_id Optional. The ID of the operation. Default the ID of the operation.
	 * @return callable The closure, which takes the Google client the request runs with.
	 */
	private function create_operation_request( $operation_id = self::OPERATION_ID ) {
		return $this->analytics->get_datapoint_definition( 'GET:' . self::DATAPOINT )->create_request(
			new Data_Request( 'GET', 'modules', 'analytics-4', self::DATAPOINT, array( 'operationID' => $operation_id ) )
		);
	}

	/**
	 * Gets the URL the datapoint reads an operation from.
	 *
	 * @param string $encoded_operation_id The operation ID, encoded for a URL path.
	 * @return string The URL.
	 */
	private function get_operation_url( $encoded_operation_id ) {
		list( $site_id ) = $this->get_fake_proxy_credentials();

		return $this->get_service_url( '/v1/ai/operations/' . $encoded_operation_id ) . '?site_id=' . rawurlencode( $site_id );
	}

	/**
	 * Makes the fake service answer with an operation that still runs.
	 */
	private function answer_service_with_a_running_operation() {
		$this->answer_service_with(
			200,
			array(
				'done'  => false,
				'state' => 'RUNNING',
			)
		);
	}

	public function test_rest_endpoint__reads_the_operation_from_the_service() {
		$this->enable_insight_datapoints( array( 'trafficInsights' ) );
		$this->answer_service_with_a_running_operation();

		$response = $this->request();

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
		$this->assertSame( $this->get_operation_url( self::OPERATION_ID ), $this->service_requests[0]['url'], 'The request should read the operation from the operations endpoint of the service, with the site ID as its only query parameter.' );
		$this->assertSame( 'GET', $this->service_requests[0]['args']['method'], 'The request to the service should be a GET.' );
		$this->assertSame( 'Bearer valid-token', $this->service_requests[0]['args']['headers']['Authorization'], 'The request should be authorized with the access token of the user.' );
	}

	public function test_rest_endpoint__encodes_the_operation_id_in_the_url() {
		$this->enable_insight_datapoints( array( 'trafficInsights' ) );
		$this->answer_service_with_a_running_operation();

		$this->request( array( 'operationID' => 'operations/a b?c' ) );

		$this->assertSame( $this->get_operation_url( 'operations%2Fa%20b%3Fc' ), $this->service_requests[0]['url'], 'The operation ID should be encoded as one segment of the URL path.' );
	}

	/**
	 * @dataProvider data_running_operations
	 *
	 * @param array $operation The operation the service returns.
	 */
	public function test_rest_endpoint__answers_running_for_an_operation_that_is_not_done( array $operation ) {
		$this->enable_insight_datapoints( array( 'trafficInsights' ) );
		$this->answer_service_with( 200, $operation );

		$this->assertSame(
			array(
				'done'  => false,
				'state' => 'RUNNING',
			),
			$this->request()->get_data(),
			'An operation that is not done should answer that it is running.'
		);
	}

	public function data_running_operations() {
		return array(
			'running'                  => array(
				array(
					'done'  => false,
					'state' => 'RUNNING',
				),
			),
			'no state'                 => array( array( 'done' => false ) ),
			'an unknown state'         => array(
				array(
					'done'  => false,
					'state' => 'PENDING',
				),
			),
			'neither done nor a state' => array( array( 'name' => self::OPERATION_ID ) ),
		);
	}

	public function test_rest_endpoint__answers_with_the_wait_the_service_asks_for_before_the_next_read() {
		$this->enable_insight_datapoints( array( 'trafficInsights' ) );
		$this->answer_service_with(
			200,
			array(
				'done'  => false,
				'state' => 'RUNNING',
			),
			array( 'retry-after' => '2' )
		);

		$this->assertSame(
			array(
				'done'       => false,
				'state'      => 'RUNNING',
				'retryAfter' => 2,
			),
			$this->request()->get_data(),
			'A running operation should carry the `Retry-After` of the service, in seconds, as `retryAfter`.'
		);
	}

	/**
	 * @dataProvider data_unreadable_operations
	 *
	 * @param mixed $operation The operation the service returns.
	 */
	public function test_rest_endpoint__answers_500_for_an_operation_it_cannot_read( $operation ) {
		$this->enable_insight_datapoints( array( 'trafficInsights' ) );
		$this->answer_service_with( 200, $operation );

		$response = $this->request();

		$this->assertSame( 500, $response->get_status(), 'An operation the datapoint cannot read, such as a done one that neither succeeded with a response nor failed, should answer 500.' );
		$this->assertSame( 'invalid_benchmarking_insight_response', $response->get_data()['code'], 'The error should say the operation could not be read.' );
	}

	public function data_unreadable_operations() {
		return array(
			'a succeeded operation without a response' => array(
				array(
					'done'  => true,
					'state' => 'SUCCEEDED',
				),
			),
			'a succeeded operation whose response is not an object' => array(
				array(
					'done'     => true,
					'state'    => 'SUCCEEDED',
					'response' => 'NO_INSIGHT',
				),
			),
			'a done operation without a known state'   => array(
				array(
					'done'  => true,
					'state' => 'CANCELLED',
				),
			),
			'a done operation without a state'         => array( array( 'done' => true ) ),
			'a string instead of an operation'         => array( 'RUNNING' ),
		);
	}

	/**
	 * @dataProvider data_failed_operations
	 *
	 * @param array  $operation_error The `error` of the failed operation.
	 * @param int    $status          The status the datapoint should answer with.
	 * @param string $message         The message the error should have.
	 * @param array  $data            The data the error should carry.
	 */
	public function test_rest_endpoint__answers_an_error_for_a_failed_operation( array $operation_error, $status, $message, array $data ) {
		$this->enable_insight_datapoints( array( 'trafficInsights' ) );
		$this->answer_service_with(
			200,
			array(
				'done'  => true,
				'state' => 'FAILED',
				'error' => $operation_error,
			)
		);

		$response = $this->request();

		$this->assertSame( $status, $response->get_status(), "A failed operation should answer $status." );
		$this->assertSame(
			array(
				'code'    => 'benchmarking_insight_failed',
				'message' => $message,
				'data'    => $data,
			),
			$response->get_data(),
			'The error should say the insight failed, with the message of the operation and its status as `reason`.'
		);
	}

	public function data_failed_operations() {
		return array(
			'an interrupted operation' => array(
				array(
					'code'    => 503,
					'message' => 'The instance shut down before the insight was written.',
					'status'  => 'UNAVAILABLE',
				),
				503,
				'The instance shut down before the insight was written.',
				array(
					'status' => 503,
					'reason' => 'UNAVAILABLE',
				),
			),
			'a 503 code as a string'   => array(
				array(
					'code'    => '503',
					'message' => 'The instance died.',
					'status'  => 'UNAVAILABLE',
				),
				503,
				'The instance died.',
				array(
					'status' => 503,
					'reason' => 'UNAVAILABLE',
				),
			),
			'a failed generation'      => array(
				array(
					'code'    => 13,
					'message' => 'The model could not write the insight.',
					'status'  => 'INTERNAL',
				),
				500,
				'The model could not write the insight.',
				array(
					'status' => 500,
					'reason' => 'INTERNAL',
				),
			),
			'an error without message' => array(
				array( 'code' => 500 ),
				500,
				'The insight could not be generated.',
				array( 'status' => 500 ),
			),
			'no error'                 => array(
				array(),
				500,
				'The insight could not be generated.',
				array( 'status' => 500 ),
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
		$this->enable_insight_datapoints( array( 'trafficInsights' ) );

		$response = $this->request( $params );

		$this->assertSame( 400, $response->get_status(), 'A request without a usable operation ID should answer 400.' );
		$this->assertSame( $expected_code, $response->get_data()['code'], 'The error should say whether the operation ID is missing or invalid.' );
		$this->assertStringContainsString( 'operationID', $response->get_data()['message'], 'The error message should name the `operationID` parameter.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service without a usable operation ID.' );
	}

	public function data_invalid_operation_ids() {
		return array(
			'no operation ID'                   => array( array(), 'rest_missing_callback_param' ),
			'an empty operation ID'             => array( array( 'operationID' => '' ), 'missing_required_param' ),
			'an operation ID of 257 characters' => array( array( 'operationID' => str_repeat( 'a', 257 ) ), 'rest_invalid_param' ),
			'a list of operation IDs'           => array( array( 'operationID' => array( self::OPERATION_ID ) ), 'rest_invalid_param' ),
		);
	}

	public function test_rest_endpoint__accepts_an_operation_id_of_256_characters() {
		$this->enable_insight_datapoints( array( 'trafficInsights' ) );
		$this->answer_service_with_a_running_operation();

		$response = $this->request( array( 'operationID' => str_repeat( 'a', 256 ) ) );

		$this->assertSame( 200, $response->get_status(), 'An operation ID of 256 characters should be accepted.' );
		$this->assertCount( 1, $this->service_requests, 'The request should reach the service.' );
	}

	public function test_create_request__refuses_an_operation_id_that_is_not_a_string() {
		$this->enable_insight_datapoints( array( 'trafficInsights' ) );

		$this->expectException( Invalid_Param_Exception::class );

		// A direct call skips the schema that refuses it over the REST API.
		$this->create_operation_request( array( self::OPERATION_ID ) );
	}

	/**
	 * @dataProvider data_service_errors
	 *
	 * @param int   $status          The status the service answers with.
	 * @param array $headers         The headers the service answers with.
	 * @param int   $expected_status The status the datapoint should answer with.
	 * @param array $expected_data   The data the error should carry.
	 */
	public function test_rest_endpoint__answers_a_service_error_with_its_status_or_500( $status, array $headers, $expected_status, array $expected_data ) {
		$this->enable_insight_datapoints( array( 'trafficInsights' ) );
		$this->answer_service_with(
			$status,
			array(
				'error' => 'The operation could not be read.',
				'code'  => 'OPERATION_NOT_FOUND',
			),
			$headers
		);

		$response = $this->request();

		$this->assertSame( $expected_status, $response->get_status(), "A $status from the service should answer $expected_status." );
		$this->assertSame(
			array(
				'code'    => 'request_failed',
				'message' => 'The operation could not be read.',
				'data'    => $expected_data,
			),
			$response->get_data(),
			'The error should keep the message of the service, its `code` as `reason` and its `Retry-After` as `retryAfter`.'
		);
	}

	public function data_service_errors() {
		return array(
			'400'                  => array(
				400,
				array(),
				400,
				array(
					'status' => 400,
					'reason' => 'OPERATION_NOT_FOUND',
				),
			),
			'403'                  => array(
				403,
				array(),
				403,
				array(
					'status' => 403,
					'reason' => 'OPERATION_NOT_FOUND',
				),
			),
			'404'                  => array(
				404,
				array(),
				404,
				array(
					'status' => 404,
					'reason' => 'OPERATION_NOT_FOUND',
				),
			),
			// A read doesn't count against the service's rate limit, so the
			// service never answers it with a 409 or a 429.
			'409 with Retry-After' => array(
				409,
				array( 'retry-after' => '5' ),
				500,
				array(
					'status'     => 500,
					'reason'     => 'OPERATION_NOT_FOUND',
					'retryAfter' => 5,
				),
			),
			'429 with Retry-After' => array(
				429,
				array( 'retry-after' => '60' ),
				500,
				array(
					'status'     => 500,
					'reason'     => 'OPERATION_NOT_FOUND',
					'retryAfter' => 60,
				),
			),
			// Only an operation that failed with code 503 is a 503, so the
			// browser asks for the insight again only when an instance
			// shutdown interrupted its generation.
			'503 with Retry-After' => array(
				503,
				array( 'retry-after' => '5' ),
				500,
				array(
					'status'     => 500,
					'reason'     => 'OPERATION_NOT_FOUND',
					'retryAfter' => 5,
				),
			),
			'401'                  => array(
				401,
				array(),
				500,
				array(
					'status' => 500,
					'reason' => 'OPERATION_NOT_FOUND',
				),
			),
			'502'                  => array(
				502,
				array(),
				500,
				array(
					'status' => 500,
					'reason' => 'OPERATION_NOT_FOUND',
				),
			),
		);
	}

	public function test_rest_endpoint__answers_500_when_the_service_cannot_be_reached() {
		$this->enable_insight_datapoints( array( 'trafficInsights' ) );
		$this->fail_service_requests_with( new WP_Error( 'http_request_failed', 'cURL error 6: Could not resolve host.' ) );

		$response = $this->request();

		$this->assertSame( 500, $response->get_status(), 'A request that did not reach the service should answer 500.' );
		$this->assertSame( 'http_request_failed', $response->get_data()['code'], 'The error should keep the code of the failed request.' );
	}

	public function test_create_request__sends_the_access_token_the_client_refreshed() {
		$this->enable_insight_datapoints( array( 'trafficInsights' ) );
		$this->answer_service_with_a_running_operation();

		$request = $this->create_operation_request();

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
	 * @param Exception $exception       The exception the client throws when it refreshes its token.
	 * @param string    $expected_code   The code of the error the closure should answer with.
	 * @param int       $expected_status The status of the error.
	 */
	public function test_create_request__answers_an_error_without_a_request_when_the_token_cannot_be_refreshed( Exception $exception, $expected_code, $expected_status ) {
		$this->enable_insight_datapoints( array( 'trafficInsights' ) );

		$request = $this->create_operation_request();

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
		$this->enable_insight_datapoints( array( 'trafficInsights' ) );

		$request = $this->create_operation_request();

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

	public function test_rest_endpoint__answers_a_view_only_user_with_the_owners_account() {
		$view_only_user_id = $this->create_view_only_user_of_analytics();

		$this->switch_to_user( $view_only_user_id );
		$this->enable_insight_datapoints( array( 'trafficInsights' ) );
		$this->answer_service_with_a_running_operation();

		$this->assertFalse( ( new Authentication( $this->context, $this->options, new User_Options( $this->context, $view_only_user_id ) ) )->is_authenticated(), 'The view-only user should not have connected a Google account of their own.' );

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
		$this->enable_insight_datapoints( array( 'trafficInsights' ) );
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

	public function test_rest_endpoint__refuses_a_user_who_cannot_view_the_dashboard() {
		$subscriber_id = $this->factory()->user->create( array( 'role' => 'subscriber' ) );

		$this->switch_to_user( $subscriber_id );
		$this->enable_insight_datapoints( array( 'trafficInsights' ) );

		$this->assertFalse( current_user_can( Permissions::VIEW_DASHBOARD ), 'The subscriber should not be able to view the dashboard.' );

		$response = $this->request();

		$this->assertSame( 403, $response->get_status(), 'A user who cannot view the dashboard should be refused.' );
		$this->assertSame( 'rest_forbidden', $response->get_data()['code'], 'The request should be refused by a permission check, before any Google account is looked at.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service for a user who cannot view the dashboard.' );
	}

	/**
	 * @dataProvider data_insights
	 *
	 * @param string $datapoint          The route of the insight's datapoint.
	 * @param string $feature            The feature flag that defines the datapoint.
	 * @param array  $operation_response The response of the succeeded operation.
	 * @param array  $expected_insight   The insight the datapoint should answer with.
	 */
	public function test_rest_endpoint__answers_with_the_insight_of_its_route( $datapoint, $feature, array $operation_response, array $expected_insight ) {
		$this->enable_insight_datapoints( array( $feature ) );
		$this->answer_service_with(
			200,
			array(
				'done'     => true,
				'state'    => 'SUCCEEDED',
				'response' => $operation_response,
			)
		);

		$response = $this->request( array( 'operationID' => self::OPERATION_ID ), $datapoint );

		$this->assertSame( 200, $response->get_status(), 'Reading a succeeded operation should answer 200.' );
		$this->assertSame(
			array(
				'done'    => true,
				'state'   => 'SUCCEEDED',
				'insight' => $expected_insight,
			),
			$response->get_data(),
			'A succeeded operation should answer that it is done, with the insight the reader of its route reads.'
		);
	}

	public function data_insights() {
		return array(
			'the benchmarking insight' => array(
				'benchmarking-insight',
				'trafficInsights',
				array(
					'scenario'       => 'BELOW_EXPECTED',
					'teaser'         => 'Your site is quieter than usual.',
					'analysis'       => 'Your site had fewer visits than usual, mostly from Organic Search.',
					'driver'         => 'Organic Search brought fewer visits.',
					'interaction_id' => '01M4ZDVWTA3J4SBF8QX8NVXT93',
					'model_version'  => 'model-1',
				),
				array(
					'scenario'      => 'BELOW_EXPECTED',
					'teaser'        => 'Your site is quieter than usual.',
					'analysis'      => 'Your site had fewer visits than usual, mostly from Organic Search.',
					'driver'        => 'Organic Search brought fewer visits.',
					'interactionID' => '01M4ZDVWTA3J4SBF8QX8NVXT93',
					'modelVersion'  => 'model-1',
				),
			),
			'the Site Goals insight'   => array(
				'conversion-insights',
				'siteGoalsInsights',
				array(
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
				array(
					'interactionID'            => '01M4B0KB2E2VWF72GMV1X4BE08',
					'scenario'                 => 'DECLINE_VOL_DOWN_CR_FLAT',
					'code'                     => 'DECLINE_VOL_DOWN',
					'text'                     => 'Purchases are down 20% over the past 28 days.',
					'actionableRecommendation' => 'Fewer visits to your site led to fewer purchases.',
				),
			),
		);
	}

	/**
	 * @dataProvider data_error_codes_of_each_insight
	 *
	 * @param string $datapoint      The route of the insight's datapoint.
	 * @param string $feature        The feature flag that defines the datapoint.
	 * @param string $failed_code    The code of the error for a failed operation.
	 * @param string $invalid_code   The code of the error for an operation the datapoint cannot read.
	 */
	public function test_rest_endpoint__names_the_insight_of_its_route_in_its_errors( $datapoint, $feature, $failed_code, $invalid_code ) {
		$this->enable_insight_datapoints( array( $feature ) );

		$this->answer_service_with(
			200,
			array(
				'done'  => true,
				'state' => 'FAILED',
				'error' => array( 'code' => 13 ),
			)
		);

		$this->assertSame( $failed_code, $this->request( array( 'operationID' => self::OPERATION_ID ), $datapoint )->get_data()['code'], 'The error for a failed operation should name the insight of the route, which its store checks for.' );

		$this->answer_service_with( 200, array( 'done' => true ) );

		$this->assertSame( $invalid_code, $this->request( array( 'operationID' => self::OPERATION_ID ), $datapoint )->get_data()['code'], 'The error for an operation the datapoint cannot read should name the insight of the route.' );
	}

	public function data_error_codes_of_each_insight() {
		return array(
			'the benchmarking insight' => array( 'benchmarking-insight', 'trafficInsights', 'benchmarking_insight_failed', 'invalid_benchmarking_insight_response' ),
			'the Site Goals insight'   => array( 'conversion-insights', 'siteGoalsInsights', 'conversion_insight_failed', 'invalid_conversion_insight_response' ),
		);
	}

	/**
	 * @dataProvider data_feature_flags_of_each_insight
	 *
	 * @param string $datapoint     The route of the insight's datapoint.
	 * @param string $other_feature The feature flag of the other insight, which is on.
	 */
	public function test_rest_endpoint__is_not_registered_without_its_feature_flag( $datapoint, $other_feature ) {
		$this->enable_insight_datapoints( array( $other_feature ) );

		$this->assertNotContains( $datapoint, $this->analytics->get_datapoints(), 'The datapoint should not be defined without its own feature flag, even with the flag of the other insight on.' );

		$response = $this->request( array( 'operationID' => self::OPERATION_ID ), $datapoint );

		$this->assertSame( 400, $response->get_status(), 'A request should answer 400 without the feature flag.' );
		$this->assertSame( 'invalid_datapoint', $response->get_data()['code'], 'The error code should name the unknown datapoint.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service without the feature flag.' );
	}

	public function data_feature_flags_of_each_insight() {
		return array(
			'the benchmarking insight' => array( 'benchmarking-insight', 'siteGoalsInsights' ),
			'the Site Goals insight'   => array( 'conversion-insights', 'trafficInsights' ),
		);
	}
}
