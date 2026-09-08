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
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\URL;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Publication_Normalizer;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization\Publication as Publication_Synchronization;
use Google\Site_Kit\Modules\Search_Console\Settings as Search_Console_Settings;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Publication;

/**
 * Class for the publications retrieval datapoint.
 *
 * @since 1.186.0
 * @access private
 * @ignore
 */
class Get_Publications extends Datapoint implements Executable_Datapoint {

	/**
	 * Options instance.
	 *
	 * @since 1.186.0
	 * @var Options
	 */
	private $options;

	/**
	 * Reader Revenue Manager settings.
	 *
	 * @since 1.186.0
	 * @var Settings
	 */
	private $settings;

	/**
	 * Synchronization instance.
	 *
	 * @since n.e.x.t
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

		$this->options         = $definition['options'];
		$this->settings        = $definition['settings'];
		$this->synchronization = new Publication_Synchronization( $this->settings );
	}

	/**
	 * Creates a request object.
	 *
	 * @since 1.186.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object.
	 */
	public function create_request( Data_Request $data_request ) {
		return $this->get_service()->organizations_publications->listOrganizationsPublications(
			'organizations/*',
			array( 'filter' => $this->get_publication_filter() )
		);
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.186.0
	 *
	 * @param mixed        $response Publications list response.
	 * @param Data_Request $data     Data request object.
	 * @return array Publication resources.
	 */
	public function parse_response( $response, Data_Request $data ) {
		$publications = array_values( (array) $response->getPublications() );

		$this->synchronize_publication_data( $publications );

		return array_map( array( Publication_Normalizer::class, 'normalize' ), $publications );
	}

	/**
	 * Gets the filter for retrieving publications for the current site.
	 *
	 * @since 1.186.0
	 *
	 * @return string Permutations for site hosts or URL.
	 */
	private function get_publication_filter() {
		$sc_settings = $this->options->get( Search_Console_Settings::OPTION );
		$property_id = $sc_settings['propertyID'];

		if ( 0 === strpos( $property_id, 'sc-domain:' ) ) { // Domain property.
			$host   = str_replace( 'sc-domain:', '', $property_id );
			$filter = join(
				' OR ',
				array_map(
					function ( $domain ) {
						return sprintf( 'domain = "%s"', $domain );
					},
					URL::permute_site_hosts( $host )
				)
			);
		} else { // URL property.
			$filter = join(
				' OR ',
				array_map(
					function ( $url ) {
						return sprintf( 'site_url = "%s"', $url );
					},
					URL::permute_site_url( $property_id )
				)
			);
		}

		return $filter;
	}

	/**
	 * Synchronizes the connected publication from a publications list response.
	 *
	 * @since 1.186.0
	 *
	 * @param Publication[] $publications Array of WCP Publication objects.
	 * @return void No return value.
	 */
	private function synchronize_publication_data( $publications ) {
		if ( empty( $publications ) ) {
			return;
		}

		$publication_id = $this->settings->get()['publicationID'] ?? '';

		if ( empty( $publication_id ) ) {
			return;
		}

		$filtered_publications = array_filter(
			$publications,
			function ( $publication ) use ( $publication_id ) {
				return $publication instanceof Publication
					&& $publication->getPublicationId() === $publication_id;
			}
		);

		if ( empty( $filtered_publications ) ) {
			return;
		}

		$this->synchronization->synchronize( array_values( $filtered_publications )[0] );
	}
}
