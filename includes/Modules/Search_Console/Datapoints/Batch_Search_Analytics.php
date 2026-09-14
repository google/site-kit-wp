<?php
/**
 * Class Google\Site_Kit\Modules\Search_Console\Datapoints\Batch_Search_Analytics
 *
 * @package   Google\Site_Kit\Modules\Search_Console\Datapoints
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Search_Console\Datapoints;

use Exception;
use Google\Site_Kit\Core\Modules\Datapoint;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit_Dependencies\Google\Service\Exception as Google_Service_Exception;
use WP_Error;

/**
 * Datapoint class for Search Console search analytics batch requests.
 *
 * @since 1.170.0
 * @since 1.186.0 Renamed from `SearchAnalyticsBatch` and refactored onto `Search_Analytics_Trait`.
 * @access private
 * @ignore
 */
class Batch_Search_Analytics extends Datapoint implements Executable_Datapoint {

	use Search_Analytics_Trait;

	/**
	 * Identifiers for the requested payloads.
	 *
	 * @since 1.170.0
	 * @var array
	 */
	private $request_identifiers = array();

	/**
	 * Captured errors for individual requests.
	 *
	 * @since 1.170.0
	 * @var array
	 */
	private $request_errors = array();

	/**
	 * Constructor.
	 *
	 * @since 1.170.0
	 * @since 1.186.0 Replaced request callbacks with the module settings and context.
	 *
	 * @param array $definition Datapoint definition.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );

		$this->settings = $definition['settings'];
		$this->context  = $definition['context'];
	}

	/**
	 * Creates a request object.
	 *
	 * @since 1.170.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return callable Callable to execute the batch request, resolving to an empty array when no entry could be prepared.
	 * @throws Missing_Required_Param_Exception Thrown when required parameters are missing.
	 */
	public function create_request( Data_Request $data_request ) {
		$requests = isset( $data_request->data['requests'] ) ? $data_request->data['requests'] : null;

		if ( empty( $requests ) || ! is_array( $requests ) ) {
			throw new Missing_Required_Param_Exception( 'requests' );
		}

		$this->request_identifiers = array();
		$this->request_errors      = array();

		$batch              = $this->get_service()->createBatch();
		$has_valid_requests = false;

		foreach ( $requests as $request_data ) {
			$identifier                  = $this->normalize_identifier( $request_data );
			$this->request_identifiers[] = $identifier;

			try {
				$args           = $this->prepare_search_analytics_request_args( $request_data );
				$single_request = $this->create_search_analytics_request( $args );

				$batch->add( $single_request, $identifier );
				$has_valid_requests = true;
			} catch ( Exception $exception ) {
				$this->request_errors[ $identifier ] = $this->exception_to_error( $exception );
			}
		}

		if ( ! $has_valid_requests ) {
			return function () {
				return array();
			};
		}

		return function () use ( $batch ) {
			return $batch->execute();
		};
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.170.0
	 *
	 * @param mixed        $response      Request response.
	 * @param Data_Request $data_request  Data request object.
	 * @return array|WP_Error Associative array of responses keyed by identifier, or WP_Error on batch failure.
	 */
	public function parse_response( $response, Data_Request $data_request ) {
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$results = $this->request_errors;

		if ( is_array( $response ) ) {
			foreach ( $response as $identifier => $single_response ) {
				$normalized_identifier             = $this->normalize_response_identifier( $identifier );
				$results[ $normalized_identifier ] = $this->parse_single_response( $single_response );
			}
		}

		// Preserve the original request ordering and ensure all identifiers are represented.
		$ordered_results = array();
		foreach ( $this->request_identifiers as $identifier ) {
			if ( array_key_exists( $identifier, $results ) ) {
				$ordered_results[ $identifier ] = $results[ $identifier ];
			} else {
				$ordered_results[ $identifier ] = new WP_Error(
					'searchanalytics_batch_missing_response',
					__( 'Missing response from Search Console.', 'google-site-kit' )
				);
			}
		}

		// Append any unexpected identifiers returned by the API.
		foreach ( $results as $identifier => $single_result ) {
			if ( array_key_exists( $identifier, $ordered_results ) ) {
				continue;
			}

			$ordered_results[ $identifier ] = $single_result;
		}

		return $ordered_results;
	}

	/**
	 * Parses a single batch response.
	 *
	 * @since 1.170.0
	 *
	 * @param mixed $response Single response.
	 * @return array|WP_Error Parsed rows or WP_Error.
	 */
	private function parse_single_response( $response ) {
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		if ( $response instanceof Google_Service_Exception ) {
			return $this->exception_to_error( $response );
		}

		return $this->parse_search_analytics_rows( $response );
	}

	/**
	 * Normalizes a request identifier to a string.
	 *
	 * @since 1.170.0
	 *
	 * @param array $request_data Request data.
	 * @return string Normalized identifier.
	 * @throws Missing_Required_Param_Exception When the identifier is missing or invalid.
	 */
	private function normalize_identifier( array $request_data ) {
		if ( isset( $request_data['identifier'] ) ) {
			$identifier = $request_data['identifier'];
		} elseif ( isset( $request_data['id'] ) ) {
			$identifier = $request_data['id'];
		} else {
			throw new Missing_Required_Param_Exception( 'identifier' );
		}

		if ( ! is_scalar( $identifier ) ) {
			throw new Missing_Required_Param_Exception( 'identifier' );
		}

		$identifier = (string) $identifier;

		if ( '' === $identifier ) {
			throw new Missing_Required_Param_Exception( 'identifier' );
		}

		return $identifier;
	}

	/**
	 * Normalizes a response identifier to align with requested keys.
	 *
	 * @since 1.170.0
	 *
	 * @param string|int $identifier Raw response identifier.
	 * @return string|int Normalized identifier.
	 */
	private function normalize_response_identifier( $identifier ) {
		if ( is_string( $identifier ) && 0 === strpos( $identifier, 'response-' ) ) {
			$identifier = substr( $identifier, strlen( 'response-' ) );
		}

		return $identifier;
	}

	/**
	 * Converts an exception to a WP_Error instance.
	 *
	 * @since 1.170.0
	 *
	 * @param Exception $exception Exception instance.
	 * @return WP_Error WP_Error instance.
	 */
	private function exception_to_error( Exception $exception ) {
		$status = (int) ( $exception->getCode() ?: 500 );

		return new WP_Error(
			'searchanalytics_batch_request_failed',
			$exception->getMessage(),
			array( 'status' => $status )
		);
	}
}
