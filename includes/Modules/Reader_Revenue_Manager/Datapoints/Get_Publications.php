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
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings;

/**
 * Class for the publications retrieval datapoint.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Get_Publications extends Datapoint implements Executable_Datapoint {

	/**
	 * Reader Revenue Manager settings.
	 *
	 * @since n.e.x.t
	 * @var Settings
	 */
	private $settings;

	/**
	 * Publication filter callback.
	 *
	 * @since n.e.x.t
	 * @var callable
	 */
	private $get_publication_filter;

	/**
	 * Publication synchronization callback.
	 *
	 * @since n.e.x.t
	 * @var callable
	 */
	private $synchronize_publication_data;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );

		$this->settings                     = $definition['settings'];
		$this->get_publication_filter       = $definition['get_publication_filter'];
		$this->synchronize_publication_data = $definition['synchronize_publication_data'];
	}

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object.
	 * @throws Missing_Required_Param_Exception Thrown if the organization ID is missing.
	 */
	public function create_request( Data_Request $data_request ) {
		$service = $this->get_service();

		if ( Feature_Flags::enabled( 'rrmExpressSetup' ) ) {
			$settings = $this->settings->get();
			if ( empty( $settings['organizationID'] ) ) {
				throw new Missing_Required_Param_Exception( 'organizationID' );
			}

			return $service->organizations_publications->listOrganizationsPublications(
				'organizations/' . $settings['organizationID']
			);
		}

		return $service->publications->listPublications(
			array( 'filter' => call_user_func( $this->get_publication_filter ) )
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

		if ( Feature_Flags::enabled( 'rrmExpressSetup' ) ) {
			$publications = array_map( array( Publication_Normalizer::class, 'normalize' ), $publications );
		}

		call_user_func( $this->synchronize_publication_data, $publications );

		return $publications;
	}
}
