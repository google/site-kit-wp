<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Conversion_Reporting\Conversion_Reporting_Events_Sync
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Conversion_Reporting;

use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit\Core\Storage\Transients;

/**
 * Class providing report implementation for available events for conversion reporting.
 *
 * @since 1.135.0
 * @access private
 * @ignore
 */
class Conversion_Reporting_Events_Sync {

	/**
	 * The detected events transient name.
	 */
	public const DETECTED_EVENTS_TRANSIENT = 'googlesitekit_conversion_reporting_detected_events';

	/**
	 * The lost events transient name.
	 */
	public const LOST_EVENTS_TRANSIENT = 'googlesitekit_conversion_reporting_lost_events';

	const EVENT_NAMES = array(
		'add_to_cart',
		'purchase',
		'submit_lead_form',
		'generate_lead',
		'contact',
	);

	/**
	 * Settings instance.
	 *
	 * @var Settings
	 */
	private $settings;

	/**
	 * Analytics_4 instance.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

	/**
	 * Conversion_Reporting_New_Badge_Events_Sync instance.
	 *
	 * @var Conversion_Reporting_New_Badge_Events_Sync
	 */
	private $new_badge_events_sync;

	/**
	 * Transients instance.
	 *
	 * @since 1.139.0
	 * @var Transients
	 */
	protected $transients;

	/**
	 * Constructor.
	 *
	 * @since 1.135.0
	 * @since 1.139.0 Added $context param to constructor.
	 * @since 1.144.0 Added $transients and $new_badge_events_sync params to constructor, and removed $context.
	 *
	 * @param Settings                                   $settings              Settings module settings instance.
	 * @param Transients                                 $transients            Transients instance.
	 * @param Analytics_4                                $analytics             Analytics 4 module instance.
	 * @param Conversion_Reporting_New_Badge_Events_Sync $new_badge_events_sync Conversion_Reporting_New_Badge_Events_Sync instance.
	 */
	public function __construct(
		Settings $settings,
		Transients $transients,
		Analytics_4 $analytics,
		Conversion_Reporting_New_Badge_Events_Sync $new_badge_events_sync
	) {
		$this->settings              = $settings;
		$this->transients            = $transients;
		$this->analytics             = $analytics;
		$this->new_badge_events_sync = $new_badge_events_sync;
	}

	/**
	 * Syncs detected events into settings.
	 *
	 * @since 1.135.0
	 */
	public function sync_detected_events() {
		$report          = $this->get_report();
		$detected_events = array();

		if ( is_wp_error( $report ) ) {
			return;
		}

		// Get current stored detected events.
		$settings              = $this->settings->get();
		$saved_detected_events = isset( $settings['detectedEvents'] ) ? $settings['detectedEvents'] : array();

		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		if ( empty( $report->rowCount ) ) {
			$this->settings->merge( array( 'detectedEvents' => array() ) );

			$this->transients->delete( self::DETECTED_EVENTS_TRANSIENT );

			if ( ! empty( $saved_detected_events ) ) {
				$this->transients->set( self::LOST_EVENTS_TRANSIENT, $saved_detected_events );
			}

			return;
		}

		foreach ( $report->rows as $row ) {
			$detected_events[] = $row['dimensionValues'][0]['value'];
		}
		$settings_partial = array( 'detectedEvents' => $detected_events );

		$this->maybe_update_new_and_lost_events(
			$detected_events,
			$saved_detected_events,
			$settings_partial
		);

		$this->settings->merge( $settings_partial );
	}

	/**
	 * Saves new and lost events transients.
	 *
	 * @since 1.144.0
	 *
	 * @param array $detected_events       Currently detected events array.
	 * @param array $saved_detected_events Previously saved detected events array.
	 * @param array $settings_partial      Analaytics settings partial.
	 */
	protected function maybe_update_new_and_lost_events( $detected_events, $saved_detected_events, &$settings_partial ) {
		$new_events  = array_diff( $detected_events, $saved_detected_events );
		$lost_events = array_diff( $saved_detected_events, $detected_events );

		if ( ! empty( $new_events ) ) {
			$this->transients->set( self::DETECTED_EVENTS_TRANSIENT, array_values( $new_events ) );
			$this->new_badge_events_sync->sync_new_badge_events( $new_events );
			$settings_partial['newConversionEventsLastUpdateAt'] = time();

			// Remove new events from lost events if present.
			$saved_lost_events = $this->transients->get( self::LOST_EVENTS_TRANSIENT );
			if ( $saved_lost_events ) {
				$filtered_lost_events = array_diff( $saved_lost_events, $new_events );
				$lost_events          = array_merge( $lost_events, $filtered_lost_events );
			}
		}

		if ( ! empty( $lost_events ) ) {
			$this->transients->set( self::LOST_EVENTS_TRANSIENT, array_values( $lost_events ) );
			$settings_partial['lostConversionEventsLastUpdateAt'] = time();
		}

		if ( empty( $saved_detected_events ) ) {
			$this->transients->set( self::DETECTED_EVENTS_TRANSIENT, $detected_events );
		}
	}

	/**
	 * Retrieves the GA4 report for filtered events.
	 *
	 * @since 1.135.0
	 */
	protected function get_report() {
		$options = array(
			// The 'metrics' parameter is required. 'eventCount' is used to ensure the request succeeds.
			'metrics'          => array( array( 'name' => 'eventCount' ) ),
			'dimensions'       => array(
				array(
					'name' => 'eventName',
				),
			),
			'startDate'        => gmdate( 'Y-m-d', strtotime( '-90 days' ) ),
			'endDate'          => gmdate( 'Y-m-d', strtotime( '-1 day' ) ),
			'dimensionFilters' => array(
				'eventName' => array(
					'filterType' => 'inListFilter',
					'value'      => self::EVENT_NAMES,
				),
			),
			'limit'            => '20',
		);

		return $this->analytics->get_data( 'report', $options );
	}
}
