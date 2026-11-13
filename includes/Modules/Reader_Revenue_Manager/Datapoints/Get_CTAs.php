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

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization\CTA as CTA_Synchronization;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\Cta;

/**
 * Class for the CTAs retrieval datapoint.
 *
 * @since 1.187.0
 * @access private
 * @ignore
 */
class Get_CTAs extends Connected_Publication_Datapoint {

	/**
	 * CTA synchronization instance.
	 *
	 * @since 1.188.0
	 * @var CTA_Synchronization
	 */
	private $synchronization;

	/**
	 * Constructor.
	 *
	 * @since 1.187.0
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );

		$this->synchronization = new CTA_Synchronization( $this->settings );
	}

	/**
	 * Creates a request object.
	 *
	 * @since 1.187.0
	 * @since n.e.x.t Uses the connected publication from the module settings.
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object.
	 */
	public function create_request( Data_Request $data_request ) {
		$publication = $this->get_connected_publication();

		$parent = sprintf(
			'organizations/%s/publications/%s',
			$publication['organizationID'],
			$publication['publicationID']
		);

		return $this->get_service()->organizations_publications_ctas->listOrganizationsPublicationsCtas( $parent );
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.187.0
	 * @since 1.192.0 Excludes CTAs that are neither active nor draft, such as deleted CTAs.
	 * @since n.e.x.t Names the publication the CTAs belong to.
	 *
	 * @param mixed        $response List CTAs response.
	 * @param Data_Request $data     Data request object.
	 * @return array {
	 *     Connected publication CTAs.
	 *
	 *     @type string $publicationID Publication the CTAs belong to.
	 *     @type array  $ctas          CTA resources.
	 * }
	 */
	public function parse_response( $response, Data_Request $data ) {
		$publication = $this->get_connected_publication();

		$ctas = array_values(
			array_filter(
				(array) $response->getCtas(),
				function ( $cta ) {
					return $cta instanceof Cta && in_array(
						$cta->getState(),
						array( Cta::STATE_ACTIVE, Cta::STATE_DRAFT ),
						true
					);
				}
			)
		);

		$this->synchronization->synchronize( $ctas );

		return array(
			'publicationID' => $publication['publicationID'],
			'ctas'          => $ctas,
		);
	}
}
