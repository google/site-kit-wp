<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\AI_Insight_Datapoint
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Exception;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Authentication\Exception\Google_OAuth_Exception;
use Google\Site_Kit\Core\Authentication\Exception\Google_Proxy_Code_Exception;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\Modules\Permission_Aware_Datapoint;
use Google\Site_Kit\Core\Modules\Shareable_Datapoint;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Data_Request;
use WP_Error;

/**
 * Base class for the datapoints that reach the Site Kit service's generative
 * AI endpoints: a datapoint that asks for an insight, and a datapoint that
 * reads the operation that generates it.
 *
 * They are shareable, so on a view-only dashboard of a role that Analytics is
 * shared with, the request runs with the module owner's Google account, as the
 * reports the insight describes do. The closure `create_request()` returns
 * receives the Google client the request runs with, and its access token
 * authenticates the call to the service.
 *
 * What differs between insights is what the service writes for them, so the
 * datapoints of an insight read it with that insight's `AI_Insight_Reader`.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
abstract class AI_Insight_Datapoint extends Shareable_Datapoint implements Executable_Datapoint, Permission_Aware_Datapoint {

	/**
	 * The statuses of a failed service request the browser acts on. Each of
	 * them means one thing to the store that waits for the insight. Any other
	 * failure, including a transport error that has no status, is a 500. A
	 * datapoint that the service answers with fewer of them overrides the list.
	 *
	 * @since n.e.x.t
	 */
	const PASSED_ERROR_STATUSES = array( 400, 403, 404, 409, 429, 503 );

	/**
	 * Callback that returns the Google_Proxy instance.
	 *
	 * @since n.e.x.t
	 * @var callable
	 */
	private $google_proxy;

	/**
	 * Callback that returns the Credentials instance.
	 *
	 * @since n.e.x.t
	 * @var callable
	 */
	private $credentials;

	/**
	 * The reader of the insight the datapoint reaches the service for.
	 *
	 * @since n.e.x.t
	 * @var AI_Insight_Reader
	 */
	private $insight_reader;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $definition Definition fields, with the `google_proxy` and the `credentials` callbacks that return what reaches the service, and the `insight_reader` of the insight.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );

		$this->google_proxy   = $definition['google_proxy'];
		$this->credentials    = $definition['credentials'];
		$this->insight_reader = $definition['insight_reader'];
	}

	/**
	 * Gets the Google_Proxy instance to reach the service with.
	 *
	 * @since n.e.x.t
	 *
	 * @return Google_Proxy The Google_Proxy instance.
	 */
	protected function get_google_proxy() {
		return call_user_func( $this->google_proxy );
	}

	/**
	 * Gets the credentials to reach the service with.
	 *
	 * @since n.e.x.t
	 *
	 * @return Credentials The Credentials instance.
	 */
	protected function get_credentials() {
		return call_user_func( $this->credentials );
	}

	/**
	 * Gets the reader of the insight the datapoint reaches the service for.
	 *
	 * @since n.e.x.t
	 *
	 * @return AI_Insight_Reader The AI_Insight_Reader instance.
	 */
	protected function get_insight_reader() {
		return $this->insight_reader;
	}

	/**
	 * Parses a response.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data     Data request object.
	 * @return mixed The response without any modifications.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}

	/**
	 * Checks whether the current user is allowed to access the datapoint.
	 *
	 * The generated insight is part of the shared dashboard, so a view-only
	 * user has to reach the datapoint. Declaring the check matters for a
	 * `POST` datapoint in particular: without it, the module data route lets
	 * only users who can manage options write.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if the current user can view the dashboard, false otherwise.
	 */
	public function permission_callback() {
		return current_user_can( Permissions::VIEW_DASHBOARD );
	}

	/**
	 * Gets the access token of the Google client the request runs with.
	 *
	 * A datapoint that runs no Google API request before the call to the
	 * service, such as one that reads an operation, has nothing else that
	 * would refresh an expired token. The client refreshes it here, the way it
	 * does before any Google API request, and stores the new token.
	 *
	 * A token that Google refuses to refresh, or a client without a token, is a
	 * 403, which the browser keeps for a while. Any other failure to refresh the
	 * token, such as a network error, is a 500, so the next load tries again.
	 *
	 * @since n.e.x.t
	 *
	 * @param object $client The Google client the request runs with.
	 * @return string|WP_Error The access token, or an error with status 403 when there is none, or 500 when it couldn't be refreshed.
	 */
	protected function get_access_token( $client ) {
		$error = new WP_Error(
			'missing_access_token',
			__( 'Site Kit couldn’t authenticate the request for the generated insight.', 'google-site-kit' ),
			array( 'status' => 403 )
		);

		try {
			$client->authorize();
		} catch ( Google_OAuth_Exception | Google_Proxy_Code_Exception $exception ) {
			return $error;
		} catch ( Exception $exception ) {
			return new WP_Error(
				'access_token_refresh_failed',
				__( 'Site Kit couldn’t refresh the access token for the generated insight.', 'google-site-kit' ),
				array( 'status' => 500 )
			);
		}

		$token = $client->getAccessToken();

		if ( ! is_array( $token ) || empty( $token['access_token'] ) || ! is_string( $token['access_token'] ) ) {
			return $error;
		}

		return $token['access_token'];
	}

	/**
	 * Gets the error the datapoint answers with for a failed service request.
	 *
	 * The error keeps the service's message, its machine-readable code as
	 * `reason`, and its `Retry-After` as `retryAfter`.
	 *
	 * @since n.e.x.t
	 *
	 * @param WP_Error $error The error of the service request.
	 * @return WP_Error The error, with a status from `PASSED_ERROR_STATUSES` or 500.
	 */
	protected function get_error( WP_Error $error ) {
		$error_data = $error->get_error_data();
		$error_data = is_array( $error_data ) ? $error_data : array();
		$status     = isset( $error_data['status'] ) ? (int) $error_data['status'] : 0;

		$data = array(
			'status' => in_array( $status, static::PASSED_ERROR_STATUSES, true ) ? $status : 500,
		);

		foreach ( array( 'reason', 'retryAfter' ) as $key ) {
			if ( isset( $error_data[ $key ] ) ) {
				$data[ $key ] = $error_data[ $key ];
			}
		}

		$message = $error->get_error_message();

		return new WP_Error(
			$error->get_error_code(),
			'' !== $message ? $message : __( 'Site Kit couldn’t get the generated insight.', 'google-site-kit' ),
			$data
		);
	}

	/**
	 * Adds the time the service asks the browser to wait to an answer that
	 * points at a running operation.
	 *
	 * The service sends a `Retry-After` header with an operation it started
	 * or joined, and with every read of an operation that still runs: the
	 * seconds to wait before the next read. `Google_Proxy` returns it as
	 * `retryAfter`, and the answer keeps that name, as an error does.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $answer   The answer of the datapoint.
	 * @param array $response The service's response, as `Google_Proxy` returns it.
	 * @return array The answer, with `retryAfter` when the service's response has it.
	 */
	protected function with_retry_after( array $answer, array $response ) {
		if ( isset( $response['retryAfter'] ) && is_int( $response['retryAfter'] ) ) {
			$answer['retryAfter'] = $response['retryAfter'];
		}

		return $answer;
	}
}
