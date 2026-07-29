<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Get_CTAs
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
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;

/**
 * Class for the CTAs retrieval datapoint.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Get_CTAs extends Datapoint implements Executable_Datapoint {

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object.
	 * @throws Missing_Required_Param_Exception Thrown if a required parameter is missing.
	 */
	public function create_request( Data_Request $data_request ) {
		foreach ( array( 'organizationID', 'publicationID' ) as $required_param ) {
			if ( empty( $data_request[ $required_param ] ) ) {
				throw new Missing_Required_Param_Exception( $required_param );
			}
		}

		$parent = sprintf(
			'organizations/%s/publications/%s',
			$data_request['organizationID'],
			$data_request['publicationID']
		);

		return $this->get_service()->organizations_publications_ctas->listOrganizationsPublicationsCtas( $parent );
	}

	/**
	 * Parses a response.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed        $response List CTAs response.
	 * @param Data_Request $data     Data request object.
	 * @return array CTA resources.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return array_values( (array) $response->getCtas() );
	}
}
