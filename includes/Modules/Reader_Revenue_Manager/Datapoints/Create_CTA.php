<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Create_CTA
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
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\CTA\CTA_Type_Handlers;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\Cta;

/**
 * Class for the CTA creation datapoint.
 *
 * @since 1.187.0
 * @access private
 * @ignore
 */
class Create_CTA extends Datapoint implements Executable_Datapoint {

	use Publication_Params_Trait;

	/**
	 * Creates a request object.
	 *
	 * @since 1.187.0
	 * @since 1.189.0 Added support for the CTA `state` property.
	 * @since 1.193.0 Requires the publication identifiers in the request.
	 * @since n.e.x.t Uses the shared CTA type handlers.
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object.
	 * @throws Missing_Required_Param_Exception Thrown if a required parameter is missing or empty.
	 * @throws Invalid_Param_Exception          Thrown if a parameter is invalid.
	 */
	public function create_request( Data_Request $data_request ) {
		if ( empty( $data_request->data['data'] ) ) {
			throw new Missing_Required_Param_Exception( 'data' );
		}

		$cta_data = $data_request['data'];

		if ( ! is_array( $cta_data ) ) {
			throw new Invalid_Param_Exception( 'data' );
		}

		$handlers = ( new CTA_Type_Handlers() )->get_handlers();
		$type     = isset( $cta_data['type'] ) && is_string( $cta_data['type'] ) ? $cta_data['type'] : '';

		if ( ! isset( $handlers[ $type ] ) ) {
			throw new Invalid_Param_Exception( 'data.type' );
		}

		if ( empty( $cta_data['config'] ) || ! is_array( $cta_data['config'] ) ) {
			throw new Invalid_Param_Exception( 'data.config' );
		}

		if ( isset( $cta_data['displayName'] ) && ! is_string( $cta_data['displayName'] ) ) {
			throw new Invalid_Param_Exception( 'data.displayName' );
		}

		$allowed_states = array( Cta::STATE_ACTIVE, Cta::STATE_DRAFT );

		if ( empty( $cta_data['state'] ) ) {
			throw new Missing_Required_Param_Exception( 'data.state' );
		}

		if ( ! is_string( $cta_data['state'] ) || ! in_array( $cta_data['state'], $allowed_states, true ) ) {
			throw new Invalid_Param_Exception( 'data.state' );
		}

		$cta = new Cta();

		$handlers[ $type ]->configure_cta( $cta, $cta_data['config'] );

		$cta->setState( $cta_data['state'] );

		if ( ! empty( $cta_data['displayName'] ) ) {
			$cta->setDisplayName( $cta_data['displayName'] );
		}

		$parent = $this->get_publication_name( $data_request );

		return $this->get_service()->organizations_publications_ctas->create( $parent, $cta );
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.187.0
	 *
	 * @param mixed        $response Created CTA resource.
	 * @param Data_Request $data     Data request object.
	 * @return mixed The created CTA resource.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}
}
