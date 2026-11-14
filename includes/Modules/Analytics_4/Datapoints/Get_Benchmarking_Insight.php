<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Benchmarking_Insight
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use WP_Error;

/**
 * Class for the `GET:benchmarking-insight` datapoint, which reads the
 * operation that generates the benchmarking insight.
 *
 * The browser reads the operation that `POST:benchmarking-insight` returned
 * until it is done. Reading an operation spends none of the service's rate
 * limit and starts no work, and a failed generation shows as a failed
 * operation, so the browser never has to ask for the insight again to find
 * out whether it is coming.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Get_Benchmarking_Insight extends Benchmarking_Insight_Datapoint {

	/**
	 * The statuses of a failed read of an operation that the browser acts on.
	 *
	 * The service refuses a read with a 400, a 403 or a 404, and never with a
	 * 409 or a 429, since a read spends none of its rate limit. Any other
	 * failure of the read, such as a 503 for a read that ran past its time
	 * limit, is a 500, so the browser never takes a failed read for an
	 * operation that an instance shutdown interrupted. Only an operation that
	 * failed with code 503 is a 503.
	 *
	 * @since n.e.x.t
	 */
	const PASSED_ERROR_STATUSES = array( 400, 403, 404 );

	/**
	 * The longest operation ID the datapoint accepts.
	 *
	 * @since n.e.x.t
	 */
	const MAX_OPERATION_ID_LENGTH = 256;

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return callable Closure that reads the operation. It returns `done` and `state`, with the `insight` once the operation succeeded, or an error, which has status 503 when an instance shutdown interrupted the operation and 500 when the generation failed.
	 * @throws Missing_Required_Param_Exception Thrown when `operationID` is missing.
	 * @throws Invalid_Param_Exception Thrown when `operationID` isn't a string of at most `MAX_OPERATION_ID_LENGTH` characters.
	 */
	public function create_request( Data_Request $data_request ) {
		$operation_id = $data_request['operationID'];

		if ( empty( $operation_id ) ) {
			throw new Missing_Required_Param_Exception( 'operationID' );
		}

		if ( ! is_string( $operation_id ) || strlen( $operation_id ) > self::MAX_OPERATION_ID_LENGTH ) {
			throw new Invalid_Param_Exception( 'operationID' );
		}

		return function ( $client ) use ( $operation_id ) {
			$access_token = $this->get_access_token( $client );

			if ( is_wp_error( $access_token ) ) {
				return $access_token;
			}

			$operation = $this->google_proxy->get_ai_operation( $this->credentials, $access_token, $operation_id );

			if ( is_wp_error( $operation ) ) {
				return $this->get_error( $operation );
			}

			return $this->parse_operation( $operation );
		};
	}

	/**
	 * Gets the state of an operation, and its insight once it succeeded.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $operation The operation, as the service returned it.
	 * @return array|WP_Error The state as `done` and `state`, with the `insight` once the operation succeeded, or an error when it failed.
	 */
	private function parse_operation( $operation ) {
		if ( ! is_array( $operation ) ) {
			return $this->get_invalid_response_error();
		}

		$state = isset( $operation['state'] ) ? $operation['state'] : '';

		if ( 'FAILED' === $state ) {
			return $this->get_failed_operation_error( isset( $operation['error'] ) ? $operation['error'] : array() );
		}

		if ( 'SUCCEEDED' === $state ) {
			$insight = $this->get_insight( isset( $operation['response'] ) ? $operation['response'] : null );

			if ( null === $insight ) {
				return $this->get_invalid_response_error();
			}

			return array(
				'done'    => true,
				'state'   => 'SUCCEEDED',
				'insight' => $insight,
			);
		}

		// A done operation is either succeeded or failed.
		if ( ! empty( $operation['done'] ) ) {
			return $this->get_invalid_response_error();
		}

		return array(
			'done'  => false,
			'state' => 'RUNNING',
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
	 * @since n.e.x.t
	 *
	 * @param mixed $operation_error The operation's `error`, with `code`, `message` and `status`.
	 * @return WP_Error The error, with status 503 or 500, and the service's code as `reason`.
	 */
	private function get_failed_operation_error( $operation_error ) {
		$operation_error = is_array( $operation_error ) ? $operation_error : array();

		$data = array(
			'status' => isset( $operation_error['code'] ) && 503 === (int) $operation_error['code'] ? 503 : 500,
		);

		if ( ! empty( $operation_error['status'] ) && is_string( $operation_error['status'] ) ) {
			$data['reason'] = $operation_error['status'];
		}

		return new WP_Error(
			'benchmarking_insight_failed',
			! empty( $operation_error['message'] ) && is_string( $operation_error['message'] )
				? $operation_error['message']
				: __( 'The insight could not be generated.', 'google-site-kit' ),
			$data
		);
	}
}
