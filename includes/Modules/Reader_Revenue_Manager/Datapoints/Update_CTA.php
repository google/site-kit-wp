<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Update_CTA
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
 * Class for the CTA update datapoint.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Update_CTA extends Datapoint implements Executable_Datapoint {

	use Publication_Params_Trait;

	/**
	 * Creates a request object.
	 *
	 * Only the fields present in the data are written; every other field of
	 * the CTA is left unchanged.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object.
	 * @throws Missing_Required_Param_Exception Thrown if a required parameter is missing or empty.
	 * @throws Invalid_Param_Exception          Thrown if a parameter is invalid.
	 */
	public function create_request( Data_Request $data_request ) {
		$publication_name = $this->get_publication_name( $data_request );

		if ( empty( $data_request->data['ctaID'] ) ) {
			throw new Missing_Required_Param_Exception( 'ctaID' );
		}

		if ( empty( $data_request->data['data'] ) ) {
			throw new Missing_Required_Param_Exception( 'data' );
		}

		$cta_id   = $data_request['ctaID'];
		$cta_data = $data_request['data'];

		// The ID is a single path segment of the CTA's resource name.
		if ( ! is_string( $cta_id ) || false !== strpos( $cta_id, '/' ) ) {
			throw new Invalid_Param_Exception( 'ctaID' );
		}

		if ( ! is_array( $cta_data ) ) {
			throw new Invalid_Param_Exception( 'data' );
		}

		$cta         = new Cta();
		$update_mask = array();

		if ( array_key_exists( 'displayName', $cta_data ) ) {
			if ( ! is_string( $cta_data['displayName'] ) ) {
				throw new Invalid_Param_Exception( 'data.displayName' );
			}

			$cta->setDisplayName( $cta_data['displayName'] );
			$update_mask[] = 'displayName';
		}

		if ( array_key_exists( 'state', $cta_data ) ) {
			$allowed_states = array( Cta::STATE_ACTIVE, Cta::STATE_DRAFT );

			if ( ! is_string( $cta_data['state'] ) || ! in_array( $cta_data['state'], $allowed_states, true ) ) {
				throw new Invalid_Param_Exception( 'data.state' );
			}

			$cta->setState( $cta_data['state'] );
			$update_mask[] = 'state';
		}

		if ( array_key_exists( 'config', $cta_data ) ) {
			$handlers = ( new CTA_Type_Handlers() )->get_handlers();
			$type     = isset( $cta_data['type'] ) && is_string( $cta_data['type'] ) ? $cta_data['type'] : '';

			if ( ! isset( $handlers[ $type ] ) ) {
				throw new Invalid_Param_Exception( 'data.type' );
			}

			if ( empty( $cta_data['config'] ) || ! is_array( $cta_data['config'] ) ) {
				throw new Invalid_Param_Exception( 'data.config' );
			}

			// The configuration is replaced as a whole, so the mask names the
			// configuration field rather than each of its own fields.
			$handlers[ $type ]->configure_cta( $cta, $cta_data['config'] );
			$update_mask[] = $handlers[ $type ]->get_config_field();
		}

		if ( empty( $update_mask ) ) {
			throw new Invalid_Param_Exception( 'data' );
		}

		$name = sprintf( '%s/ctas/%s', $publication_name, $cta_id );

		return $this->get_service()->organizations_publications_ctas->patch(
			$name,
			$cta,
			array( 'updateMask' => implode( ',', $update_mask ) )
		);
	}

	/**
	 * Parses a response.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed        $response Updated CTA resource.
	 * @param Data_Request $data     Data request object.
	 * @return mixed The updated CTA resource.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}
}
