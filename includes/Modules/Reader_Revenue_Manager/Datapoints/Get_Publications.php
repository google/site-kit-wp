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
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronize_Publication;
use Google\Site_Kit\Modules\Search_Console\Settings as Search_Console_Settings;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Publication;

/**
 * Class for the publications retrieval datapoint.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Get_Publications extends Datapoint implements Executable_Datapoint {

	/**
	 * Options instance.
	 *
	 * @since n.e.x.t
	 * @var Options
	 */
	private $options;

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

		$this->options  = $definition['options'];
		$this->settings = $definition['settings'];
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
		return $this->get_service()->organizations_publications->listOrganizationsPublications(
			'organizations/*',
			array( 'filter' => $this->get_publication_filter() )
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

		$this->synchronize_publication_data( $publications );

		return array_map( array( Publication_Normalizer::class, 'normalize' ), $publications );
	}

	/**
	 * Returns the payment option for the given publication.
	 *
	 * @since n.e.x.t
	 *
	 * @param Publication $publication Publication object.
	 * @return string Payment option for settings.
	 */
	private function get_payment_option( Publication $publication ) {
		$payment_option = $publication->getPaymentOption();

		if ( empty( $payment_option ) ) {
			return '';
		}

		return Publication_Normalizer::map_payment_option( $payment_option );
	}

	/**
	 * Returns the product IDs for the given publication.
	 *
	 * @since n.e.x.t
	 *
	 * @param Publication $publication Publication object.
	 * @return array Product IDs.
	 */
	private function get_product_ids( Publication $publication ) {
		$products = $publication->getProducts();

		if ( empty( $products ) || ! is_array( $products ) ) {
			return array();
		}

		return array_values(
			array_filter(
				$products,
				'is_string'
			)
		);
	}

	/**
	 * Gets the filter for retrieving publications for the current site.
	 *
	 * @since n.e.x.t
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
	 * Synchronizes the publication data with the module settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param Publication[] $publications Array of WCP Publication objects.
	 * @return void No return value.
	 */
	private function synchronize_publication_data( $publications ) {
		if ( empty( $publications ) ) {
			return;
		}

		$settings       = $this->settings->get();
		$publication_id = $settings['publicationID'];

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

		$filtered_publications = array_values( $filtered_publications );
		$publication           = $filtered_publications[0];

		$onboarding_state     = $settings['publicationOnboardingState'];
		$new_onboarding_state = Publication_Normalizer::map_onboarding_state(
			$publication->getOnboardingState() ?? ''
		);

		$new_settings = array(
			'publicationOnboardingState' => $new_onboarding_state,
			'productIDs'                 => $this->get_product_ids( $publication ),
			'paymentOption'              => $this->get_payment_option( $publication ),
		);

		$content_policy_status = $publication->getContentPolicyStatus();

		if ( $content_policy_status ) {
			$state = $content_policy_status->getState();

			$new_settings['contentPolicyState'] = ! empty( $state )
				? Publication_Normalizer::map_content_policy_state( $state )
				: '';
			$new_settings['policyInfoLink']     = $content_policy_status->getPolicyInfoUrl() ?? '';
		}

		if ( $new_onboarding_state !== $onboarding_state ) {
			$new_settings['publicationOnboardingStateChanged'] = true;
		}

		$this->settings->merge( $new_settings );

		$cron_event = wp_next_scheduled( Synchronize_Publication::CRON_SYNCHRONIZE_PUBLICATION );
		if ( $cron_event ) {
			wp_unschedule_event( $cron_event, Synchronize_Publication::CRON_SYNCHRONIZE_PUBLICATION );
		}

		wp_schedule_single_event(
			time() + HOUR_IN_SECONDS,
			Synchronize_Publication::CRON_SYNCHRONIZE_PUBLICATION
		);
	}
}
