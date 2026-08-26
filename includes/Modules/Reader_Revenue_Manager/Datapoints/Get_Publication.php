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

use Google\Site_Kit\Core\Modules\Datapoint;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Setting_Exception;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Publication_Normalizer;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings;

/**
 * Class for the publication retrieval datapoint.
 *
 * @since 1.186.0
 * @access private
 * @ignore
 */
class Get_Publication extends Datapoint implements Executable_Datapoint {

	/**
	 * Reader Revenue Manager settings.
	 *
	 * @since 1.186.0
	 * @var Settings
	 */
	private $settings;

	/**
	 * Constructor.
	 *
	 * @since 1.186.0
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
	 * @since 1.186.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object.
	 * @throws Missing_Required_Setting_Exception Thrown if a fallback setting is missing.
	 */
	public function create_request( Data_Request $data_request ) {
		$settings = $this->settings->get();

		$publication_id  = $data_request['publicationID'] ?? $settings['publicationID'];
		$organization_id = $data_request['organizationID'] ?? $settings['organizationID'];

		if ( empty( $publication_id ) ) {
			throw new Missing_Required_Setting_Exception( 'publicationID' );
		}

		if ( empty( $organization_id ) ) {
			throw new Missing_Required_Setting_Exception( 'organizationID' );
		}

		$name = sprintf(
			'organizations/%s/publications/%s',
			$organization_id,
			$publication_id
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
		return Publication_Normalizer::normalize( $response );
	}
}
