<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Synchronize_AdSenseLinked
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Adsense;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\AdSense\Settings as Adsense_Settings;

/**
 * The base class for Synchronizing the adSenseLinked status.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Synchronize_AdSenseLinked {
	const CRON_SYNCHRONIZE_ADSENSE_LINKED = 'googlesitekit_cron_synchronize_adsense_linked_data';

	/**
	 * Analytics_4 instance.
	 *
	 * @since n.e.x.t
	 * @var Analytics_4
	 */
	protected $analytics_4;

	/**
	 * User_Options instance.
	 *
	 * @since n.e.x.t
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * Options instance.
	 *
	 * @since n.e.x.t
	 * @var Options
	 */
	protected $options;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Analytics_4  $analytics_4  Analytics 4 instance.
	 * @param User_Options $user_options User_Options instance.
	 * @param Options      $options      Options instance.
	 */
	public function __construct( Analytics_4 $analytics_4, User_Options $user_options, Options $options ) {
		$this->analytics_4  = $analytics_4;
		$this->user_options = $user_options;
		$this->options      = $options;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {

		add_action(
			self::CRON_SYNCHRONIZE_ADSENSE_LINKED,
			function() {
				$this->synchronize_adsense_linked_data();
			}
		);
	}

	/**
	 * Cron callback for synchronizing the adsense linked data.
	 *
	 * @since n.e.x.t
	 */
	protected function synchronize_adsense_linked_data() {
		$owner_id     = $this->analytics_4->get_owner_id();
		$restore_user = $this->user_options->switch_user( $owner_id );

		if ( user_can( $owner_id, Permissions::VIEW_AUTHENTICATED_DASHBOARD ) ) {
			$this->synchronize_adsense_linked_status();
		}

		$restore_user();
	}

	/**
	 * Schedules single cron which will synchronize the property data.
	 *
	 * @since 1.116.0
	 */
	public function maybe_schedule_synchronize_adsense_linked() {
		$analytics_4_connected  = apply_filters( 'googlesitekit_is_module_connected', false, Analytics_4::MODULE_SLUG );
		$adsense_connected      = apply_filters( 'googlesitekit_is_module_connected', false, AdSense::MODULE_SLUG );
		$cron_already_scheduled = wp_next_scheduled( self::CRON_SYNCHRONIZE_ADSENSE_LINKED );

		if ( $analytics_4_connected && $adsense_connected && ! $cron_already_scheduled ) {
			wp_schedule_single_event(
				// Schedule the task to run in 24 hours.
				time() + ( DAY_IN_SECONDS ),
				self::CRON_SYNCHRONIZE_ADSENSE_LINKED
			);
		}
	}

	/**
	 * Synchronize the AdSenseLinked status.
	 *
	 * @since n.e.x.t
	 *
	 * @return null
	 */
	protected function synchronize_adsense_linked_status() {
		$settings_ga4              = $this->analytics_4->get_settings()->get();
		$property_id               = $settings_ga4['propertyID'];
		$property_adsense_links    = $this->analytics_4->get_data( 'adsense-links', array( 'propertyID' => $property_id ) );
		$current_adsense_options   = ( new AdSense_Settings( $this->options ) )->get();
		$current_adsense_client_id = ! empty( $current_adsense_options['clientID'] ) ? $current_adsense_options['clientID'] : '';

		if ( is_wp_error( $property_adsense_links ) ) {
			return null;
		}

		// Update the AdSenseLinked status and timestamp regardless.
		$this->analytics_4->get_settings()->merge(
			array(
				'adSenseLinked'             => ! empty( $property_adsense_links[0]['adClientCode'] ) && $current_adsense_client_id === $property_adsense_links[0]['adClientCode'],
				'adSenseLinkedLastSyncedAt' => time(),
			)
		);
	}
}
