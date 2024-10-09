<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Synchronize_OnboardingState.
 *
 * @since n.e.x.t
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Reader_Revenue_Manager;

/**
 * Class for synchronizing the onboarding state.
 */
class Synchronize_OnboardingState {
	/**
	 * Cron event name for synchronizing the onboarding state.
	 */
	const CRON_SYNCHRONIZE_ONBOARDING_STATE = 'googlesitekit_cron_synchronize_onboarding_state';

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
	 * @param Reader_Revenue_Manager $reader_revenue_manager Reader Revenue Manager instance.
	 * @param User_Options           $user_options           User_Options instance.
	 */
	public function __construct( Reader_Revenue_Manager $reader_revenue_manager, User_Options $user_options ) {
		$this->reader_revenue_manager = $reader_revenue_manager;
		$this->user_options           = $user_options;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 */
	public function register() {
		add_action(
			self::CRON_SYNCHRONIZE_ONBOARDING_STATE,
			function () {
				$this->synchronize_publication_data();
			}
		);
	}

	/**
	 * Synchronizes the onboarding state.
	 *
	 * @since n.e.x.t
	 *
	 * @return void
	 */
	protected function synchronize_publication_data() {
		$owner_id     = $this->reader_revenue_manager->get_owner_id();
		$restore_user = $this->user_options->switch_user( $owner_id );

		if ( user_can( $owner_id, Permissions::VIEW_AUTHENTICATED_DASHBOARD ) ) {
			$this->synchronize_onboarding_state();
		}

		$restore_user();
	}

	/**
	 * Synchronizes the onboarding state.
	 *
	 * @since n.e.x.t
	 *
	 * @return void
	 */
	protected function synchronize_onboarding_state() {
		$connected = $this->reader_revenue_manager->is_connected();

		// If not connected, return early.
		if ( ! $connected ) {
			return;
		}

		$settings         = $this->reader_revenue_manager->get_settings()->get();
		$publication_id   = $settings['publicationID'];
		$onboarding_state = $settings['publicationOnboardingState'];

		if ( $connected && 'ONBOARDING_COMPLETE' !== $onboarding_state ) {
			$publications = $this->reader_revenue_manager->get_data( 'publications' );

			// If publications is empty, return early.
			if ( empty( $publications ) ) {
				return;
			}

			$publication = array_filter(
				$publications,
				function ( $pub ) use ( $publication_id ) {
					return $pub['publicationId'] === $publication_id;
				}
			);

			// If publication is empty, return early.
			if ( empty( $publication ) ) {
				return;
			}

			$publication = reset( $publication );

			if ( $publication['onboardingState'] !== $onboarding_state ) {
				$new_settings                                      = $settings;
				$new_settings['publicationOnboardingState']        = $publication['onboardingState'];
				$new_settings['publicationOnboardingStateChanged'] = true;

				$this->reader_revenue_manager->get_settings()->set( $new_settings );
			}
		}
	}

	/**
	 * Maybe schedules the synchronize onboarding state cron event.
	 *
	 * @since n.e.x.t
	 *
	 * @return void
	 */
	public function maybe_schedule_synchronize_onboarding_state() {
		$connected              = $this->reader_revenue_manager->is_connected();
		$cron_already_scheduled = wp_next_scheduled( self::CRON_SYNCHRONIZE_ONBOARDING_STATE );

		if ( $connected && ! $cron_already_scheduled ) {
			wp_schedule_single_event(
				time() + ( HOUR_IN_SECONDS ),
				self::CRON_SYNCHRONIZE_ONBOARDING_STATE
			);
		}
	}
}
