<?php
/**
 * FakeModule
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\Modules\Module_With_Activation;
use Google\Site_Kit\Core\Modules\Module_With_Deactivation;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Psr\Http\Message\RequestInterface;
use WP_Error;
use Exception;

class FakeModule extends Module
	implements Module_With_Activation, Module_With_Deactivation {

	/**
	 * Whether or not the module has been registered.
	 *
	 * @var bool
	 */
	protected $is_registered = false;

	/**
	 * Callback to invoke on activation.
	 *
	 * @var callable
	 */
	protected $on_activation_callback;

	/**
	 * Callback to invoke on deactivation.
	 *
	 * @var callable
	 */
	protected $on_deactivation_callback;

	/**
	 * @return bool
	 */
	public function is_registered() {
		return (bool) $this->is_registered;
	}

	/**
	 * Activation handler.
	 */
	public function on_activation() {
		if ( $this->on_activation_callback ) {
			call_user_func_array( $this->on_activation_callback, func_get_args() );
		}
	}

	/**
	 * Deactivation handler.
	 */
	public function on_deactivation() {
		if ( $this->on_deactivation_callback ) {
			call_user_func_array( $this->on_deactivation_callback, func_get_args() );
		}
	}

	/**
	 * Setter for force activation property.
	 *
	 * @param bool $value New value
	 */
	public function set_force_active( $value ) {
		$this->force_active = (bool) $value;
	}

	/**
	 * Setter for on_activation_callback.
	 *
	 * @param callable $callback
	 */
	public function set_on_activation_callback( callable $callback ) {
		$this->on_activation_callback = $callback;
	}

	/**
	 * Setter for on_deactivation_callback.
	 *
	 * @param callable $callback
	 */
	public function set_on_deactivation_callback( callable $callback ) {
		$this->on_deactivation_callback = $callback;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		$this->is_registered = true;
	}

	/**
	 * Gets map of datapoint to definition data for each.
	 *
	 * @since 1.12.0
	 *
	 * @return array Map of datapoints to their definitions.
	 */
	protected function get_datapoint_definitions() {
		return array(
			'GET:test-request' => array( 'service' => '' ),
		);
	}

	/**
	 * Creates a request object for the given datapoint.
	 *
	 * @since 1.0.0
	 *
	 * @param Data_Request $data Data request object.
	 *
	 * @return RequestInterface|callable|WP_Error Request object or callable on success, or WP_Error on failure.
	 */
	protected function create_data_request( Data_Request $data ) {
		$method    = $data->method;
		$datapoint = $data->datapoint;

		switch ( "$method:$datapoint" ) {
			case 'GET:test-request':
				return function () use ( $method, $datapoint, $data ) {
					$data = $data->data;
					return json_encode( compact( 'method', 'datapoint', 'data' ) );
				};
		}

		return function () {
		};
	}

	/**
	 * Parses a response for the given datapoint.
	 *
	 * @since 1.0.0
	 *
	 * @param Data_Request $data Data request object.
	 * @param mixed $response Request response.
	 *
	 * @return mixed Parsed response data on success, or WP_Error on failure.
	 */
	protected function parse_data_response( Data_Request $data, $response ) {
		$method    = $data->method;
		$datapoint = $data->datapoint;

		switch ( "$method:$datapoint" ) {
			case 'GET:test-request':
				return json_decode( $response, $data['asArray'] );
		}

		return '';
	}

	/**
	 * Sets up information about the module.
	 *
	 * @return array Associative array of module info.
	 * @since 1.0.0
	 *
	 */
	protected function setup_info() {
		return array(
			'slug' => 'fake-module',
		);
	}

	/**
	 * Sets up the Google services the module should use.
	 *
	 * This method is invoked once by {@see Module::get_service()} to lazily set up the services when one is requested
	 * for the first time.
	 *
	 * @param Google_Site_Kit_Client $client Google client instance.
	 *
	 * @return array Google services as $identifier => $service_instance pairs. Every $service_instance must be an
	 *               instance of Google_Service.
	 * @since 1.0.0
	 *
	 */
	protected function setup_services( Google_Site_Kit_Client $client ) {
		return array();
	}

	/**
	 * Transforms an exception into a WP_Error object.
	 *
	 * @since 1.0.0
	 *
	 * @param Exception $e         Exception object.
	 * @param string    $datapoint Datapoint originally requested.
	 * @return WP_Error WordPress error object.
	 */
	public function exception_to_error( Exception $e, $datapoint ) { // phpcs:ignore Generic.CodeAnalysis.UselessOverridingMethod
		return parent::exception_to_error( $e, $datapoint );
	}


	/**
	 * Parses a date range string into a start date and an end date.
	 *
	 * @since 1.0.0
	 *
	 * @param string $range         Date range string. Either 'last-7-days', 'last-14-days', 'last-90-days', or
	 *                              'last-28-days' (default).
	 * @param string $multiplier    Optional. How many times the date range to get. This value can be specified if the
	 *                              range should be request multiple times back. Default 1.
	 * @param int    $offset        Days the range should be offset by. Default 1. Used by Search Console where
	 *                              data is delayed by two days.
	 * @param bool   $previous      Whether to select the previous period. Default false.
	 * @param bool   $weekday_align Whether to align the previous period days of the week to current period. Default false.
	 *
	 * @return array List with two elements, the first with the start date and the second with the end date, both as
	 *               'Y-m-d'.
	 */
	public function parse_date_range( $range, $multiplier = 1, $offset = 1, $previous = false, $weekday_align = false ) { // phpcs:ignore Generic.CodeAnalysis.UselessOverridingMethod
		return parent::parse_date_range( $range, $multiplier, $offset, $previous, $weekday_align );
	}
}
