<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Get_CTA
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints;

use Google\Site_Kit\Core\Modules\Datapoint;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;

/**
 * Class for the single CTA retrieval datapoint.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Get_CTA extends Datapoint implements Executable_Datapoint {

	use Publication_Params_Trait;

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object.
	 * @throws Missing_Required_Param_Exception Thrown if an identifier is missing or empty.
	 * @throws Invalid_Param_Exception          Thrown if an identifier is not a string.
	 */
	public function create_request( Data_Request $data_request ) {
		$publication_name = $this->get_publication_name( $data_request );

		if ( empty( $data_request['ctaID'] ) ) {
			throw new Missing_Required_Param_Exception( 'ctaID' );
		}

		if ( ! is_string( $data_request['ctaID'] ) ) {
			throw new Invalid_Param_Exception( 'ctaID' );
		}

		$name = sprintf( '%s/ctas/%s', $publication_name, $data_request['ctaID'] );

		return $this->get_service()->organizations_publications_ctas->get( $name );
	}

	/**
	 * Parses a response.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed        $response CTA resource.
	 * @param Data_Request $data     Data request object.
	 * @return mixed CTA resource.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}
}
