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
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Setting_Exception;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\CTA\CTA_Type_Handler_Interface;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\CTA\Newsletter_Signup_CTA_Type_Handler;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Cta;

/**
 * Class for the CTA creation datapoint.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Create_CTA extends Datapoint implements Executable_Datapoint {

	/**
	 * Reader Revenue Manager settings.
	 *
	 * @since n.e.x.t
	 * @var \Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings
	 */
	private $settings;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );

		$this->settings = $definition['settings'];
	}

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object.
	 * @throws Missing_Required_Param_Exception   Thrown if a required parameter is missing or empty.
	 * @throws Missing_Required_Setting_Exception Thrown if a fallback setting is missing.
	 * @throws Invalid_Param_Exception            Thrown if a parameter is invalid.
	 */
	public function create_request( Data_Request $data_request ) {
		if ( empty( $data_request->data['data'] ) ) {
			throw new Missing_Required_Param_Exception( 'data' );
		}

		$settings = $this->settings->get();

		$organization_id = $data_request['organizationID'] ?? $settings['organizationID'];
		$publication_id  = $data_request['publicationID'] ?? $settings['publicationID'];

		if ( empty( $organization_id ) ) {
			throw new Missing_Required_Setting_Exception( 'organizationID' );
		}

		if ( empty( $publication_id ) ) {
			throw new Missing_Required_Setting_Exception( 'publicationID' );
		}

		$cta_data = $data_request['data'];

		if ( ! is_array( $cta_data ) ) {
			throw new Invalid_Param_Exception( 'data' );
		}

		$handlers = $this->get_cta_type_handlers();
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

		$cta = new Cta();

		$handlers[ $type ]->configure_cta( $cta, $cta_data['config'] );

		if ( ! empty( $cta_data['displayName'] ) ) {
			$cta->setDisplayName( $cta_data['displayName'] );
		}

		$parent = sprintf(
			'organizations/%s/publications/%s',
			$organization_id,
			$publication_id
		);

		return $this->get_service()->organizations_publications_ctas->create( $parent, $cta );
	}

	/**
	 * Gets the supported CTA type handlers, keyed by CTA type.
	 *
	 * @since n.e.x.t
	 *
	 * @return CTA_Type_Handler_Interface[] CTA type handlers.
	 */
	private function get_cta_type_handlers() {
		$handlers = array();

		$type_handlers = array(
			new Newsletter_Signup_CTA_Type_Handler(),
			// Register additional CTA type handlers here as they are added.
		);

		foreach ( $type_handlers as $handler ) {
			$handlers[ $handler->get_type() ] = $handler;
		}

		return $handlers;
	}

	/**
	 * Parses a response.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed        $response Created CTA resource.
	 * @param Data_Request $data     Data request object.
	 * @return mixed The created CTA resource.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}
}
