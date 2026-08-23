<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Modules\Reader_Revenue_Manager;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization\CTA;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization\Cron;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization\Publication;

/**
 * Class for registering Reader Revenue Manager synchronization.
 *
 * @since 1.146.0
 * @since n.e.x.t Renamed from Synchronize_Publication.
 * @access private
 * @ignore
 */
class Synchronization {
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
	 * @since n.e.x.t
	 *
	 * @param Reader_Revenue_Manager $reader_revenue_manager Reader Revenue Manager instance.
	 * @param User_Options           $user_options           User Options instance.
	 */
	public function __construct(
		Reader_Revenue_Manager $reader_revenue_manager,
		User_Options $user_options
	) {
		$this->reader_revenue_manager = $reader_revenue_manager;
		$this->user_options           = $user_options;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.146.0
	 *
	 * @return void No return value.
	 */
	public function register() {
		$crons = array(
			new Cron(
				$this->reader_revenue_manager,
				$this->user_options,
				Publication::CRON_SYNCHRONIZE_PUBLICATION,
				'publications'
			),
		);

		if ( Feature_Flags::enabled( 'rrmExpressSetup' ) ) {
			$crons[] = new Cron(
				$this->reader_revenue_manager,
				$this->user_options,
				CTA::CRON_SYNCHRONIZE_PUBLICATION_CTAS,
				'ctas',
				array( $this, 'get_datapoint_data' )
			);
		}

		foreach ( $crons as $cron ) {
			$cron->register();
		}

		foreach ( array(
			'load-toplevel_page_googlesitekit-dashboard',
			'load-toplevel_page_googlesitekit-settings',
		) as $action ) {
			add_action(
				$action,
				function () use ( $crons ) {
					foreach ( $crons as $cron ) {
						$cron->maybe_schedule();
					}
				}
			);
		}
	}

	/**
	 * Gets request data for datapoints that identify a publication.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Datapoint request data.
	 */
	private function get_datapoint_data() {
		$settings = $this->reader_revenue_manager->get_settings()->get();

		return array_filter(
			array(
				'organizationID' => $settings['organizationID'],
				'publicationID'  => $settings['publicationID'],
			)
		);
	}
}
