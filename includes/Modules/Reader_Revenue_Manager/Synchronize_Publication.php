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
use Google\Site_Kit\Modules\Reader_Revenue_Manager;

/**
 * Class for synchronizing the onboarding state.
 *
 * @since 1.146.0
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
	 * @since 1.146.0
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
	 * @since 1.146.0
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
	 * @since 1.146.0
	 *
	 * @return void
	 */
	protected function synchronize_publication_data() {
		$owner_id     = $this->reader_revenue_manager->get_owner_id();
		$restore_user = $this->user_options->switch_user( $owner_id );

		if ( user_can( $owner_id, Permissions::VIEW_AUTHENTICATED_DASHBOARD ) ) {
			$this->reader_revenue_manager->get_data( 'publications' );
		}

		$restore_user();
	}

	/**
	 * Maybe schedule the synchronize onboarding state cron event.
	 *
	 * @since 1.146.0
	 *
	 * @return void
	 */
	public function maybe_schedule_synchronize_publication() {
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
