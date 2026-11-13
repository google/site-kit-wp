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

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Publication_Normalizer;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization\Publication as Publication_Synchronization;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\Publication;

/**
 * Class for the publication retrieval datapoint.
 *
 * @since 1.186.0
 * @access private
 * @ignore
 */
class Get_Publication extends Connected_Publication_Datapoint {

	/**
	 * Synchronization instance.
	 *
	 * @since 1.188.0
	 * @var Publication_Synchronization
	 */
	private $synchronization;

	/**
	 * Constructor.
	 *
	 * @since 1.186.0
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );

		$this->synchronization = new Publication_Synchronization( $this->settings );
	}

	/**
	 * Creates a request object.
	 *
	 * @since 1.186.0
	 * @since n.e.x.t Uses the connected publication from the module settings.
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object.
	 */
	public function create_request( Data_Request $data_request ) {
		$publication = $this->get_connected_publication();

		$name = sprintf(
			'organizations/%s/publications/%s',
			$publication['organizationID'],
			$publication['publicationID']
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
		if ( $response instanceof Publication ) {
			$this->synchronization->synchronize( $response );
		}

		return Publication_Normalizer::normalize( $response );
	}
}
