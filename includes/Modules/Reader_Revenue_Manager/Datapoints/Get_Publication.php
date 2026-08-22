<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Get_Publication
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
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Publication_Normalizer;

/**
 * Class for the publication retrieval datapoint.
 *
 * @since 1.186.0
 * @access private
 * @ignore
 */
class Get_Publication extends Datapoint implements Executable_Datapoint {
	use Required_Publication_Params;

	/**
	 * Creates a request object.
	 *
	 * @since 1.186.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object.
	 * @throws Missing_Required_Param_Exception Thrown if a required parameter is missing or empty.
	 */
	public function create_request( Data_Request $data_request ) {
		$params = $this->get_required_publication_params( $data_request );

		$name = sprintf(
			'organizations/%s/publications/%s',
			$params['organization_id'],
			$params['publication_id']
		);

		return $this->get_service()->organizations_publications->get( $name );
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.186.0
	 *
	 * @param mixed        $response Publication resource.
	 * @param Data_Request $data     Data request object.
	 * @return mixed Normalized publication resource.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return Publication_Normalizer::normalize( $response );
	}
}
