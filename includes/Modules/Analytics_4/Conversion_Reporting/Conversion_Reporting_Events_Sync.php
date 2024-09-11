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

/**
 * Class providing report implementation for available events for conversion reporting.
 *
 * @since 1.135.0
 * @access private
 * @ignore
 */
class Conversion_Reporting_Events_Sync {

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
	 * Constructor.
	 *
	 * @since 1.135.0
	 *
	 * @param Settings    $settings  Settings module settings instance.
	 * @param Analytics_4 $analytics Analytics 4 module instance.
	 */
	public function __construct(
		Settings $settings,
		Analytics_4 $analytics
	) {
		$this->settings  = $settings;
		$this->analytics = $analytics;
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

		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		if ( empty( $report->rowCount ) ) {
			$this->settings->merge( array( 'detectedEvents' => array() ) );

			return;
		}

		foreach ( $report->rows as $row ) {
			$detected_events[] = $row['dimensionValues'][0]['value'];
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
