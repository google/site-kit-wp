<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\AI_Insight_Reader
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use WP_Error;

/**
 * Base class for reading a generated insight from the Site Kit service's
 * answer.
 *
 * Each insight has its own fields, so each has its own reader, which the
 * datapoint that asks for the insight and the datapoint that reads the
 * operation that generates it share. The reader also names its insight in the
 * code of the error for an answer it can't read and for an operation that
 * failed, which the browser's store of that insight checks for.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
abstract class AI_Insight_Reader {

	/**
	 * The code of the error for an answer the reader can't read. Each subclass
	 * names its own insight in it.
	 *
	 * @since n.e.x.t
	 */
	const INVALID_RESPONSE_ERROR_CODE = 'invalid_ai_insight_response';

	/**
	 * The code of the error for an operation that failed to generate the
	 * insight. Each subclass names its own insight in it.
	 *
	 * @since n.e.x.t
	 */
	const FAILED_OPERATION_ERROR_CODE = 'ai_insight_failed';

	/**
	 * Reads the insight from the service's answer.
	 *
	 * The texts of the insight are the model's output, so they pass through
	 * unchanged, and the browser renders them as text.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $response The service's answer, or the response of a succeeded operation.
	 * @return array|null|WP_Error The insight, null when the service wrote none, or an error from `get_invalid_response_error()` when the reader can't read it.
	 */
	abstract public function read( array $response );

	/**
	 * Gets the error for an answer of the service that the reader can't read,
	 * such as one with neither an operation nor an insight in it, or an
	 * insight without a text.
	 *
	 * @since n.e.x.t
	 *
	 * @return WP_Error The error, with the `INVALID_RESPONSE_ERROR_CODE` of the reader and status 500.
	 */
	public function get_invalid_response_error() {
		return new WP_Error(
			static::INVALID_RESPONSE_ERROR_CODE,
			__( 'Site Kit received a generated insight it can’t read.', 'google-site-kit' ),
			array( 'status' => 500 )
		);
	}

	/**
	 * Gets the error for an operation that failed to generate the insight.
	 *
	 * The service fails an operation with code 503 when an instance shutdown
	 * interrupted it, or when its instance died, and asking for the insight
	 * again then starts a new generation. Any other failure is a failed
	 * generation, which is a 500.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $operation_error The operation's `error`, with `code`, `message` and `status`.
	 * @return WP_Error The error, with the `FAILED_OPERATION_ERROR_CODE` of the reader, status 503 or 500, and the operation's `status` as `reason`.
	 */
	public function get_failed_operation_error( $operation_error ) {
		$operation_error = is_array( $operation_error ) ? $operation_error : array();

		$data = array(
			'status' => isset( $operation_error['code'] ) && 503 === (int) $operation_error['code'] ? 503 : 500,
		);

		if ( ! empty( $operation_error['status'] ) && is_string( $operation_error['status'] ) ) {
			$data['reason'] = $operation_error['status'];
		}

		return new WP_Error(
			static::FAILED_OPERATION_ERROR_CODE,
			! empty( $operation_error['message'] ) && is_string( $operation_error['message'] )
				? $operation_error['message']
				: __( 'The insight could not be generated.', 'google-site-kit' ),
			$data
		);
	}
}
