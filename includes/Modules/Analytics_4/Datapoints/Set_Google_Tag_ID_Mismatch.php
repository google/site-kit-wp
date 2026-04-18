<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Set_Google_Tag_ID_Mismatch
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

/**
 * Class for the Google Tag ID mismatch setting datapoint.
 *
 * @since 1.177.0
 * @access private
 * @ignore
 */
class Set_Google_Tag_ID_Mismatch extends Datapoint implements Executable_Datapoint {

	/**
	 * Transients instance.
	 *
	 * @since 1.177.0
	 * @var Transients
	 */
	private $transients;

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
	}

	/**
	 * Creates a request object.
	 *
	 * @since 1.177.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return callable Closure that sets or deletes the tag ID mismatch transient.
	 * @throws Missing_Required_Param_Exception Thrown if a required parameter is missing.
	 */
	public function create_request( Data_Request $data_request ) {
		if ( ! isset( $data_request['hasMismatchedTag'] ) ) {
			throw new Missing_Required_Param_Exception( 'hasMismatchedTag' );
		}

		if ( false === $data_request['hasMismatchedTag'] ) {
			return function () {
				$this->transients->delete( 'googlesitekit_inline_tag_id_mismatch' );
				return false;
			};
		}

		return function () use ( $data_request ) {
			$this->transients->set( 'googlesitekit_inline_tag_id_mismatch', $data_request['hasMismatchedTag'] );
			return $data_request['hasMismatchedTag'];
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
