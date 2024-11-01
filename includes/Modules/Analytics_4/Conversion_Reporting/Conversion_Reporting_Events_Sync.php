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
use Google\Site_Kit\Context;

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
	 *
	 * @param Context     $context   Plugin context.
	 * @param Settings    $settings  Settings module settings instance.
	 * @param Analytics_4 $analytics Analytics 4 module instance.
	 */
	public function __construct(
		Context $context,
		Settings $settings,
		Analytics_4 $analytics
	) {
		$this->settings   = $settings;
		$this->analytics  = $analytics;
		$this->transients = new Transients( $context );
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

		$new_events  = array_diff( $detected_events, $saved_detected_events );
		$lost_events = array_diff( $saved_detected_events, $detected_events );

		if ( ! empty( $new_events ) ) {
			$this->transients->set( self::DETECTED_EVENTS_TRANSIENT, array_values( $new_events ) );
		}

		if ( ! empty( $lost_events ) ) {
			$this->transients->set( self::LOST_EVENTS_TRANSIENT, array_values( $lost_events ) );
		}

		if ( empty( $saved_detected_events ) ) {
			$this->transients->set( self::DETECTED_EVENTS_TRANSIENT, $detected_events );
		}

		$this->settings->merge( array( 'detectedEvents' => $detected_events ) );
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
