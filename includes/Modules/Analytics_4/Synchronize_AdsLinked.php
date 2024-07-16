<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Synchronize_AdsLinked
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;

/**
 * The base class for Synchronizing the adsLinked status.
 *
 * @since 1.124.0
 * @access private
 * @ignore
 */
class Synchronize_AdsLinked {
	const CRON_SYNCHRONIZE_ADS_LINKED = 'googlesitekit_cron_synchronize_ads_linked_data';

	/**
	 * Analytics_4 instance.
	 *
	 * @since 1.124.0
	 * @var Analytics_4
	 */
	protected $analytics_4;

	/**
	 * User_Options instance.
	 *
	 * @since 1.124.0
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * Constructor.
	 *
	 * @since 1.124.0
	 *
	 * @param Analytics_4  $analytics_4  Analytics 4 instance.
	 * @param User_Options $user_options User_Options instance.
	 */
	public function __construct( Analytics_4 $analytics_4, User_Options $user_options ) {
		$this->analytics_4  = $analytics_4;
		$this->user_options = $user_options;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.124.0
	 */
	public function register() {
		add_action(
			self::CRON_SYNCHRONIZE_ADS_LINKED,
			function () {
				$this->synchronize_ads_linked_data();
			}
		);
	}

	/**
	 * Cron callback for synchronizing the ads linked data.
	 *
	 * @since 1.124.0
	 */
	protected function synchronize_ads_linked_data() {
		$owner_id     = $this->analytics_4->get_owner_id();
		$restore_user = $this->user_options->switch_user( $owner_id );

		if ( user_can( $owner_id, Permissions::VIEW_AUTHENTICATED_DASHBOARD ) ) {
			$this->synchronize_ads_linked_status();
		}

		$restore_user();
	}

	/**
	 * Synchronize the adsLinked status.
	 *
	 * @since 1.124.0
	 *
	 * @return null
	 */
	protected function synchronize_ads_linked_status() {
		$settings_ga4       = $this->analytics_4->get_settings()->get();
		$property_id        = $settings_ga4['propertyID'];
		$property_ads_links = $this->analytics_4->get_data(
			'ads-links',
			array( 'propertyID' => $property_id )
		);

		if ( is_wp_error( $property_ads_links ) || ! is_array( $property_ads_links ) ) {
			return null;
		}

		// Update the adsLinked status and timestamp.
		$this->analytics_4->get_settings()->merge(
			array(
				'adsLinked'             => ! empty( $property_ads_links ),
				'adsLinkedLastSyncedAt' => time(),
			)
		);
	}

	/**
	 * Schedules single cron which will synchronize the adsLinked status.
	 *
	 * @since 1.124.0
	 */
	public function maybe_schedule_synchronize_ads_linked() {
		$analytics_4_connected  = $this->analytics_4->is_connected();
		$cron_already_scheduled = wp_next_scheduled( self::CRON_SYNCHRONIZE_ADS_LINKED );

		if ( $analytics_4_connected && ! $cron_already_scheduled ) {
			wp_schedule_single_event(
				// Schedule the task to run in 24 hours.
				time() + ( DAY_IN_SECONDS ),
				self::CRON_SYNCHRONIZE_ADS_LINKED
			);
		}
	}
}
