<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Benchmarking_Data
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\Modules\Permission_Aware_Datapoint;
use Google\Site_Kit\Core\Modules\Shareable_Datapoint;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Response_Builder;
use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Response_Encoder;
use WP_Error;

/**
 * Class for the benchmarking data datapoint.
 *
 * Everything the Typical Traffic tab renders comes back from this one request,
 * so the tab has one loading state and one error state.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Get_Benchmarking_Data extends Shareable_Datapoint implements Executable_Datapoint, Permission_Aware_Datapoint {

	/**
	 * The shape a date parameter has to arrive in.
	 *
	 * The end is anchored with `\z` rather than `$`, which would also accept a
	 * date carrying a trailing newline.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	const DATE_PATTERN = '/\A(\d{4})-(\d{2})-(\d{2})\z/';

	/**
	 * Analytics 4 module instance.
	 *
	 * @since n.e.x.t
	 * @var Analytics_4
	 */
	private $module;

	/**
	 * Context instance.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Response builder instance.
	 *
	 * @since n.e.x.t
	 * @var Response_Builder
	 */
	private $response_builder;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		$this->module           = $definition['module'];
		$this->context          = $definition['context'];
		$this->response_builder = new Response_Builder( $this->context, $this->module );
	}

	/**
	 * Creates a request object.
	 *
	 * The two dates are the only parameters the response depends on. The
	 * analysis is site-wide, so there is no per-page version of it to ask for.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return callable|WP_Error Closure returning the encoded response, or an error for an invalid date.
	 * @throws Missing_Required_Param_Exception Thrown when `startDate` or `endDate` is missing.
	 */
	public function create_request( Data_Request $data_request ) {
		$start_date = $data_request['startDate'];
		$end_date   = $data_request['endDate'];

		if ( empty( $start_date ) ) {
			throw new Missing_Required_Param_Exception( 'startDate' );
		}

		if ( empty( $end_date ) ) {
			throw new Missing_Required_Param_Exception( 'endDate' );
		}

		foreach ( array(
			'startDate' => $start_date,
			'endDate'   => $end_date,
		) as $name => $value ) {
			if ( ! $this->is_valid_date( $value ) ) {
				return $this->invalid_param_error(
					sprintf(
						/* translators: %s: Request parameter name */
						__( 'Request parameter is not a date in the YYYY-MM-DD format: %s.', 'google-site-kit' ),
						$name
					)
				);
			}
		}

		// Both dates are zero-padded `YYYY-MM-DD` by the time they get here, so
		// a string comparison orders them.
		if ( $start_date > $end_date ) {
			return $this->invalid_param_error(
				__( 'Request parameter startDate must not be later than endDate.', 'google-site-kit' )
			);
		}

		return function () use ( $start_date, $end_date ) {
			$response = $this->response_builder->build( $start_date, $end_date );

			if ( is_wp_error( $response ) ) {
				return $response;
			}

			return ( new Response_Encoder() )->encode( $response );
		};
	}

	/**
	 * Checks whether a date parameter names a real day, written as `YYYY-MM-DD`.
	 *
	 * The parts are checked with `checkdate()` as well as with the pattern, so
	 * `2026-13-45` is rejected rather than rolled forward into another month.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $value The date parameter, as it arrived.
	 * @return bool True when the value names a real day, false otherwise.
	 */
	private function is_valid_date( $value ) {
		if ( ! is_string( $value ) || ! preg_match( self::DATE_PATTERN, $value, $matches ) ) {
			return false;
		}

		list( , $year, $month, $day ) = $matches;

		return checkdate( (int) $month, (int) $day, (int) $year );
	}

	/**
	 * Builds the error an unusable date parameter answers with.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $message Message naming what was wrong with the parameter.
	 * @return WP_Error The error, carrying a 400 status.
	 */
	private function invalid_param_error( $message ) {
		return new WP_Error( 'invalid_param', $message, array( 'status' => 400 ) );
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
	 * The Typical Traffic tab is part of the shared dashboard, so a view-only
	 * reader has to reach this datapoint.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if the current user can view the dashboard, false otherwise.
	 */
	public function permission_callback() {
		return current_user_can( Permissions::VIEW_DASHBOARD );
	}
}
