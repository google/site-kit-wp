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
		$this->synchronize_publication_data();
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
		$settings  = $this->reader_revenue_manager->get_settings()->get();

		if ( $connected && 'ONBOARDING_COMPLETE' !== $settings['publicationOnboardingState'] ) {
			$publications = $this->reader_revenue_manager->get_data( 'publications' );

			if ( empty( $publications ) ) {
				return;
			}
		}
	}
}
