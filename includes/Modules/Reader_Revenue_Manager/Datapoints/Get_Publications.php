<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Get_Publications
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
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Publication_Normalizer;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle\Publication;

/**
 * Class for the publications retrieval datapoint.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Get_Publications extends Datapoint implements Executable_Datapoint {

	/**
	 * Filter for publications associated with the current site.
	 *
	 * @since n.e.x.t
	 * @var callable|string
	 */
	private $filter_callback;

	/**
	 * Callback for synchronizing publication data with module settings.
	 *
	 * @since n.e.x.t
	 * @var callable
	 */
	private $sync_callback;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );

		$this->filter_callback = $definition['filter_callback'];
		$this->sync_callback   = $definition['sync_callback'];
	}

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object.
	 */
	public function create_request( Data_Request $data_request ) {
		$filter = is_callable( $this->filter_callback ) ? call_user_func( $this->filter_callback ) : $this->filter_callback;

		return $this->get_service()->organizations_publications->listOrganizationsPublications(
			'organizations/*',
			array( 'filter' => $filter )
		);
	}

	/**
	 * Parses a response.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed        $response Publications list response.
	 * @param Data_Request $data     Data request object.
	 * @return array Publication resources.
	 */
	public function parse_response( $response, Data_Request $data ) {
		$publications = array_values( (array) $response->getPublications() );
		$publications = array_map( array( Publication_Normalizer::class, 'normalize' ), $publications );

		$legacy_publications = array_map(
			fn( $publication ) => new Publication( $publication ),
			$publications
		);

		call_user_func( $this->sync_callback, $legacy_publications );

		return $publications;
	}
}
