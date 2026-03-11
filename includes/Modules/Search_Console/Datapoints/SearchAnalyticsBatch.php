<?php
/**
 * Class Google\Site_Kit\Modules\Search_Console\Datapoints\SearchAnalyticsBatch
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
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole\SearchAnalyticsQueryResponse;
use WP_Error;

/**
 * Datapoint class for Search Console search analytics batch requests.
 *
 * @since 1.170.0
 * @access private
 * @ignore
 */
class SearchAnalyticsBatch extends Datapoint implements Executable_Datapoint {

	const REQUEST_METHODS = array( 'POST' );
	const REST_METHODS    = array( 'POST' );
	const DATAPOINT       = 'searchanalytics-batch';

	/**
	 * Callback to obtain the Search Console service.
	 *
	 * @since 1.170.0
	 * @var callable|Closure
	 */
	private $get_service;

	/**
	 * Callback to prepare single search analytics request arguments.
	 *
	 * @since 1.170.0
	 * @var callable|Closure
	 */
	private $prepare_args;

	/**
	 * Callback to build a search analytics request.
	 *
	 * @since 1.170.0
	 * @var callable|Closure
	 */
	private $create_request;

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
	 *
	 * @param array $definition Datapoint definition.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );

		$this->get_service    = isset( $definition['get_service'] ) ? $definition['get_service'] : null;
		$this->prepare_args   = isset( $definition['prepare_args'] ) ? $definition['prepare_args'] : null;
		$this->create_request = isset( $definition['create_request'] ) ? $definition['create_request'] : null;
	}

	/**
	 * Creates a request object.
	 *
	 * @since 1.170.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return callable|WP_Error Callable to execute the batch request, or WP_Error.
	 * @throws Missing_Required_Param_Exception Thrown when required parameters are missing.
	 */
	public function create_request( Data_Request $data_request ) {
		$requests = isset( $data_request->data['requests'] ) ? $data_request->data['requests'] : null;

		if ( empty( $requests ) || ! is_array( $requests ) ) {
			throw new Missing_Required_Param_Exception( 'requests' );
		}

		$this->request_identifiers = array();
		$this->request_errors      = array();

		$service            = $this->get_searchconsole_service();
		$batch              = $service->createBatch();
		$has_valid_requests = false;

		foreach ( $requests as $request_data ) {
			$identifier                  = $this->normalize_identifier( $request_data );
			$this->request_identifiers[] = $identifier;

			try {
				$args = $this->prepare_request_args( $request_data );
				if ( is_wp_error( $args ) ) {
					$this->request_errors[ $identifier ] = $args;
					continue;
				}

				$single_request = $this->build_single_request( $args );

				if ( is_wp_error( $single_request ) ) {
					$this->request_errors[ $identifier ] = $single_request;
					continue;
				}

				$batch->add( $single_request, $identifier );
				$has_valid_requests = true;
			} catch ( Exception $exception ) {
				$this->request_errors[ $identifier ] = $this->exception_to_error( $exception );
			}
		}

		if ( empty( $this->request_identifiers ) ) {
			return new WP_Error(
				'missing_required_param',
				/* translators: %s: Missing parameter name */
				sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'requests' ),
				array( 'status' => 400 )
			);
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

		if ( $response instanceof SearchAnalyticsQueryResponse ) {
			return $response->getRows();
		}

		if ( is_object( $response ) && method_exists( $response, 'getRows' ) ) {
			return $response->getRows();
		}

		return $response;
	}

	/**
	 * Builds a single request.
	 *
	 * @since 1.170.0
	 *
	 * @param array $args Prepared request arguments.
	 * @return mixed Request instance or WP_Error.
	 */
	private function build_single_request( array $args ) {
		if ( ! is_callable( $this->create_request ) ) {
			return new WP_Error(
				'invalid_request_callback',
				__( 'Invalid Search Console request callback.', 'google-site-kit' )
			);
		}

		return call_user_func( $this->create_request, $args );
	}

	/**
	 * Prepares request arguments for a single search analytics request.
	 *
	 * @since 1.170.0
	 *
	 * @param array $request_data Raw request data.
	 * @return array|WP_Error Prepared arguments or WP_Error.
	 */
	private function prepare_request_args( array $request_data ) {
		if ( ! is_callable( $this->prepare_args ) ) {
			return new WP_Error(
				'invalid_request_args_callback',
				__( 'Invalid Search Console request arguments.', 'google-site-kit' )
			);
		}

		return call_user_func( $this->prepare_args, $request_data );
	}

	/**
	 * Gets the Search Console service instance.
	 *
	 * @since 1.170.0
	 *
	 * @return Google_Service_SearchConsole Search Console service instance.
	 * @throws Missing_Required_Param_Exception When the service callback is missing.
	 */
	private function get_searchconsole_service() {
		if ( is_callable( $this->get_service ) ) {
			return call_user_func( $this->get_service );
		}

		throw new Missing_Required_Param_Exception( 'service' );
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
