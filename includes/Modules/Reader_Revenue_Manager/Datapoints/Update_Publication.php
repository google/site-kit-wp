<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Update_Publication
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
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Setting_Exception;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Publication_Normalizer;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Publication;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\RrmProduct;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\TosAcceptance;

/**
 * Class for the publication update datapoint.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Update_Publication extends Datapoint implements Executable_Datapoint {

	/**
	 * Reader Revenue Manager settings.
	 *
	 * @since n.e.x.t
	 * @var Settings
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
	 */
	public function create_request( Data_Request $data_request ) {
		if ( empty( $data_request->data['data'] ) ) {
			throw new Missing_Required_Param_Exception( 'data' );
		}

		$settings = $this->settings->get();

		$publication_id  = $data_request['publicationID'] ?? $settings['publicationID'];
		$organization_id = $data_request['organizationID'] ?? $settings['organizationID'];

		if ( empty( $publication_id ) ) {
			throw new Missing_Required_Setting_Exception( 'publicationID' );
		}

		if ( empty( $organization_id ) ) {
			throw new Missing_Required_Setting_Exception( 'organizationID' );
		}

		$publication_data = $data_request['data'];
		$publication      = new Publication();
		$update_mask      = array();

		if ( isset( $publication_data['rrmProduct']['tosAcceptance'] ) ) {
			$tos_acceptance_data = $publication_data['rrmProduct']['tosAcceptance'];

			$tos_acceptance = new TosAcceptance();
			$tos_acceptance->setUserAccepted( ! empty( $tos_acceptance_data['userAccepted'] ) );

			$rrm_product = new RrmProduct();
			$rrm_product->setTosAcceptance( $tos_acceptance );

			$publication->setRrmProduct( $rrm_product );
			$update_mask[] = 'rrmProduct.tosAcceptance.userAccepted';
		}

		if ( array_key_exists( 'publicationTosUrl', $publication_data ) ) {
			$publication->setPublicationTosUrl( $publication_data['publicationTosUrl'] );
			$update_mask[] = 'publicationTosUrl';
		}

		if ( array_key_exists( 'publicationPrivacyPolicyUrl', $publication_data ) ) {
			$publication->setPublicationPrivacyPolicyUrl( $publication_data['publicationPrivacyPolicyUrl'] );
			$update_mask[] = 'publicationPrivacyPolicyUrl';
		}

		$name = sprintf(
			'organizations/%s/publications/%s',
			$organization_id,
			$publication_id
		);

		return $this->get_service()->organizations_publications->patch(
			$name,
			$publication,
			array( 'updateMask' => implode( ',', $update_mask ) )
		);
	}

	/**
	 * Parses a response.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed        $response Publication resource.
	 * @param Data_Request $data     Data request object.
	 * @return mixed Normalized publication resource.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return Publication_Normalizer::normalize( $response );
	}
}
