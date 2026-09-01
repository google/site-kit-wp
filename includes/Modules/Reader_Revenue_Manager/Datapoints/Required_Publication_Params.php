<?php
/**
 * Trait Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Required_Publication_Params
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;

/**
 * Trait for requiring organization and publication IDs on a datapoint request.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Required_Publication_Params {

	/**
	 * Gets the organization and publication IDs from the request.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return array {
	 *     Required publication identifiers.
	 *
	 *     @type string $organization_id Organization ID.
	 *     @type string $publication_id  Publication ID.
	 * }
	 * @throws Missing_Required_Param_Exception Thrown if a required parameter is missing or empty.
	 */
	protected function get_required_publication_params( Data_Request $data_request ) {
		if ( empty( $data_request['organizationID'] ) ) {
			throw new Missing_Required_Param_Exception( 'organizationID' );
		}

		if ( empty( $data_request['publicationID'] ) ) {
			throw new Missing_Required_Param_Exception( 'publicationID' );
		}

		return array(
			'organization_id' => $data_request['organizationID'],
			'publication_id'  => $data_request['publicationID'],
		);
	}
}
