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
 * @since 1.193.0
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
	 * @since 1.193.0
	 */
	const PASSED_ERROR_STATUSES = array( 400, 403, 404, 409, 429, 503 );

	/**
	 * The code of the error for a service response the datapoint can't read.
	 * Each subclass names its own insight in it.
	 *
	 * @since 1.193.0
	 */
	const INVALID_RESPONSE_ERROR_CODE = 'invalid_ai_insight_response';

	/**
	 * Google_Proxy instance.
	 *
	 * @since 1.193.0
	 * @var Google_Proxy
	 */
	protected $google_proxy;

	/**
	 * Credentials instance.
	 *
	 * @since 1.193.0
	 * @var Credentials
	 */
	protected $credentials;

	/**
	 * Constructor.
	 *
	 * @since 1.193.0
	 *
	 * @param array $definition Definition fields, with the `google_proxy` and the `credentials` to reach the service with.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );

		$this->google_proxy = $definition['google_proxy'];
		$this->credentials  = $definition['credentials'];
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.193.0
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
	 * @since 1.193.0
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
	 * @since 1.193.0
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
	 * @since 1.193.0
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
	 * Gets the error the datapoint answers with when it can't read the
	 * service's response, such as one with neither an operation nor an
	 * insight in it, or an insight without a text.
	 *
	 * @since 1.193.0
	 *
	 * @return WP_Error The error, with the `INVALID_RESPONSE_ERROR_CODE` of the datapoint and status 500.
	 */
	protected function get_invalid_response_error() {
		return new WP_Error(
			static::INVALID_RESPONSE_ERROR_CODE,
			__( 'Site Kit received a generated insight it can’t read.', 'google-site-kit' ),
			array( 'status' => 500 )
		);
	}

	/**
	 * Gets the error the datapoint answers with for a failed operation.
	 *
	 * The service fails an operation with code 503 when an instance shutdown
	 * interrupted it, or when its instance died, and asking for the insight
	 * again then starts a new generation. Any other failure is a failed
	 * generation, which is a 500.
	 *
	 * @since 1.193.0
	 *
	 * @param mixed  $operation_error The operation's `error`, with `code`, `message` and `status`.
	 * @param string $error_code      The code of the error, which names the insight that failed.
	 * @return WP_Error The error, with status 503 or 500, and the operation's `status` as `reason`.
	 */
	protected function get_failed_operation_error( $operation_error, $error_code ) {
		$operation_error = is_array( $operation_error ) ? $operation_error : array();

		$data = array(
			'status' => isset( $operation_error['code'] ) && 503 === (int) $operation_error['code'] ? 503 : 500,
		);

		if ( ! empty( $operation_error['status'] ) && is_string( $operation_error['status'] ) ) {
			$data['reason'] = $operation_error['status'];
		}

		return new WP_Error(
			$error_code,
			! empty( $operation_error['message'] ) && is_string( $operation_error['message'] )
				? $operation_error['message']
				: __( 'The insight could not be generated.', 'google-site-kit' ),
			$data
		);
	}
}
