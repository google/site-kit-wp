<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Create_Conversion_Insight
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Events_Provider;
use Google\Site_Kit\Core\Modules\Schema_Aware_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use Google\Site_Kit\Core\Util\Date;
use Google\Site_Kit\Modules\Analytics_4\Site_Goals\Insight_Payload_Builder;
use WP_Error;

/**
 * Class for the `POST:conversion-insights` datapoint, which asks the Site Kit
 * service for the Site Goals insight of a widget, or of one of its tabs.
 *
 * The browser sends only the goal type, the tab and the end date. The site
 * builds the numbers the insight is written from, so the model only ever
 * reads the site's own Analytics data.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Create_Conversion_Insight extends Conversion_Insights_Datapoint implements Schema_Aware_Datapoint {

	/**
	 * The longest tab the datapoint accepts. Analytics keeps at most 500
	 * characters of an event parameter value, so no form ID or event provider
	 * is longer.
	 *
	 * @since n.e.x.t
	 */
	const MAX_TAB_LENGTH = 500;

	/**
	 * The statuses of a refused request for the insight that the browser acts
	 * on. The service refuses a request for the insight with a 400, a 403, a
	 * 409, a 429 or a 503, and any other failure is a 500.
	 *
	 * @since n.e.x.t
	 */
	const PASSED_ERROR_STATUSES = array( 400, 403, 409, 429, 503 );

	/**
	 * Insight_Payload_Builder instance.
	 *
	 * @since n.e.x.t
	 * @var Insight_Payload_Builder
	 */
	private $payload_builder;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $definition Definition fields, with the `google_proxy` and the `credentials` callbacks that return what reaches the service, and the Analytics `module` that runs the reports.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );

		$this->payload_builder = new Insight_Payload_Builder( $definition['module'] );
	}

	/**
	 * Gets the schema of the parameters the datapoint accepts.
	 *
	 * The schema has no `maxLength` for `tab` and no `pattern` for `endDate`,
	 * because WordPress checks those only from version 5.5. `create_request()`
	 * checks both instead.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Map of parameter names to their schemas.
	 */
	public function get_args_schema() {
		return array(
			'goalType' => array(
				'type'     => 'string',
				'enum'     => array( Conversion_Events_Provider::CATEGORY_LEAD, Conversion_Events_Provider::CATEGORY_ECOMMERCE ),
				'required' => true,
			),
			'tab'      => array(
				'type'    => 'string',
				'default' => '',
			),
			'endDate'  => array(
				'type'     => 'string',
				'required' => true,
			),
		);
	}

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return callable Closure that asks the service for the insight. It returns the ID of the operation that generates the insight as `operationID`, the insight as `insight` when the service had one in its cache, `insight` as null when there is no insight to write, or an error.
	 * @throws Invalid_Param_Exception Thrown when `tab` is longer than 500 characters, or `endDate` isn't a real day.
	 */
	public function create_request( Data_Request $data_request ) {
		$goal_type = $data_request['goalType'];
		$tab       = $data_request['tab'];
		$end_date  = $data_request['endDate'];

		if ( mb_strlen( $tab ) > self::MAX_TAB_LENGTH ) {
			throw new Invalid_Param_Exception( 'tab' );
		}

		if ( ! Date::is_valid_date( $end_date ) ) {
			throw new Invalid_Param_Exception( 'endDate' );
		}

		return function ( $client ) use ( $goal_type, $tab, $end_date ) {
			$entry = $this->payload_builder->build( $goal_type, $tab, $end_date );

			if ( is_wp_error( $entry ) ) {
				return $this->get_report_error( $entry );
			}

			// Analytics has found no event of the goal type, or neither period
			// has a conversion, so there is nothing to write an insight about.
			if ( null === $entry ) {
				return array( 'insight' => null );
			}

			$access_token = $this->get_access_token( $client );

			if ( is_wp_error( $access_token ) ) {
				return $access_token;
			}

			$response = $this->get_google_proxy()->send_conversion_insight_request(
				$this->get_credentials(),
				$access_token,
				array( 'events' => array( $entry ) ),
				get_user_locale()
			);

			if ( is_wp_error( $response ) ) {
				return $this->get_error( $response );
			}

			// The service answers from its cache with the insight, when it
			// wrote one for the same entry before, and with the operation that
			// writes it otherwise.
			if ( ! empty( $response['operation_id'] ) && is_string( $response['operation_id'] ) ) {
				return array( 'operationID' => $response['operation_id'] );
			}

			if ( isset( $response['scenario'] ) ) {
				$insight = $this->get_insight( $response );

				return is_wp_error( $insight ) ? $insight : array( 'insight' => $insight );
			}

			return $this->get_invalid_response_error();
		};
	}

	/**
	 * Gets the error the datapoint answers with when a report of the payload
	 * fails.
	 *
	 * The error keeps the code, the message and the data of the Analytics
	 * error. Its status is a 500 when Analytics answered with a 409 or a
	 * server error, such as a 503, so the browser doesn't take it for the
	 * service being busy and ask again, which would run the reports again.
	 *
	 * @since n.e.x.t
	 *
	 * @param WP_Error $error The error of the reports.
	 * @return WP_Error The error.
	 */
	private function get_report_error( WP_Error $error ) {
		$error_data = $error->get_error_data();

		$status = is_array( $error_data ) && isset( $error_data['status'] ) ? (int) $error_data['status'] : 0;

		if ( 409 !== $status && $status < 500 ) {
			return $error;
		}

		$error_data['status'] = 500;

		return new WP_Error( $error->get_error_code(), $error->get_error_message(), $error_data );
	}
}
