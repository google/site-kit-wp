<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Conversion_Reporting\Conversion_Reporting_Provider
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Conversion_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Events_Provider;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit\Modules\Analytics_4\Site_Goals_Site_Settings;

/**
 * Class providing the integration of conversion reporting.
 *
 * @since 1.135.0
 * @access private
 * @ignore
 */
class Conversion_Reporting_Provider {

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * User_Options instance.
	 *
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Analytics_4 instance.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

	/**
	 * Site_Goals_Site_Settings instance.
	 *
	 * @var Site_Goals_Site_Settings
	 */
	private $site_goals_site_settings;

	/**
	 * Conversion_Reporting_Cron instance.
	 *
	 * @var Conversion_Reporting_Cron
	 */
	private Conversion_Reporting_Cron $cron;

	/**
	 * Conversion_Reporting_Events_Sync instance.
	 *
	 * @var Conversion_Reporting_Events_Sync
	 */
	private Conversion_Reporting_Events_Sync $events_sync;

	/**
	 * Constructor.
	 *
	 * @since 1.135.0
	 * @since 1.139.0 Added Context to constructor.
	 *
	 * @param Context      $context      Plugin context.
	 * @param Settings     $settings     Settings instance.
	 * @param User_Options $user_options User_Options instance.
	 * @param Analytics_4  $analytics    analytics_4 instance.
	 */
	public function __construct(
		Context $context,
		Settings $settings,
		User_Options $user_options,
		Analytics_4 $analytics
	) {
		$this->context      = $context;
		$this->user_options = $user_options;
		$this->analytics    = $analytics;

		$transients                     = new Transients( $context );
		$this->site_goals_site_settings = new Site_Goals_Site_Settings( new Options( $context ) );
		$new_badge_events_sync          = new Conversion_Reporting_New_Badge_Events_Sync( $transients );
		$this->events_sync              = new Conversion_Reporting_Events_Sync(
			$settings,
			$transients,
			$this->analytics,
			$new_badge_events_sync
		);
		$this->cron                     = new Conversion_Reporting_Cron( fn() => $this->cron_callback() );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.135.0
	 */
	public function register() {
		$this->cron->register();

		add_action( 'load-toplevel_page_googlesitekit-dashboard', fn () => $this->on_dashboard_load() );
	}

	/**
	 * Handles the googlesitekit-dashboard page load callback.
	 *
	 * @since 1.135.0
	 */
	protected function on_dashboard_load() {
		$this->cron->maybe_schedule_cron();
	}

	/**
	 * Handles the cron callback.
	 *
	 * @since 1.135.0
	 */
	protected function cron_callback() {
		$owner_id     = $this->analytics->get_owner_id();
		$restore_user = $this->user_options->switch_user( $owner_id );

		$this->events_sync->sync_detected_events();
		$this->update_active_site_goals_widgets();

		$restore_user();
	}

	/**
	 * Updates active widgets based on detected events and active categories.
	 *
	 * @since 1.182.0
	 */
	protected function update_active_site_goals_widgets() {
		$settings        = $this->analytics->get_settings()->get();
		$detected_events = $settings['detectedEvents'] ?? array();

		$active_categories = ( new Conversion_Tracking( $this->context ) )->get_active_provider_categories();

		$active_widgets = array();

		if (
			! empty( array_intersect( Conversion_Reporting_Events_Sync::ECOMMERCE_EVENT_NAMES, $detected_events ) )
			&& in_array( Conversion_Events_Provider::CATEGORY_ECOMMERCE, $active_categories, true )
		) {
			$active_widgets[] = Conversion_Events_Provider::CATEGORY_ECOMMERCE;
		}

		if (
			! empty( array_intersect( Conversion_Reporting_Events_Sync::LEAD_EVENT_NAMES, $detected_events ) )
			&& in_array( Conversion_Events_Provider::CATEGORY_LEAD, $active_categories, true )
		) {
			$active_widgets[] = Conversion_Events_Provider::CATEGORY_LEAD;
		}

		if ( ! empty( $active_widgets ) ) {
			$this->site_goals_site_settings->merge( array( 'activeWidgets' => $active_widgets ) );
		}
	}
}
