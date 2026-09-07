<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization\Publication
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization;

use Google\Site_Kit\Modules\Reader_Revenue_Manager\Publication_Normalizer;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Publication as WCP_Publication;

/**
 * Class for synchronizing publication data with Reader Revenue Manager settings.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Publication {

	/**
	 * Cron event name for synchronizing publication data.
	 */
	const CRON_SYNCHRONIZE_PUBLICATION = 'googlesitekit_cron_synchronize_publication';

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
	 * @param Settings $settings Reader Revenue Manager settings.
	 */
	public function __construct( Settings $settings ) {
		$this->settings = $settings;
	}

	/**
	 * Synchronizes the connected publication with the module settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param WCP_Publication $publication WCP Publication object.
	 * @return void No return value.
	 */
	public function synchronize( WCP_Publication $publication ) {
		$settings       = $this->settings->get();
		$publication_id = $settings['publicationID'] ?? '';

		if ( empty( $publication_id ) || $publication->getPublicationId() !== $publication_id ) {
			return;
		}

		$onboarding_state     = $settings['publicationOnboardingState'] ?? '';
		$new_onboarding_state = Publication_Normalizer::map_onboarding_state(
			$publication->getOnboardingState() ?? ''
		);

		$new_settings = array(
			'organizationID'             => $publication->getOrganizationId() ?? '',
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
		$this->reschedule();
	}

	/**
	 * Reschedules publication synchronization to run in one hour.
	 *
	 * @since n.e.x.t
	 *
	 * @return void No return value.
	 */
	private function reschedule() {
		$cron_event = wp_next_scheduled( self::CRON_SYNCHRONIZE_PUBLICATION );

		if ( $cron_event ) {
			wp_unschedule_event( $cron_event, self::CRON_SYNCHRONIZE_PUBLICATION );
		}

		wp_schedule_single_event(
			time() + HOUR_IN_SECONDS,
			self::CRON_SYNCHRONIZE_PUBLICATION
		);
	}

	/**
	 * Returns the payment option for the given publication.
	 *
	 * @since n.e.x.t
	 *
	 * @param WCP_Publication $publication Publication object.
	 * @return string Payment option for settings.
	 */
	private function get_payment_option( WCP_Publication $publication ) {
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
	 * @param WCP_Publication $publication Publication object.
	 * @return array Product IDs.
	 */
	private function get_product_ids( WCP_Publication $publication ) {
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
}
