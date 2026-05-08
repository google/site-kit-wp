<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Set_Is_Web_Data_Stream_Unavailable
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\Modules\Datapoint;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Modules\Analytics_4\Settings;

/**
 * Class for the web data stream unavailable status datapoint.
 *
 * @since 1.177.0
 * @access private
 * @ignore
 */
class Set_Is_Web_Data_Stream_Unavailable extends Datapoint implements Executable_Datapoint {

	/**
	 * Transients instance.
	 *
	 * @since 1.177.0
	 * @var Transients
	 */
	private $transients;

	/**
	 * Analytics settings instance.
	 *
	 * @since 1.177.0
	 * @var Settings
	 */
	private $settings;

	/**
	 * Constructor.
	 *
	 * @since 1.177.0
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		$this->transients = $definition['transients'];
		$this->settings   = $definition['settings'];
	}

	/**
	 * Creates a request object.
	 *
	 * @since 1.177.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return callable Closure that sets or deletes the web data stream unavailable transient.
	 * @throws Missing_Required_Param_Exception Thrown if a required parameter is missing.
	 */
	public function create_request( Data_Request $data_request ) {
		if ( ! isset( $data_request['isWebDataStreamUnavailable'] ) ) {
			throw new Missing_Required_Param_Exception( 'isWebDataStreamUnavailable' );
		}

		if ( true === $data_request['isWebDataStreamUnavailable'] ) {
			return function () {
				$settings      = $this->settings->get();
				$transient_key = 'googlesitekit_web_data_stream_unavailable_' . $settings['webDataStreamID'];
				$this->transients->set( $transient_key, true );
				return true;
			};
		}

		return function () {
			$settings      = $this->settings->get();
			$transient_key = 'googlesitekit_web_data_stream_unavailable_' . $settings['webDataStreamID'];
			$this->transients->delete( $transient_key );
			return false;
		};
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.177.0
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data     Data request object.
	 * @return mixed The response without any modifications.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}
}
