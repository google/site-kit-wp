<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Create_Publication
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
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Publication;

/**
 * Class for the publication creation datapoint.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Create_Publication extends Datapoint implements Executable_Datapoint {

	/**
	 * Reader Revenue Manager settings.
	 *
	 * @since n.e.x.t
	 * @var Settings
	 */
	private $settings;

	/**
	 * Reference site URL.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $reference_site_url;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );

		$this->settings           = $definition['settings'];
		$this->reference_site_url = $definition['reference_site_url'];
	}

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object.
	 * @throws Missing_Required_Param_Exception Thrown if a required parameter is missing.
	 */
	public function create_request( Data_Request $data_request ) {
		foreach ( array( 'displayName', 'languageCode', 'countryCode' ) as $required_param ) {
			if ( empty( $data_request[ $required_param ] ) ) {
				throw new Missing_Required_Param_Exception( $required_param );
			}
		}

		$settings = $this->settings->get();
		if ( empty( $settings['organizationID'] ) ) {
			throw new Missing_Required_Param_Exception( 'organizationID' );
		}

		$publication = new Publication(
			array(
				'displayName'   => $data_request['displayName'],
				'languageCode'  => $data_request['languageCode'],
				'regionCode'    => $data_request['countryCode'],
				'primaryDomain' => array(
					'url' => $this->reference_site_url,
				),
			)
		);

		return $this->get_service()->organizations_publications->create(
			'organizations/' . $settings['organizationID'],
			$publication
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
