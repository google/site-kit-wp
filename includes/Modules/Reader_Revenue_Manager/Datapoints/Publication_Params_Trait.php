<?php
/**
 * Trait Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Publication_Params_Trait
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;

/**
 * Trait for datapoints that take the publication identifiers in the request.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Publication_Params_Trait {

	/**
	 * Builds the publication resource name from the request identifiers.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return string Publication resource name.
	 * @throws Missing_Required_Param_Exception Thrown if either identifier is missing or empty.
	 * @throws Invalid_Param_Exception          Thrown if either identifier is not a string.
	 */
	protected function get_publication_name( Data_Request $data_request ) {
		if ( empty( $data_request['organizationID'] ) ) {
			throw new Missing_Required_Param_Exception( 'organizationID' );
		}

		if ( ! is_string( $data_request['organizationID'] ) ) {
			throw new Invalid_Param_Exception( 'organizationID' );
		}

		if ( empty( $data_request['publicationID'] ) ) {
			throw new Missing_Required_Param_Exception( 'publicationID' );
		}

		if ( ! is_string( $data_request['publicationID'] ) ) {
			throw new Invalid_Param_Exception( 'publicationID' );
		}

		return sprintf(
			'organizations/%s/publications/%s',
			$data_request['organizationID'],
			$data_request['publicationID']
		);
	}
}
