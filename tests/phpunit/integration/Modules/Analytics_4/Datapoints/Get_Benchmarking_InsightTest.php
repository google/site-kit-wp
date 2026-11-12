<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_Benchmarking_InsightTest
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
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\Benchmarking_Insight_Datapoints_Trait;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;
use WP_REST_Request;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_Benchmarking_InsightTest extends TestCase {

	use Benchmarking_Insight_Datapoints_Trait;

	/**
	 * The operation the browser reads.
	 */
	const OPERATION_ID = 'YhMZgdgne7B3vkpA7VTLJa';

	public function set_up() {
		parent::set_up();

		$this->set_up_benchmarking_insight_datapoints();
	}

	public function tear_down() {
		parent::tear_down();
		// Leave no server behind for the next test class.
		unset( $GLOBALS['wp_rest_server'] );
	}

	/**
	 * Requests the datapoint.
	 *
	 * @param array $params Optional. Query parameters. Default the ID of the operation.
	 * @return \WP_REST_Response The response.
	 */
	private function request( array $params = array( 'operationID' => self::OPERATION_ID ) ) {
		$request = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/analytics-4/data/benchmarking-insight' );
		$request->set_query_params( $params );

		return rest_get_server()->dispatch( $request );
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
	 * Gets the response of a succeeded operation, as the service returns it.
	 *
	 * @return array The response.
	 */
	private function get_operation_response() {
		return array(
			'scenario'       => 'BELOW_EXPECTED',
			'teaser'         => 'Your site is quieter than usual.',
			'analysis'       => 'Your site had fewer visits than usual, mostly from Organic Search.',
			'driver'         => 'Organic Search brought fewer visits.',
			'interaction_id' => '01M4ZDVWTA3J4SBF8QX8NVXT93',
			'model_version'  => 'model-1',
		);
	}

	public function test_rest_endpoint__reads_the_operation_from_the_service() {
		$this->enable_insight_datapoints();
		$this->answer_service_with(
			200,
			array(
				'done'  => false,
				'state' => 'RUNNING',
			)
		);

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
		$this->enable_insight_datapoints();
		$this->answer_service_with(
			200,
			array(
				'done'  => false,
				'state' => 'RUNNING',
			)
		);

		$this->request( array( 'operationID' => 'operations/a b?c' ) );

		$this->assertSame( $this->get_operation_url( 'operations%2Fa%20b%3Fc' ), $this->service_requests[0]['url'], 'The operation ID should be encoded as one segment of the URL path.' );
	}

	/**
	 * @dataProvider data_running_operations
	 *
	 * @param array $operation The operation the service returns.
	 */
	public function test_rest_endpoint__answers_running_for_an_operation_that_is_not_done( array $operation ) {
		$this->enable_insight_datapoints();
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

	public function test_rest_endpoint__answers_with_the_insight_of_a_succeeded_operation() {
		$this->enable_insight_datapoints();
		$this->answer_service_with(
			200,
			array(
				'done'     => true,
				'state'    => 'SUCCEEDED',
				'response' => $this->get_operation_response(),
			)
		);

		$response = $this->request();

		$this->assertSame( 200, $response->get_status(), 'Reading a succeeded operation should answer 200.' );
		$this->assertSame(
			array(
				'done'    => true,
				'state'   => 'SUCCEEDED',
				'insight' => array(
					'scenario'      => 'BELOW_EXPECTED',
					'teaser'        => 'Your site is quieter than usual.',
					'analysis'      => 'Your site had fewer visits than usual, mostly from Organic Search.',
					'driver'        => 'Organic Search brought fewer visits.',
					'interactionID' => '01M4ZDVWTA3J4SBF8QX8NVXT93',
					'modelVersion'  => 'model-1',
				),
			),
			$response->get_data(),
			'A succeeded operation should answer that it is done, with its insight.'
		);
	}

	public function test_rest_endpoint__answers_null_for_an_empty_field_of_a_succeeded_operation() {
		$this->enable_insight_datapoints();
		$this->answer_service_with(
			200,
			array(
				'done'     => true,
				'state'    => 'SUCCEEDED',
				'response' => array(
					'scenario' => 'WITHIN_EXPECTED',
					'teaser'   => '',
					'analysis' => 'Your site had as many visits as usual.',
				),
			)
		);

		$this->assertSame(
			array(
				'scenario'      => 'WITHIN_EXPECTED',
				'teaser'        => null,
				'analysis'      => 'Your site had as many visits as usual.',
				'driver'        => null,
				'interactionID' => null,
				'modelVersion'  => null,
			),
			$this->request()->get_data()['insight'],
			'A field the service left empty or left out should be null.'
		);
	}

	/**
	 * @dataProvider data_unreadable_operations
	 *
	 * @param mixed $operation The operation the service returns.
	 */
	public function test_rest_endpoint__answers_500_for_an_operation_it_cannot_read( $operation ) {
		$this->enable_insight_datapoints();
		$this->answer_service_with( 200, $operation );

		$response = $this->request();

		$this->assertSame( 500, $response->get_status(), 'An operation the datapoint cannot read should answer 500.' );
		$this->assertSame( 'invalid_benchmarking_insight_response', $response->get_data()['code'], 'The error should say the response could not be read.' );
	}

	public function data_unreadable_operations() {
		return array(
			'succeeded without an insight'     => array(
				array(
					'done'     => true,
					'state'    => 'SUCCEEDED',
					'response' => array( 'scenario' => 'WITHIN_EXPECTED' ),
				),
			),
			'succeeded without a response'     => array(
				array(
					'done'  => true,
					'state' => 'SUCCEEDED',
				),
			),
			'done without a known state'       => array(
				array(
					'done'  => true,
					'state' => 'CANCELLED',
				),
			),
			'done without a state'             => array( array( 'done' => true ) ),
			'a string instead of an operation' => array( 'RUNNING' ),
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
		$this->enable_insight_datapoints();
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
	 * @dataProvider data_missing_operation_ids
	 *
	 * @param array $params The query parameters of the request.
	 */
	public function test_rest_endpoint__refuses_a_request_without_an_operation_id( array $params ) {
		$this->enable_insight_datapoints();

		$response = $this->request( $params );

		$this->assertSame( 400, $response->get_status(), 'A request without an operation ID should answer 400.' );
		$this->assertSame( 'missing_required_param', $response->get_data()['code'], 'The error should name the missing parameter.' );
		$this->assertStringContainsString( 'operationID', $response->get_data()['message'], 'The error message should name the `operationID` parameter.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service without an operation ID.' );
	}

	public function data_missing_operation_ids() {
		return array(
			'no operationID'    => array( array() ),
			'empty operationID' => array( array( 'operationID' => '' ) ),
		);
	}

	/**
	 * @dataProvider data_invalid_operation_ids
	 *
	 * @param mixed $operation_id An operation ID the datapoint refuses.
	 */
	public function test_rest_endpoint__refuses_an_operation_id_that_is_not_a_short_string( $operation_id ) {
		$this->enable_insight_datapoints();

		$response = $this->request( array( 'operationID' => $operation_id ) );

		$this->assertSame( 400, $response->get_status(), 'A request with an operation ID that is not a string of at most 256 characters should answer 400.' );
		$this->assertSame( 'rest_invalid_param', $response->get_data()['code'], 'The error should say the parameter is invalid.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service for an invalid operation ID.' );
	}

	public function data_invalid_operation_ids() {
		return array(
			'257 characters' => array( str_repeat( 'a', 257 ) ),
			'a list'         => array( array( self::OPERATION_ID ) ),
		);
	}

	public function test_rest_endpoint__accepts_an_operation_id_of_256_characters() {
		$this->enable_insight_datapoints();
		$this->answer_service_with(
			200,
			array(
				'done'  => false,
				'state' => 'RUNNING',
			)
		);

		$response = $this->request( array( 'operationID' => str_repeat( 'a', 256 ) ) );

		$this->assertSame( 200, $response->get_status(), 'An operation ID of 256 characters should be accepted.' );
		$this->assertCount( 1, $this->service_requests, 'The request should reach the service.' );
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
		$this->enable_insight_datapoints();
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
			'404'                  => array(
				404,
				array(),
				404,
				array(
					'status' => 404,
					'reason' => 'OPERATION_NOT_FOUND',
				),
			),
			'429 with Retry-After' => array(
				429,
				array( 'retry-after' => '60' ),
				429,
				array(
					'status'     => 429,
					'reason'     => 'OPERATION_NOT_FOUND',
					'retryAfter' => 60,
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
		$this->enable_insight_datapoints();
		$this->fail_service_requests_with( new WP_Error( 'http_request_failed', 'cURL error 6: Could not resolve host.' ) );

		$response = $this->request();

		$this->assertSame( 500, $response->get_status(), 'A request that did not reach the service should answer 500.' );
		$this->assertSame( 'http_request_failed', $response->get_data()['code'], 'The error should keep the code of the failed request.' );
	}

	public function test_create_request__answers_403_without_an_access_token() {
		$this->enable_insight_datapoints();

		$request = $this->analytics->get_datapoint_definition( 'GET:benchmarking-insight' )->create_request(
			new Data_Request( 'GET', 'modules', 'analytics-4', 'benchmarking-insight', array( 'operationID' => self::OPERATION_ID ) )
		);

		$client = new class() {
			public function authorize() {
				throw new Google_OAuth_Exception( 'invalid_grant' );
			}

			public function getAccessToken() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid -- Mirrors the Google client.
				return array( 'access_token' => 'expired-token' );
			}
		};

		$response = $request( $client );

		$this->assertWPError( $response, 'A client whose token Google refuses to refresh should give an error.' );
		$this->assertSame( 'missing_access_token', $response->get_error_code(), 'The error should say the access token is missing.' );
		$this->assertSame( array( 'status' => 403 ), $response->get_error_data(), 'The error should have status 403.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service without an access token.' );
	}

	public function test_create_request__answers_500_when_the_token_cannot_be_refreshed() {
		$this->enable_insight_datapoints();

		$request = $this->analytics->get_datapoint_definition( 'GET:benchmarking-insight' )->create_request(
			new Data_Request( 'GET', 'modules', 'analytics-4', 'benchmarking-insight', array( 'operationID' => self::OPERATION_ID ) )
		);

		$client = new class() {
			public function authorize() {
				throw new Exception( 'cURL error 28: Operation timed out.' );
			}

			public function getAccessToken() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid -- Mirrors the Google client.
				return array( 'access_token' => 'expired-token' );
			}
		};

		$response = $request( $client );

		$this->assertWPError( $response, 'A client whose token refresh fails should give an error.' );
		$this->assertSame( 'access_token_refresh_failed', $response->get_error_code(), 'The error should say the token could not be refreshed.' );
		$this->assertSame( array( 'status' => 500 ), $response->get_error_data(), 'A refresh that may succeed on the next try should have status 500, which the browser does not keep.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service without an access token.' );
	}

	public function test_rest_endpoint__answers_a_view_only_reader_with_the_owners_account() {
		$reader_id = $this->create_view_only_reader_of_analytics();

		$this->switch_to_user( $reader_id );
		$this->enable_insight_datapoints();
		$this->answer_service_with(
			200,
			array(
				'done'     => true,
				'state'    => 'SUCCEEDED',
				'response' => $this->get_operation_response(),
			)
		);

		$this->assertFalse( ( new Authentication( $this->context, $this->options, new User_Options( $this->context, $reader_id ) ) )->is_authenticated(), 'The reader should not have connected a Google account of their own.' );

		$response = $this->request();

		$this->assertSame( 200, $response->get_status(), 'A view-only reader should be able to read the operation.' );
		$this->assertTrue( $response->get_data()['done'], 'The reader should get the succeeded operation.' );
		$this->assertSame( 'Bearer valid-token', $this->service_requests[0]['args']['headers']['Authorization'], 'The request should run with the access token of the administrator who owns Analytics.' );
	}

	/**
	 * @dataProvider data_disconnected_owners
	 *
	 * @param string $state         The state the owner of Analytics is left in.
	 * @param string $expected_code The code of the error the request should answer with.
	 */
	public function test_rest_endpoint__sends_no_request_for_a_view_only_reader_whose_owner_is_disconnected( $state, $expected_code ) {
		$reader_id = $this->create_view_only_reader_of_analytics();

		$this->switch_to_user( $reader_id );
		$this->enable_insight_datapoints();
		$this->disconnect_owner_of_analytics( $state );

		$response = $this->request();

		$this->assertSame( 403, $response->get_status(), 'A view-only reader should be refused when the owner of Analytics has no Google account to read the operation with.' );
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
		$this->enable_insight_datapoints();

		$this->assertFalse( current_user_can( Permissions::VIEW_DASHBOARD ), 'The subscriber should not be able to view the dashboard.' );

		$response = $this->request();

		$this->assertSame( 403, $response->get_status(), 'A user who cannot view the dashboard should be refused.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service for a user who cannot view the dashboard.' );
	}

	/**
	 * @dataProvider data_partial_feature_flags
	 *
	 * @param string[] $features The feature flags that are on.
	 */
	public function test_rest_endpoint__is_not_registered_without_both_feature_flags( array $features ) {
		$this->enable_insight_datapoints( $features );

		$this->assertNotContains( 'benchmarking-insight', $this->analytics->get_datapoints(), 'The datapoint should not be defined without both feature flags.' );

		$response = $this->request();

		$this->assertSame( 400, $response->get_status(), 'A request should answer 400 without both feature flags.' );
		$this->assertSame( 'invalid_datapoint', $response->get_data()['code'], 'The error code should name the unknown datapoint.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service without both feature flags.' );
	}

	public function data_partial_feature_flags() {
		return array(
			'neither flag'         => array( array() ),
			'only typicalTraffic'  => array( array( 'typicalTraffic' ) ),
			'only trafficInsights' => array( array( 'trafficInsights' ) ),
		);
	}
}
