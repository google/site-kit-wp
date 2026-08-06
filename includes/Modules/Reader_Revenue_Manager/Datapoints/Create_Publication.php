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
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Setting_Exception;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Publication_Normalizer;
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
	 * Reference site URL.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $reference_site_url;

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

		$this->reference_site_url = $definition['reference_site_url'];
		$this->settings           = $definition['settings'];
	}

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object.
	 * @throws Missing_Required_Param_Exception   Thrown if a required parameter is missing.
	 * @throws Missing_Required_Setting_Exception Thrown if a required setting is missing.
	 */
	public function create_request( Data_Request $data_request ) {
		if ( empty( $data_request->data['displayName'] ) ) {
			throw new Missing_Required_Param_Exception( 'displayName' );
		}

		if ( empty( $data_request->data['languageCode'] ) ) {
			throw new Missing_Required_Param_Exception( 'languageCode' );
		}

		if ( empty( $data_request->data['regionCode'] ) ) {
			throw new Missing_Required_Param_Exception( 'regionCode' );
		}

		$settings = $this->settings->get();

		if ( empty( $settings['organizationID'] ) ) {
			throw new Missing_Required_Setting_Exception( 'organizationID' );
		}

		$publication = new Publication(
			array(
				'displayName'   => $data_request['displayName'],
				'languageCode'  => $data_request['languageCode'],
				'primaryDomain' => array( 'url' => $this->reference_site_url ),
				'regionCode'    => $data_request['regionCode'],
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
