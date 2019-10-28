<?php
/**
 * FakeModule
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit_Dependencies\Google_Client;
use Psr\Http\Message\RequestInterface;
use WP_Error;

class FakeModule extends Module {

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
	 * Returns the mapping between available datapoints and their services.
	 *
	 * @return array Associative array of $datapoint => $service_identifier pairs.
	 * @since 1.0.0
	 *
	 */
	protected function get_datapoint_services() {
		return array(
			'test-request' => '',
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
					return wp_json_encode( compact( 'method', 'datapoint', 'data' ) );
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
	 * @param Google_Client $client Google client instance.
	 *
	 * @return array Google services as $identifier => $service_instance pairs. Every $service_instance must be an
	 *               instance of Google_Service.
	 * @since 1.0.0
	 *
	 */
	protected function setup_services( Google_Client $client ) {
		return array();
	}
}
