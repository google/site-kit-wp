<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Create_Benchmarking_InsightTest
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
use Google\Site_Kit\Core\Authentication\Exception\Google_Proxy_Code_Exception;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Insight_Payload;
use Google\Site_Kit\Tests\Benchmarking_Insight_Datapoints_Trait;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;
use WP_REST_Request;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Create_Benchmarking_InsightTest extends TestCase {

	use Benchmarking_Insight_Datapoints_Trait;

	/**
	 * The operation the fake service starts for a request.
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
	 * Gets a request as `Insight_Request_Builder::build()` returns it.
	 *
	 * @return array The request.
	 */
	private function get_insight_request() {
		return array(
			'end_date'        => '2026-09-15',
			'days_in_period'  => 28,
			'visits'          => array(
				'current_period'  => 412,
				'previous_period' => 388,
			),
			'baseline'        => array(
				'expected_range_min' => 344,
				'expected_range_max' => 441,
			),
			'contextual_data' => array(
				'search_query_shifts' => array(
					array(
						'query'    => 'plant garlic',
						'clicks'   => array(
							'current'  => 300,
							'previous' => 210,
						),
						'position' => array(
							'current'  => 3.4,
							'previous' => 12.5,
						),
					),
				),
			),
		);
	}

	/**
	 * Gets the payload `GET:benchmarking-data` builds for a user.
	 *
	 * @param int    $user_id Optional. The user the payload is built for. Default the current user.
	 * @param string $locale  Optional. The locale of the insight. Default `de_DE`.
	 * @return string The payload.
	 */
	private function get_payload( $user_id = null, $locale = 'de_DE' ) {
		return Insight_Payload::encode( $this->get_insight_request(), $locale, null === $user_id ? get_current_user_id() : $user_id );
	}

	/**
	 * Requests the datapoint.
	 *
	 * @param array|null $data The `data` of the request, or null to send none.
	 * @return \WP_REST_Response The response.
	 */
	private function request( $data ) {
		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/analytics-4/data/benchmarking-insight' );

		if ( null !== $data ) {
			$request->set_body_params( array( 'data' => $data ) );
		}

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Gets an insight as the service returns it.
	 *
	 * @return array The insight.
	 */
	private function get_service_insight() {
		return array(
			'scenario'       => 'ABOVE_EXPECTED',
			'teaser'         => 'Your site is busier than usual.',
			'analysis'       => 'Your site had more visits than usual, mostly from Organic Search.',
			'driver'         => 'Organic Search brought most of the extra visits.',
			'interaction_id' => '01M4ZDVWTA3J4SBF8QX8NVXT93',
			'model_version'  => 'model-1',
		);
	}

	public function test_rest_endpoint__forwards_the_request_of_the_payload_to_the_service() {
		$this->enable_insight_datapoints();
		$this->answer_service_with( 200, array( 'operation_id' => self::OPERATION_ID ) );

		$response = $this->request( array( 'payload' => $this->get_payload() ) );

		$this->assertSame( 200, $response->get_status(), 'A request with a payload the site built for the user should answer 200.' );
		$this->assertSame( array( 'operationID' => self::OPERATION_ID ), $response->get_data(), 'The response should carry the ID of the operation the service started.' );
		$this->assertCount( 1, $this->service_requests, 'The datapoint should send one request to the service.' );

		list( $site_id, $site_secret ) = $this->get_fake_proxy_credentials();

		$service_request = $this->service_requests[0];

		$this->assertSame( $this->get_service_url( '/v1/ai/benchmarking?hl=de_DE' ), $service_request['url'], 'The request should reach the benchmarking endpoint of the service, with the locale of the payload as `hl`.' );
		$this->assertSame( 'POST', $service_request['args']['method'], 'The request to the service should be a POST.' );
		$this->assertSame( 'Bearer valid-token', $service_request['args']['headers']['Authorization'], 'The request should be authorized with the access token of the user.' );
		$this->assertSame( Google_Proxy::get_application_name(), $service_request['args']['headers']['User-Agent'], 'The request should name the plugin release in its `User-Agent` header.' );
		$this->assertSame( 'application/json', $service_request['args']['headers']['Content-Type'], 'The request should be sent as JSON.' );
		$this->assertSame(
			array_merge(
				$this->get_insight_request(),
				array(
					'async'       => true,
					'site_id'     => $site_id,
					'site_secret' => $site_secret,
				)
			),
			json_decode( $service_request['args']['body'], true ),
			'The body should be the request of the payload, unchanged, with `async` set to true and the site credentials.'
		);
	}

	public function test_rest_endpoint__asks_for_the_insight_in_the_locale_of_the_payload() {
		$this->enable_insight_datapoints();
		$this->answer_service_with( 200, array( 'operation_id' => self::OPERATION_ID ) );

		$this->request( array( 'payload' => $this->get_payload( null, 'de_DE_formal' ) ) );

		$this->assertSame( $this->get_service_url( '/v1/ai/benchmarking?hl=de_DE_formal' ), $this->service_requests[0]['url'], 'The request should carry the locale of the payload, as WordPress names it, as `hl`.' );
	}

	public function test_rest_endpoint__answers_with_the_insight_the_service_had_in_its_cache() {
		$this->enable_insight_datapoints();
		$this->answer_service_with( 200, $this->get_service_insight() );

		$response = $this->request( array( 'payload' => $this->get_payload() ) );

		$this->assertSame( 200, $response->get_status(), 'An insight from the cache of the service should answer 200.' );
		$this->assertSame(
			array(
				'insight' => array(
					'scenario'      => 'ABOVE_EXPECTED',
					'teaser'        => 'Your site is busier than usual.',
					'analysis'      => 'Your site had more visits than usual, mostly from Organic Search.',
					'driver'        => 'Organic Search brought most of the extra visits.',
					'interactionID' => '01M4ZDVWTA3J4SBF8QX8NVXT93',
					'modelVersion'  => 'model-1',
				),
			),
			$response->get_data(),
			'The response should carry the insight, with its fields named as the browser reads them.'
		);
	}

	public function test_rest_endpoint__answers_null_for_an_empty_or_missing_insight_field() {
		$this->enable_insight_datapoints();
		$this->answer_service_with(
			200,
			array(
				'scenario'      => null,
				'teaser'        => '',
				'analysis'      => 'Your site had as many visits as usual.',
				'model_version' => 7,
			)
		);

		$response = $this->request( array( 'payload' => $this->get_payload() ) );

		$this->assertSame(
			array(
				'insight' => array(
					'scenario'      => null,
					'teaser'        => null,
					'analysis'      => 'Your site had as many visits as usual.',
					'driver'        => null,
					'interactionID' => null,
					'modelVersion'  => null,
				),
			),
			$response->get_data(),
			'A field the service left empty, left out or sent as something other than a string should be null.'
		);
	}

	public function test_rest_endpoint__answers_with_an_insight_that_has_only_a_driver() {
		$this->enable_insight_datapoints();
		$this->answer_service_with( 200, array( 'driver' => 'Organic Search brought most of the extra visits.' ) );

		$response = $this->request( array( 'payload' => $this->get_payload() ) );

		$this->assertSame( 200, $response->get_status(), 'An insight with a driver but no analysis should answer 200.' );
		$this->assertSame( 'Organic Search brought most of the extra visits.', $response->get_data()['insight']['driver'], 'The response should carry the driver.' );
	}

	/**
	 * @dataProvider data_unreadable_service_responses
	 *
	 * @param mixed $body The body the service answers with.
	 */
	public function test_rest_endpoint__answers_500_for_a_response_with_neither_an_operation_nor_an_insight( $body ) {
		$this->enable_insight_datapoints();
		$this->answer_service_with( 200, $body );

		$response = $this->request( array( 'payload' => $this->get_payload() ) );

		$this->assertSame( 500, $response->get_status(), 'A response with neither an operation nor an analysis or a driver should answer 500.' );
		$this->assertSame( 'invalid_benchmarking_insight_response', $response->get_data()['code'], 'The error should say the response could not be read.' );
	}

	public function data_unreadable_service_responses() {
		return array(
			'no fields'                  => array( array( 'model_version' => 'model-1' ) ),
			'an empty operation'         => array( array( 'operation_id' => '' ) ),
			'an operation number'        => array( array( 'operation_id' => 123 ) ),
			'empty analysis and driver'  => array(
				array(
					'scenario' => 'ABOVE_EXPECTED',
					'analysis' => '',
					'driver'   => '',
				),
			),
			'a list instead of a object' => array( array( 'operation-1' ) ),
		);
	}

	/**
	 * @dataProvider data_missing_payloads
	 *
	 * @param array|null $data The `data` of the request.
	 */
	public function test_rest_endpoint__refuses_a_request_without_a_payload( $data ) {
		$this->enable_insight_datapoints();

		$response = $this->request( $data );

		$this->assertSame( 400, $response->get_status(), 'A request without a payload should answer 400.' );
		$this->assertSame( 'missing_required_param', $response->get_data()['code'], 'The error should name the missing parameter.' );
		$this->assertStringContainsString( 'payload', $response->get_data()['message'], 'The error message should name the `payload` parameter.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service without a payload.' );
	}

	public function data_missing_payloads() {
		return array(
			'no data'       => array( null ),
			'no payload'    => array( array( 'other' => 'value' ) ),
			'empty payload' => array( array( 'payload' => '' ) ),
		);
	}

	/**
	 * @dataProvider data_foreign_payloads
	 *
	 * @param callable $get_payload Gets the payload, from the test case.
	 */
	public function test_rest_endpoint__refuses_a_payload_the_site_did_not_build_for_the_user( callable $get_payload ) {
		$this->enable_insight_datapoints();

		$response = $this->request( array( 'payload' => $get_payload( $this ) ) );

		$this->assertSame( 400, $response->get_status(), 'A payload the site did not build for the current user should answer 400.' );
		$this->assertSame( 'rest_invalid_param', $response->get_data()['code'], 'The error should say the parameter is invalid.' );
		$this->assertStringContainsString( 'payload', $response->get_data()['message'], 'The error message should name the `payload` parameter.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service for a payload the site did not build for the user.' );
	}

	public function data_foreign_payloads() {
		return array(
			'another user'     => array( fn( $test ) => $test->get_payload_for_another_user() ),
			'a changed body'   => array( fn( $test ) => $test->get_payload_with_a_changed_body() ),
			'not a payload'    => array( fn() => 'not a payload' ),
			'a list'           => array( fn() => array( 'payload' ) ),
			'an unsigned body' => array( fn( $test ) => explode( '.', $test->get_payload_for_the_current_user() )[0] ),
		);
	}

	/**
	 * Gets a payload built for another user than the current one.
	 *
	 * @return string The payload.
	 */
	public function get_payload_for_another_user() {
		return $this->get_payload( $this->factory()->user->create( array( 'role' => 'administrator' ) ) );
	}

	/**
	 * Gets the payload built for the current user.
	 *
	 * @return string The payload.
	 */
	public function get_payload_for_the_current_user() {
		return $this->get_payload();
	}

	/**
	 * Gets a payload built for the current user whose body was changed after it was signed.
	 *
	 * @return string The payload.
	 */
	public function get_payload_with_a_changed_body() {
		list( , $signature ) = explode( '.', $this->get_payload() );

		$changed_body = rtrim(
			strtr(
				base64_encode(
					wp_json_encode(
						array(
							'locale'  => 'de_DE',
							'request' => array_merge( $this->get_insight_request(), array( 'days_in_period' => 7 ) ),
						)
					)
				),
				'+/',
				'-_'
			),
			'='
		);

		return $changed_body . '.' . $signature;
	}

	/**
	 * @dataProvider data_passed_service_errors
	 *
	 * @param int   $status   The status the service answers with.
	 * @param array $headers  The headers the service answers with.
	 * @param array $expected The data the error should carry.
	 */
	public function test_rest_endpoint__passes_the_status_reason_and_retry_after_of_a_service_error( $status, array $headers, array $expected ) {
		$this->enable_insight_datapoints();
		$this->answer_service_with(
			$status,
			array(
				'error'      => 'The service refused the request.',
				'error_code' => 'benchmarking_refused',
				'code'       => 'SERVICE_REFUSED',
			),
			$headers
		);

		$response = $this->request( array( 'payload' => $this->get_payload() ) );

		$this->assertSame( $status, $response->get_status(), "A $status from the service should answer $status." );
		$this->assertSame(
			array(
				'code'    => 'benchmarking_refused',
				'message' => 'The service refused the request.',
				'data'    => $expected,
			),
			$response->get_data(),
			"The error should keep the code and the message of the $status, and carry its status, its `code` as `reason` and its `Retry-After` as `retryAfter`."
		);
	}

	public function data_passed_service_errors() {
		return array(
			'400'                   => array(
				400,
				array(),
				array(
					'status' => 400,
					'reason' => 'SERVICE_REFUSED',
				),
			),
			'403'                   => array(
				403,
				array(),
				array(
					'status' => 403,
					'reason' => 'SERVICE_REFUSED',
				),
			),
			'404'                   => array(
				404,
				array(),
				array(
					'status' => 404,
					'reason' => 'SERVICE_REFUSED',
				),
			),
			'409'                   => array(
				409,
				array(),
				array(
					'status' => 409,
					'reason' => 'SERVICE_REFUSED',
				),
			),
			'429 with Retry-After'  => array(
				429,
				array( 'retry-after' => '120' ),
				array(
					'status'     => 429,
					'reason'     => 'SERVICE_REFUSED',
					'retryAfter' => 120,
				),
			),
			'503 with Retry-After'  => array(
				503,
				array( 'retry-after' => '30' ),
				array(
					'status'     => 503,
					'reason'     => 'SERVICE_REFUSED',
					'retryAfter' => 30,
				),
			),
			'503 with an HTTP date' => array(
				503,
				array( 'retry-after' => 'Wed, 16 Sep 2026 07:28:00 GMT' ),
				array(
					'status' => 503,
					'reason' => 'SERVICE_REFUSED',
				),
			),
		);
	}

	/**
	 * @dataProvider data_other_service_errors
	 *
	 * @param int $status The status the service answers with.
	 */
	public function test_rest_endpoint__answers_500_for_any_other_service_error( $status ) {
		$this->enable_insight_datapoints();
		$this->answer_service_with( $status, array( 'code' => 'INTERNAL' ) );

		$response = $this->request( array( 'payload' => $this->get_payload() ) );

		$this->assertSame( 500, $response->get_status(), "A $status from the service should answer 500." );
		$this->assertSame( 'request_failed', $response->get_data()['code'], 'An error without an `error_code` should have the `request_failed` code.' );
		$this->assertSame( 'Site Kit couldn’t get the generated insight.', $response->get_data()['message'], 'An error without a message should have the datapoint\'s own message.' );
		$this->assertSame(
			array(
				'status' => 500,
				'reason' => 'INTERNAL',
			),
			$response->get_data()['data'],
			'The error should keep the `code` of the service as `reason`.'
		);
	}

	public function data_other_service_errors() {
		return array(
			'401' => array( 401 ),
			'500' => array( 500 ),
			'502' => array( 502 ),
		);
	}

	public function test_rest_endpoint__answers_500_when_the_service_cannot_be_reached() {
		$this->enable_insight_datapoints();
		$this->fail_service_requests_with( new WP_Error( 'http_request_failed', 'cURL error 28: Operation timed out.' ) );

		$response = $this->request( array( 'payload' => $this->get_payload() ) );

		$this->assertSame( 500, $response->get_status(), 'A request that did not reach the service should answer 500.' );
		$this->assertSame( 'http_request_failed', $response->get_data()['code'], 'The error should keep the code of the failed request.' );
		$this->assertSame( 'cURL error 28: Operation timed out.', $response->get_data()['message'], 'The error should keep the message of the failed request.' );
	}

	/**
	 * @dataProvider data_clients_without_an_access_token
	 *
	 * @param object $client The Google client the request runs with.
	 */
	public function test_create_request__answers_403_without_an_access_token( $client ) {
		$this->enable_insight_datapoints();

		$request = $this->analytics->get_datapoint_definition( 'POST:benchmarking-insight' )->create_request(
			new Data_Request( 'POST', 'modules', 'analytics-4', 'benchmarking-insight', array( 'payload' => $this->get_payload() ) )
		);

		$response = $request( $client );

		$this->assertWPError( $response, 'A client without an access token should give an error.' );
		$this->assertSame( 'missing_access_token', $response->get_error_code(), 'The error should say the access token is missing.' );
		$this->assertSame( array( 'status' => 403 ), $response->get_error_data(), 'The error should have status 403.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service without an access token.' );
	}

	public function data_clients_without_an_access_token() {
		return array(
			'a refresh that Google refuses'           => array( $this->create_client( null, new Google_OAuth_Exception( 'invalid_grant' ) ) ),
			'a refresh the proxy refuses with a code' => array( $this->create_client( null, new Google_Proxy_Code_Exception( 'invalid_grant', 0, 'access-code' ) ) ),
			'no token'                                => array( $this->create_client( null ) ),
			'a token without access'                  => array( $this->create_client( array( 'refresh_token' => 'refresh' ) ) ),
			'an empty access token'                   => array( $this->create_client( array( 'access_token' => '' ) ) ),
			'an access token not string'              => array( $this->create_client( array( 'access_token' => 12345 ) ) ),
			'a token that is not a token'             => array( $this->create_client( 'valid-token' ) ),
		);
	}

	public function test_create_request__answers_500_when_the_token_cannot_be_refreshed() {
		$this->enable_insight_datapoints();

		$request = $this->analytics->get_datapoint_definition( 'POST:benchmarking-insight' )->create_request(
			new Data_Request( 'POST', 'modules', 'analytics-4', 'benchmarking-insight', array( 'payload' => $this->get_payload() ) )
		);

		$response = $request( $this->create_client( null, new Exception( 'cURL error 28: Operation timed out.' ) ) );

		$this->assertWPError( $response, 'A client whose token refresh fails should give an error.' );
		$this->assertSame( 'access_token_refresh_failed', $response->get_error_code(), 'The error should say the token could not be refreshed.' );
		$this->assertSame( array( 'status' => 500 ), $response->get_error_data(), 'A refresh that may succeed on the next try should have status 500, which the browser does not keep.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service without an access token.' );
	}

	public function test_create_request__sends_the_access_token_the_client_refreshed() {
		$this->enable_insight_datapoints();
		$this->answer_service_with( 200, array( 'operation_id' => self::OPERATION_ID ) );

		$request = $this->analytics->get_datapoint_definition( 'POST:benchmarking-insight' )->create_request(
			new Data_Request( 'POST', 'modules', 'analytics-4', 'benchmarking-insight', array( 'payload' => $this->get_payload() ) )
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

		$response = $request( $client );

		$this->assertSame( array( 'operationID' => self::OPERATION_ID ), $response, 'A client that refreshed its token should get the operation the service started.' );
		$this->assertCount( 1, $this->service_requests, 'The datapoint should send one request to the service.' );
		$this->assertSame( 'Bearer fresh-token', $this->service_requests[0]['args']['headers']['Authorization'], 'The request should be authorized with the token the client refreshed, not the one it had before.' );
	}

	/**
	 * Creates a Google client stand-in with the given token.
	 *
	 * @param mixed          $token               The token `getAccessToken()` returns.
	 * @param Exception|null $authorize_exception Optional. The exception `authorize()` throws, as a failed token refresh does. Default null, for none.
	 * @return object The client.
	 */
	private function create_client( $token, ?Exception $authorize_exception = null ) {
		return new class( $token, $authorize_exception ) {

			/**
			 * The token `getAccessToken()` returns.
			 *
			 * @var mixed
			 */
			private $token;

			/**
			 * The exception `authorize()` throws, if any.
			 *
			 * @var Exception|null
			 */
			private $authorize_exception;

			public function __construct( $token, $authorize_exception ) {
				$this->token               = $token;
				$this->authorize_exception = $authorize_exception;
			}

			public function authorize() {
				if ( $this->authorize_exception ) {
					throw $this->authorize_exception;
				}
			}

			public function getAccessToken() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid -- Mirrors the Google client.
				return $this->token;
			}
		};
	}

	public function test_rest_endpoint__answers_a_view_only_reader_with_the_owners_account() {
		$reader_id = $this->create_view_only_reader_of_analytics();

		$this->switch_to_user( $reader_id );
		$this->enable_insight_datapoints();
		$this->answer_service_with( 200, array( 'operation_id' => self::OPERATION_ID ) );

		$this->assertFalse( ( new Authentication( $this->context, $this->options, new User_Options( $this->context, $reader_id ) ) )->is_authenticated(), 'The reader should not have connected a Google account of their own.' );
		$this->assertFalse( current_user_can( Permissions::SETUP ) || current_user_can( Permissions::MANAGE_OPTIONS ), 'The reader should fail the route\'s default check for a write, which asks for setup or options access.' );

		$response = $this->request( array( 'payload' => $this->get_payload( $reader_id ) ) );

		$this->assertSame( 200, $response->get_status(), 'A view-only reader should be able to ask for the insight.' );
		$this->assertSame( array( 'operationID' => self::OPERATION_ID ), $response->get_data(), 'The reader should get the operation the service started.' );
		$this->assertSame( 'Bearer valid-token', $this->service_requests[0]['args']['headers']['Authorization'], 'The request should run with the access token of the administrator who owns Analytics.' );
	}

	public function test_rest_endpoint__refuses_a_view_only_reader_a_payload_built_for_the_owner() {
		$reader_id = $this->create_view_only_reader_of_analytics();
		$payload   = $this->get_payload( $this->admin_id );

		$this->switch_to_user( $reader_id );
		$this->enable_insight_datapoints();

		$response = $this->request( array( 'payload' => $payload ) );

		$this->assertSame( 400, $response->get_status(), 'A reader should not be able to send a payload built for the owner.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service for a payload built for another user.' );
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

		$response = $this->request( array( 'payload' => $this->get_payload( $reader_id ) ) );

		$this->assertSame( 403, $response->get_status(), 'A view-only reader should be refused when the owner of Analytics has no Google account to ask for the insight with.' );
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

		$response = $this->request( array( 'payload' => $this->get_payload( $subscriber_id ) ) );

		$this->assertSame( 403, $response->get_status(), 'A user who cannot view the dashboard should be refused.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service for a user who cannot view the dashboard.' );
	}

	public function test_rest_endpoint__refuses_an_administrator_who_is_not_authenticated() {
		$other_admin = $this->factory()->user->create( array( 'role' => 'administrator' ) );

		$this->switch_to_user( $other_admin );
		$this->enable_insight_datapoints();

		$this->assertTrue( current_user_can( Permissions::SETUP ), 'The administrator should be able to run setup, which the route default accepts for a write.' );
		$this->assertFalse( current_user_can( Permissions::VIEW_DASHBOARD ), 'The administrator should not be able to view the dashboard without an account of their own.' );

		$response = $this->request( array( 'payload' => $this->get_payload( $other_admin ) ) );

		$this->assertSame( 403, $response->get_status(), 'The declared permission check should refuse a user the route default would have let through.' );
		$this->assertSame( array(), $this->service_requests, 'No request should reach the service for a user the datapoint refuses.' );
	}

	/**
	 * @dataProvider data_partial_feature_flags
	 *
	 * @param string[] $features The feature flags that are on.
	 */
	public function test_rest_endpoint__is_not_registered_without_both_feature_flags( array $features ) {
		$this->enable_insight_datapoints( $features );

		$this->assertNotContains( 'benchmarking-insight', $this->analytics->get_datapoints(), 'The datapoint should not be defined without both feature flags.' );

		$response = $this->request( array( 'payload' => $this->get_payload() ) );

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
