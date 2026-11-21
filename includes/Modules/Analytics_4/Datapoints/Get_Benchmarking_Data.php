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

use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\Modules\Permission_Aware_Datapoint;
use Google\Site_Kit\Core\Modules\Shareable_Datapoint;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Core\Util\Date;
use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Insight_Payload;
use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Response_Builder;
use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Response_Encoder;
use WP_Error;

/**
 * Class for the benchmarking data datapoint.
 *
 * The Traffic overview tab reads all of its benchmarking data from this one
 * request, so the tab has one loading state and one error state for it.
 *
 * @since 1.190.0
 * @access private
 * @ignore
 */
class Get_Benchmarking_Data extends Shareable_Datapoint implements Executable_Datapoint, Permission_Aware_Datapoint {

	/**
	 * Response builder instance.
	 *
	 * @since 1.190.0
	 * @var Response_Builder
	 */
	private $response_builder;

	/**
	 * Constructor.
	 *
	 * @since 1.190.0
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		$this->response_builder = new Response_Builder( $definition['module'], $definition['custom_dimensions_data_available'] );
	}

	/**
	 * Creates a request object.
	 *
	 * The two dates are the only parameters the response depends on. The
	 * analysis is site-wide, so there is no per-page version of it to ask for.
	 *
	 * A period of any length is accepted, so the Traffic overview tab never
	 * fails for the range the user picked. Each part of the response shows once
	 * the site's history is long enough for it, as `Typical_Traffic_Availability`
	 * decides, and the insight is requested only for a period the service writes
	 * one for, as `Insight_Request_Builder` decides.
	 *
	 * @since 1.190.0
	 * @since 1.192.0 The longest period it accepts changed from 197 days to 90.
	 * @since n.e.x.t With the `trafficInsights` feature, the response also carries the locale and the signed request of the generated insight.
	 * @since n.e.x.t Accepts a period of any length.
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return callable|WP_Error Closure returning the encoded response, or an error for an invalid date or for a `startDate` later than `endDate`.
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
			if ( ! Date::is_valid_date( $value ) ) {
				return $this->invalid_param_error(
					sprintf(
						/* translators: %s: Request parameter name */
						__( 'Request parameter is not a date in the YYYY-MM-DD format: %s.', 'google-site-kit' ),
						$name
					)
				);
			}
		}

		// Both dates are zero-padded `YYYY-MM-DD` once they pass the check above,
		// so a string comparison orders them.
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

			return ( new Response_Encoder() )->encode( $this->with_insight_payload( $response ) );
		};
	}

	/**
	 * Replaces the request of the generated insight, when the response has
	 * one, with the payload the browser sends back to
	 * `POST:benchmarking-insight`, and adds the locale the insight is written
	 * in.
	 *
	 * The locale is the user's own, as WordPress names it, such as
	 * `de_DE_formal`. The service reads that form, and the browser keeps the
	 * insight it receives under the locale, so a change of language asks for
	 * a new insight.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $response The assembled response.
	 * @return array The response, with `insightLocale` and `insightPayload` in place of `insightRequest` when it has one.
	 */
	private function with_insight_payload( array $response ) {
		if ( ! array_key_exists( 'insightRequest', $response ) ) {
			return $response;
		}

		$locale  = get_user_locale();
		$request = $response['insightRequest'];

		unset( $response['insightRequest'] );

		$response['insightLocale']  = $locale;
		$response['insightPayload'] = is_array( $request )
			? Insight_Payload::encode( $request, $locale, get_current_user_id() )
			: null;

		return $response;
	}

	/**
	 * Builds the error an unusable date parameter answers with.
	 *
	 * @since 1.190.0
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
	 * @since 1.190.0
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
	 * The Traffic overview tab is part of the shared dashboard, so a view-only
	 * reader has to reach this datapoint.
	 *
	 * @since 1.190.0
	 *
	 * @return bool True if the current user can view the dashboard, false otherwise.
	 */
	public function permission_callback() {
		return current_user_can( Permissions::VIEW_DASHBOARD );
	}
}
