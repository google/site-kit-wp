<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization\Cron
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Reader_Revenue_Manager;

/**
 * Class for periodically synchronizing a Reader Revenue Manager datapoint.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Cron {

	/**
	 * Reader_Revenue_Manager instance.
	 *
	 * @since n.e.x.t
	 * @var Reader_Revenue_Manager
	 */
	private $reader_revenue_manager;

	/**
	 * User_Options instance.
	 *
	 * @since n.e.x.t
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Cron hook.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $hook;

	/**
	 * Datapoint slug.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $datapoint;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Reader_Revenue_Manager $reader_revenue_manager Reader Revenue Manager instance.
	 * @param User_Options           $user_options           User Options instance.
	 * @param string                 $hook                   Cron hook.
	 * @param string                 $datapoint              Datapoint slug.
	 */
	public function __construct(
		Reader_Revenue_Manager $reader_revenue_manager,
		User_Options $user_options,
		$hook,
		$datapoint
	) {
		$this->reader_revenue_manager = $reader_revenue_manager;
		$this->user_options           = $user_options;
		$this->hook                   = $hook;
		$this->datapoint              = $datapoint;
	}

	/**
	 * Registers the cron callback.
	 *
	 * @since n.e.x.t
	 *
	 * @return void No return value.
	 */
	public function register() {
		add_action(
			$this->hook,
			function () {
				$this->synchronize();
			}
		);
	}

	/**
	 * Maybe schedules the cron event.
	 *
	 * @since n.e.x.t
	 *
	 * @return void No return value.
	 */
	public function maybe_schedule() {
		if ( $this->reader_revenue_manager->is_connected() && ! wp_next_scheduled( $this->hook ) ) {
			wp_schedule_single_event( time() + HOUR_IN_SECONDS, $this->hook );
		}
	}

	/**
	 * Fetches the datapoint as the module owner.
	 *
	 * @since n.e.x.t
	 *
	 * @return void No return value.
	 */
	private function synchronize() {
		$owner_id     = $this->reader_revenue_manager->get_owner_id();
		$restore_user = $this->user_options->switch_user( $owner_id );

		if ( user_can( $owner_id, Permissions::VIEW_AUTHENTICATED_DASHBOARD ) ) {
			if ( ! $this->reader_revenue_manager->is_connected() ) {
				$restore_user();
				return;
			}

			$this->reader_revenue_manager->get_data( $this->datapoint );
		}

		$restore_user();
	}
}
