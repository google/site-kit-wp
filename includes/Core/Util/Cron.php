<?php
/**
 * Class Google\Site_Kit\Core\Util\Cron
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Core\REST_API\REST_Routes;

/**
 * Class to manage cron.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Cron {

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		// Schedules Site Kit Cron Daily.
		if ( ! wp_next_scheduled( 'googlesitekit_cron_daily', array( 'interval' => 'daily' ) ) ) {
			wp_schedule_event( time(), 'daily', 'googlesitekit_cron_daily', array( 'interval' => 'daily' ) );
		}

		// Schedules Site Kit Cron Hourly.
		if ( ! wp_next_scheduled( 'googlesitekit_cron_hourly', array( 'interval' => 'hourly' ) ) ) {
			wp_schedule_event( time(), 'hourly', 'googlesitekit_cron_hourly', array( 'interval' => 'hourly' ) );
		}

		add_action( 'googlesitekit_cron_daily', array( $this, 'googlesitekit_cron_action' ) );
		add_action( 'googlesitekit_cron_hourly', array( $this, 'googlesitekit_cron_action' ) );
		add_action( 'googlesitekit_deactivation', array( $this, 'clear_googlesitekit_cron_event' ) );
	}

	/**
	 * Runs cron event task.
	 *
	 * @since 1.0.0
	 *
	 * @param string $interval Daily or hourly. default: hourly.
	 */
	public function googlesitekit_cron_action( $interval ) {

		if ( 'daily' === $interval ) {
			/**
			 * Filters the array list of request params to be sent to rest api as batch request.
			 *
			 * @param array $requests List of of request params. The request arrays need to have these keys
			 *                        'dataObject', 'identifier', 'datapoint'.
			 *
			 * @since 1.0.0
			 */
			$requests = apply_filters( 'googlesitekit_cron_daily_requests', array() );
			$max_age  = DAY_IN_SECONDS;
		} else {
			// Runs cron hourly.
			/**
			 * Filters the array list of request params to be sent to rest api as batch request.
			 *
			 * @param array $requests List of of request params. The request arrays need to have these keys
			 *                        'dataObject', 'identifier', 'datapoint'.
			 *
			 * @since 1.0.0
			 */
			$requests = apply_filters( 'googlesitekit_cron_hourly_requests', array() );
			$max_age  = HOUR_IN_SECONDS;
		}

		// Filters and validates requests.
		$requests = $this->validate_array_requests( $requests );

		$requests = array_map(
			function ( $element ) use ( $max_age ) {
				$element['key']    = implode( '::', array( $element['identifier'], $element['datapoint'] ) );
				$element['maxAge'] = $max_age;

				return $element;
			},
			$requests
		);

		$endpoint = '/' . REST_Routes::REST_ROOT . '/data';

		$this->request_internal_rest_api( $endpoint, $requests );
	}

	/**
	 * Clears custom cron events, executed during plugin deactivation.
	 *
	 * @since 1.0.0
	 */
	public function clear_googlesitekit_cron_event() {
		// Clear hourly cron event.
		$timestamp = wp_next_scheduled( 'googlesitekit_cron_hourly', array( 'interval' => 'hourly' ) );
		if ( $timestamp ) {
			wp_unschedule_event( $timestamp, 'googlesitekit_cron_hourly', array( 'interval' => 'hourly' ) );
		}

		// Clear daily cron event.
		$timestamp = wp_next_scheduled( 'googlesitekit_cron_daily', array( 'interval' => 'daily' ) );
		if ( $timestamp ) {
			wp_unschedule_event( $timestamp, 'googlesitekit_cron_daily', array( 'interval' => 'daily' ) );
		}
	}

	/**
	 * Requests to internal WordPress REST API.
	 *
	 * @since 1.0.0
	 *
	 * @param string $endpoint REST API Endpoint.
	 * @param array  $request_params Request params to send to rest api.
	 *
	 * @return array Response data from the REST API request.
	 */
	private function request_internal_rest_api( $endpoint, $request_params ) {
		$request = new \WP_REST_Request( 'GET', $endpoint );
		$request->set_query_params(
			array(
				'request' => wp_json_encode( $request_params ),
			)
		);
		$response = \rest_do_request( $request );
		$server   = \rest_get_server();
		$data     = $server->response_to_data( $response, false );

		return $data;
	}

	/**
	 * Validates array request, check if identifier and datapoint key are exist.
	 *
	 * @since 1.0.0
	 *
	 * @param array $request List of array to be validated.
	 *
	 * @return array Validated array.
	 */
	private function validate_array_requests( $request ) {
		return array_filter(
			$request,
			function ( $request ) {
				return isset( $request['identifier'] ) && isset( $request['datapoint'] );
			}
		);
	}
}
