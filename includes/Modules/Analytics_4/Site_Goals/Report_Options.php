<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Site_Goals\Report_Options
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Site_Goals
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Site_Goals;

use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Events_Provider;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Conversion_Reporting\Conversion_Reporting_Events_Sync;

/**
 * Builds the options of the Site Goals reports, which the email report and the
 * Site Goals insight both run.
 *
 * @since 1.192.0
 * @access private
 * @ignore
 */
class Report_Options {

	/**
	 * Current period, with `startDate` and `endDate` as `YYYY-MM-DD`.
	 *
	 * @since 1.192.0
	 * @var array
	 */
	private $date_range;

	/**
	 * Compare period, with `startDate` and `endDate` as `YYYY-MM-DD`.
	 *
	 * @since 1.192.0
	 * @var array
	 */
	private $compare_range;

	/**
	 * Conversion event names Analytics has found on the site.
	 *
	 * @since 1.192.0
	 * @var array
	 */
	private $detected_events;

	/**
	 * Constructor.
	 *
	 * @since 1.192.0
	 *
	 * @param array $date_range      Current period, with `startDate` and `endDate` as `YYYY-MM-DD`.
	 * @param array $compare_range   Compare period, with `startDate` and `endDate` as `YYYY-MM-DD`.
	 * @param array $detected_events Conversion event names Analytics has found on the site, such as `purchase` or `submit_lead_form`.
	 */
	public function __construct( array $date_range, array $compare_range, array $detected_events ) {
		$this->date_range      = $date_range;
		$this->compare_range   = $compare_range;
		$this->detected_events = $detected_events;
	}

	/**
	 * Gets the store event the Online store widget counts.
	 *
	 * @since 1.192.0
	 *
	 * @return string `purchase` when Analytics has found it on the site, otherwise `add_to_cart`.
	 */
	public function get_primary_store_event() {
		return in_array( 'purchase', $this->detected_events, true ) ? 'purchase' : 'add_to_cart';
	}

	/**
	 * Checks whether Analytics has found an event of a goal type on the site.
	 *
	 * @since 1.192.0
	 *
	 * @param string $goal_type Goal type, `lead` or `ecommerce`.
	 * @return bool True when Analytics has found an event of the goal type, false otherwise.
	 */
	public function has_detected_events( $goal_type ) {
		$goal_type_events = array(
			Conversion_Events_Provider::CATEGORY_LEAD      => Conversion_Reporting_Events_Sync::LEAD_EVENT_NAMES,
			Conversion_Events_Provider::CATEGORY_ECOMMERCE => Conversion_Reporting_Events_Sync::ECOMMERCE_EVENT_NAMES,
		);

		return ! empty( array_intersect( $goal_type_events[ $goal_type ] ?? array(), $this->detected_events ) );
	}

	/**
	 * Gets the `eventName` filter that selects every lead event Analytics has found on the site.
	 *
	 * @since 1.188.0
	 * @since 1.192.0 Moved from `Email_Reporting\Report_Options::get_lead_event_filter()`, and made public.
	 *
	 * @return array Dimension filter array.
	 */
	public function get_lead_event_filter() {
		return array(
			'filterType' => 'inListFilter',
			'value'      => $this->get_detected_lead_events(),
		);
	}

	/**
	 * Gets the options of the report that counts a Site Goals widget's key actions.
	 *
	 * The Leads widget counts every lead event Analytics has found on the site, and the
	 * Online store widget counts its primary store event.
	 *
	 * @since 1.192.0
	 *
	 * @param string $goal_type        Goal type, `lead` or `ecommerce`.
	 * @param string $custom_dimension Optional. Custom dimension slug to split the count by, such as
	 *                                 `googlesitekit_form_id`. Default empty, which returns one row per
	 *                                 event name for the whole site.
	 * @return array Report request options array for the current and the compare period.
	 */
	public function get_key_action_options( $goal_type, $custom_dimension = '' ) {
		$event_filter = Conversion_Events_Provider::CATEGORY_LEAD === $goal_type
			? $this->get_lead_event_filter()
			: $this->get_primary_store_event();

		return $this->with_date_ranges( $this->get_event_count_options( $event_filter, $custom_dimension ) );
	}

	/**
	 * Gets the options of the report that gives the engagement rate and the session count.
	 *
	 * @since 1.192.0
	 *
	 * @param string $custom_dimension Optional. Custom dimension slug to split the rows by, such as
	 *                                 `googlesitekit_event_provider`. Default empty, which returns one
	 *                                 row for the whole site.
	 * @return array Report request options array for the current and the compare period.
	 */
	public function get_engagement_options( $custom_dimension = '' ) {
		$options = array(
			'metrics' => array(
				array( 'name' => 'engagementRate' ),
				array( 'name' => 'sessions' ),
			),
		);

		return $this->with_date_ranges( $this->with_breakdown_dimension( $options, $custom_dimension ) );
	}

	/**
	 * Gets the options of a report that counts the events an `eventName` filter selects.
	 *
	 * @since 1.187.0
	 * @since 1.188.0 Left the date range to the caller, so a discovery report can cover
	 *                days of its own.
	 * @since 1.192.0 Moved from `Email_Reporting\Report_Options::build_event_count_options()`, and made public.
	 *
	 * @param string|array $event_filter     Value for the `eventName` dimension filter. One event name,
	 *                                       such as `purchase`, or a filter array, such as
	 *                                       `array( 'filterType' => 'inListFilter', 'value' => array( 'contact' ) )`.
	 * @param string       $custom_dimension Optional. Custom dimension slug to split the count by, such
	 *                                       as `googlesitekit_form_id`. Default empty, which returns one
	 *                                       row per event name the filter selects.
	 * @return array Report request options array, with no date range, so a report can cover days of its own.
	 */
	public function get_event_count_options( $event_filter, $custom_dimension = '' ) {
		$options = array(
			'metrics'          => array(
				array( 'name' => 'eventCount' ),
			),
			'dimensions'       => array(
				array( 'name' => 'eventName' ),
			),
			'dimensionFilters' => array(
				'eventName' => $event_filter,
			),
		);

		return $this->with_breakdown_dimension( $options, $custom_dimension );
	}

	/**
	 * Gets the lead generation events Analytics has found on the site.
	 *
	 * @since 1.187.0
	 * @since 1.192.0 Moved from `Email_Reporting\Report_Options::get_detected_lead_events()`.
	 *
	 * @return array Lead event names, in the order
	 *               `Conversion_Reporting_Events_Sync::LEAD_EVENT_NAMES` lists them.
	 */
	private function get_detected_lead_events() {
		return array_values( array_intersect( Conversion_Reporting_Events_Sync::LEAD_EVENT_NAMES, $this->detected_events ) );
	}

	/**
	 * Adds a breakdown dimension to report options, and keeps the rows that have no data.
	 *
	 * @since 1.187.0
	 * @since 1.192.0 Moved from `Email_Reporting\Report_Options::with_breakdown_dimension()`.
	 *
	 * @param array  $options          Report request options array.
	 * @param string $custom_dimension Custom dimension slug to split the rows by, such as
	 *                                 `googlesitekit_form_id`. The method adds the `customEvent:`
	 *                                 prefix. An empty slug returns the options unchanged.
	 * @return array Report request options array.
	 */
	private function with_breakdown_dimension( array $options, $custom_dimension ) {
		if ( ! $custom_dimension ) {
			return $options;
		}

		$options['dimensions'][]  = array( 'name' => Analytics_4::CUSTOM_EVENT_PREFIX . $custom_dimension );
		$options['keepEmptyRows'] = true;

		return $options;
	}

	/**
	 * Sets the report to the current period, compared with the compare period.
	 *
	 * @since 1.192.0
	 *
	 * @param array $options Report request options array.
	 * @return array Report request options array, with the dates after its other options.
	 */
	private function with_date_ranges( array $options ) {
		$options['startDate']        = $this->date_range['startDate'];
		$options['endDate']          = $this->date_range['endDate'];
		$options['compareStartDate'] = $this->compare_range['startDate'];
		$options['compareEndDate']   = $this->compare_range['endDate'];

		return $options;
	}
}
