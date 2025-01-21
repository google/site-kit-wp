<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronize_Publication
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Modules\Reader_Revenue_Manager;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle\Publication;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle\PaymentOptions;

/**
 * Class for synchronizing the onboarding state.
 *
 * @since 1.141.0
 * @access private
 * @ignore
 */
class Synchronize_Publication {
	/**
	 * Cron event name for synchronizing the publication info.
	 */
	const CRON_SYNCHRONIZE_PUBLICATION = 'googlesitekit_cron_synchronize_publication';

	/**
	 * Reader_Revenue_Manager instance.
	 *
	 * @var Reader_Revenue_Manager
	 */
	protected $reader_revenue_manager;

	/**
	 * User_Options instance.
	 *
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * Constructor.
	 *
	 * @since 1.141.0
	 *
	 * @param Reader_Revenue_Manager $reader_revenue_manager Reader Revenue Manager instance.
	 * @param User_Options           $user_options           User_Options instance.
	 */
	public function __construct( Reader_Revenue_Manager $reader_revenue_manager, User_Options $user_options ) {
		$this->reader_revenue_manager = $reader_revenue_manager;
		$this->user_options           = $user_options;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.141.0
	 *
	 * @return void
	 */
	public function register() {
		add_action(
			self::CRON_SYNCHRONIZE_PUBLICATION,
			function () {
				$this->synchronize_publication_data();
			}
		);
	}

	/**
	 * Cron callback for synchronizing the publication.
	 *
	 * @since 1.141.0
	 *
	 * @return void
	 */
	protected function synchronize_publication_data() {
		$owner_id     = $this->reader_revenue_manager->get_owner_id();
		$restore_user = $this->user_options->switch_user( $owner_id );

		if ( user_can( $owner_id, Permissions::VIEW_AUTHENTICATED_DASHBOARD ) ) {
			$connected = $this->reader_revenue_manager->is_connected();

			// If not connected, return early.
			if ( ! $connected ) {
				return;
			}

			$settings       = $this->reader_revenue_manager->get_settings()->get();
			$publication_id = $settings['publicationID'];
			$publications   = $this->reader_revenue_manager->get_data( 'publications' );

			// If publications is empty, return early.
			if ( empty( $publications ) ) {
				return;
			}

			$filtered_publications = array_filter(
				$publications,
				function ( $pub ) use ( $publication_id ) {
					return $pub->getPublicationId() === $publication_id;
				}
			);

			// If there are no filtered publications, return early.
			if ( empty( $filtered_publications ) ) {
				return;
			}

			// Re-index the filtered array to ensure sequential keys.
			$filtered_publications = array_values( $filtered_publications );
			$publication           = $filtered_publications[0];
			$new_product_ids       = array();
			$new_payment_options   = array();
			$new_onboarding_state  = $this->get_new_onboarding_state( $publication );

			if ( Feature_Flags::enabled( 'rrmModuleV2' ) ) {
				$new_product_ids     = $this->get_new_product_ids( $publication );
				$new_payment_options = $this->get_new_payment_options( $publication );
			}

			$new_settings = array_merge( $new_onboarding_state, $new_product_ids, $new_payment_options );

			if ( ! empty( $new_settings ) ) {
				$this->reader_revenue_manager->get_settings()->merge( $new_settings );
			}
		}

		$restore_user();
	}

	/**
	 * Returns the updated products IDs for the publication.
	 *
	 * @since n.e.x.t
	 *
	 * @param Publication $publication Publication object.
	 * @return array New product IDs.
	 */
	protected function get_new_product_ids( Publication $publication ) {
		$new_product_ids = array();
		$settings        = $this->reader_revenue_manager->get_settings()->get();
		$product_ids     = $settings['productIDs'];
		$products        = $publication->getProducts();

		if ( ! empty( $products ) ) {
			$product_ids = array_map(
				function ( $product ) {
					$name = $product->getName();
					return substr( $name, strpos( $name, ':' ) + 1 );
				},
				$products
			);

			// Sort the array alphabetically in ascending order.
			sort( $product_ids );
			$product_ids = array_values( $product_ids );

			if ( ( count( $product_ids ) !== count( $settings['productIDs'] ) ) || ( $product_ids !== $settings['productIDs'] ) ) {
				$new_product_ids = array(
					'productIDs' => $product_ids,
				);
			}
		}

		return $new_product_ids;
	}

	/**
	 * Returns the new payment option for the publication.
	 *
	 * @since n.e.x.t
	 *
	 * @param Publication $publication Publication object.
	 * @return string New payment option.
	 */
	protected function get_new_payment_options( Publication $publication ) {
		$settings                = $this->reader_revenue_manager->get_settings()->get();
		$saved_payment_option    = $settings['paymentOption'];
		$current_payment_options = $publication->getPaymentOptions();

		if ( $current_payment_options instanceof PaymentOptions ) {
			foreach ( $current_payment_options as $property => $value ) {
				if ( true === $value && $property !== $saved_payment_option ) {
					return array(
						'paymentOption' => $property,
					);
				}
			}
		}

		return array();
	}

	/**
	 * Returns the new onboarding state data.
	 *
	 * @since 1.141.0
	 *
	 * @param Publication $publication Publication object.
	 * @return array New onboarding state data.
	 */
	protected function get_new_onboarding_state( Publication $publication ) {
		$new_onboarding_state = array();
		$settings             = $this->reader_revenue_manager->get_settings()->get();
		$onboarding_state     = $settings['publicationOnboardingState'];

		if ( $publication->getOnboardingState() !== $onboarding_state ) {
			$new_onboarding_state = array(
				'publicationOnboardingState'        => $publication->getOnboardingState(),
				'publicationOnboardingStateChanged' => true,
			);
		}

		return $new_onboarding_state;
	}

	/**
	 * Maybe schedule the synchronize onboarding state cron event.
	 *
	 * @since 1.141.0
	 *
	 * @return void
	 */
	public function maybe_schedule_synchronize_onboarding_state() {
		$connected              = $this->reader_revenue_manager->is_connected();
		$cron_already_scheduled = wp_next_scheduled( self::CRON_SYNCHRONIZE_PUBLICATION );

		if ( $connected && ! $cron_already_scheduled ) {
			wp_schedule_single_event(
				time() + HOUR_IN_SECONDS,
				self::CRON_SYNCHRONIZE_PUBLICATION
			);
		}
	}
}
