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

use Google\Site_Kit\Core\Modules\Datapoint;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Setting_Exception;

/**
 * Class for the CTAs retrieval datapoint.
 *
 * @since 1.187.0
 * @access private
 * @ignore
 */
class Get_CTAs extends Datapoint implements Executable_Datapoint {

	/**
	 * Reader Revenue Manager settings.
	 *
	 * @since 1.187.0
	 * @var \Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings
	 */
	private $settings;

	/**
	 * Constructor.
	 *
	 * @since 1.187.0
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
	 * @since 1.187.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object.
	 * @throws Missing_Required_Setting_Exception Thrown if a fallback setting is missing.
	 */
	public function create_request( Data_Request $data_request ) {
		$settings = $this->settings->get();

		$organization_id = $data_request['organizationID'] ?? $settings['organizationID'];
		$publication_id  = $data_request['publicationID'] ?? $settings['publicationID'];

		if ( empty( $organization_id ) ) {
			throw new Missing_Required_Setting_Exception( 'organizationID' );
		}

		if ( empty( $publication_id ) ) {
			throw new Missing_Required_Setting_Exception( 'publicationID' );
		}

		$parent = sprintf(
			'organizations/%s/publications/%s',
			$organization_id,
			$publication_id
		);

		return $this->get_service()->organizations_publications_ctas->listOrganizationsPublicationsCtas( $parent );
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.187.0
	 *
	 * @param mixed        $response List CTAs response.
	 * @param Data_Request $data     Data request object.
	 * @return array CTA resources.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return array_values( (array) $response->getCtas() );
	}
}
