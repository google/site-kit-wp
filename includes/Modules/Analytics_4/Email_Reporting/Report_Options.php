<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Email_Reporting\Report_Options
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * phpcs:disable PHPCS.Commenting.RequireDocTagDescription -- Pre-existing violations; tracked for follow-up cleanup.
 */

namespace Google\Site_Kit\Modules\Analytics_4\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Email_Reporting\Report_Options\Report_Options as Base_Report_Options;
use Google\Site_Kit\Core\Storage\Options as Core_Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Audience_Settings as User_Audience_Settings;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Audience_Settings as Module_Audience_Settings;
use Google\Site_Kit\Modules\Analytics_4\Conversion_Reporting\Conversion_Reporting_Events_Sync;

/**
 * Builds Analytics 4 report option payloads for email reporting.
 *
 * @since 1.167.0
 * @access private
 * @ignore
 */
class Report_Options extends Base_Report_Options {

	/**
	 * Cached custom dimension availability flags.
	 *
	 * @since 1.170.0
	 * @var array
	 */
	private $custom_dimension_availability = array();

	/**
	 * Conversion event names Analytics has detected on the site.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	private $detected_events = array();

	/**
	 * Whether audience segmentation is enabled.
	 *
	 * Null value means the 'audienceSegmentationSetupCompletedBy'
	 * setting value will be used to determine whether Audience
	 * Segmentation is enabled.
	 *
	 * See `is_audience_segmentation_enabled` method for more info.
	 *
	 * @since 1.170.0
	 * @var bool|null
	 */
	private $audience_segmentation_enabled = null;

	/**
	 * Audience configuration helper.
	 *
	 * @since 1.167.0
	 *
	 * @var Audience_Config
	 */
	private $audience_config;

	/**
	 * Constructor.
	 *
	 * @since 1.167.0
	 *
	 * @param array   $date_range    Current period range array.
	 * @param array   $compare_range Compare period range array.
	 * @param Context $context       Plugin context.
	 */
	public function __construct(
		$date_range,
		$compare_range,
		Context $context
	) {
		parent::__construct( $date_range, $compare_range );
		$user_settings         = new User_Audience_Settings( new User_Options( $context ) );
		$module_settings       = new Module_Audience_Settings( new Core_Options( $context ) );
		$this->audience_config = new Audience_Config( $user_settings, $module_settings );
	}

	/**
	 * Sets custom dimension availability map.
	 *
	 * @since 1.170.0
	 *
	 * @param array $availability Availability map keyed by custom dimension slug.
	 */
	public function set_custom_dimension_availability( $availability ) {
		$this->custom_dimension_availability = $availability;
	}

	/**
	 * Sets the conversion event names Analytics has detected.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $detected_events Detected event names, such as `purchase` or `submit_lead_form`.
	 */
	public function set_detected_events( array $detected_events ) {
		$this->detected_events = $detected_events;
	}

	/**
	 * Whether Analytics has detected any ecommerce event.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True when the detected events hold an ecommerce event, false otherwise.
	 */
	public function has_ecommerce_events() {
		return ! empty( array_intersect( Conversion_Reporting_Events_Sync::ECOMMERCE_EVENT_NAMES, $this->detected_events ) );
	}

	/**
	 * Whether Analytics has detected any lead generation event.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True when the detected events hold a lead event, false otherwise.
	 */
	public function has_lead_events() {
		return ! empty( $this->get_detected_lead_events() );
	}

	/**
	 * Gets the lead generation events among the detected events.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Detected lead event names, in the order
	 *               `Conversion_Reporting_Events_Sync::LEAD_EVENT_NAMES` lists them.
	 */
	private function get_detected_lead_events() {
		return array_values( array_intersect( Conversion_Reporting_Events_Sync::LEAD_EVENT_NAMES, $this->detected_events ) );
	}

	/**
	 * Sets audience segmentation flag.
	 *
	 * @since 1.170.0
	 *
	 * @param bool $enabled Whether audience segmentation is enabled.
	 */
	public function set_audience_segmentation_enabled( $enabled ) {
		$this->audience_segmentation_enabled = (bool) $enabled;
	}

	/**
	 * Whether audience segmentation is enabled.
	 *
	 * @since 1.170.0
	 *
	 * @return bool
	 */
	public function is_audience_segmentation_enabled() {
		if ( null !== $this->audience_segmentation_enabled ) {
			return (bool) $this->audience_segmentation_enabled;
		}

		$settings = $this->audience_config->get_module_settings(); // @phpstan-ignore method.notFound
		return ! empty( $settings['audienceSegmentationSetupCompletedBy'] );
	}

	/**
	 * Whether custom dimension data is available.
	 *
	 * @since 1.170.0
	 *
	 * @param string $custom_dimension Custom dimension slug.
	 * @return bool
	 */
	public function has_custom_dimension_data( $custom_dimension ) {
		return ! empty( $this->custom_dimension_availability[ $custom_dimension ] );
	}

	/**
	 * Gets report options for total visitors.
	 *
	 * @since 1.167.0
	 *
	 * @return array Report request options array.
	 */
	public function get_total_visitors_options() {
		return $this->with_current_range(
			array(
				'metrics' => array(
					array( 'name' => 'totalUsers' ),
				),
			),
			true
		);
	}

	/**
	 * Gets report options for new visitors.
	 *
	 * @since 1.167.0
	 *
	 * @return array Report request options array.
	 */
	public function get_new_visitors_options() {
		return $this->build_audience_report_options( 'new-visitors', 'new' );
	}

	/**
	 * Gets report options for returning visitors.
	 *
	 * @since 1.167.0
	 *
	 * @return array Report request options array.
	 */
	public function get_returning_visitors_options() {
		return $this->build_audience_report_options( 'returning-visitors', 'returning' );
	}

	/**
	 * Gets report options for custom audiences (user configured).
	 *
	 * @since 1.167.0
	 *
	 * @return array Report payload, holding report options array and audience metadata.
	 */
	public function get_custom_audiences_options() {
		$audience_data = $this->audience_config->get_configured_audiences();

		if ( empty( $audience_data['resource_names'] ) ) {
			return array(
				'options'   => array(),
				'audiences' => array(),
			);
		}

		$options = $this->with_current_range(
			array(
				'metrics'          => array(
					array( 'name' => 'totalUsers' ),
				),
				'dimensions'       => array(
					array( 'name' => 'audienceResourceName' ),
				),
				'dimensionFilters' => array(
					'audienceResourceName' => $audience_data['resource_names'],
				),
				'keepEmptyRows'    => true,
			),
			true
		);

		return array(
			'options'   => $options,
			'audiences' => $audience_data['audiences'],
		);
	}

	/**
	 * Gets resource names for Site Kit provided audiences (new/returning).
	 *
	 * @since 1.170.0
	 *
	 * @return array List of audience resource names.
	 */
	public function get_site_kit_audience_resource_names() {
		$map = $this->audience_config->get_site_kit_audience_map();
		return array_values( $map );
	}

	/**
	 * Gets report options for the traffic channels by visitor count section.
	 *
	 * @since 1.167.0
	 *
	 * @return array Report request options array.
	 */
	public function get_traffic_channels_options() {
		return $this->with_current_range(
			array(
				'metrics'       => array(
					array( 'name' => 'totalUsers' ),
				),
				'dimensions'    => array(
					array( 'name' => 'sessionDefaultChannelGroup' ),
				),
				'orderby'       => array(
					array(
						'metric' => array( 'metricName' => 'totalUsers' ),
						'desc'   => true,
					),
				),
				'limit'         => 3,
				'keepEmptyRows' => true,
			),
			true
		);
	}

	/**
	 * Gets report options for pages with the most pageviews.
	 *
	 * @since 1.167.0
	 *
	 * @return array Report request options array.
	 */
	public function get_popular_content_options() {
		return $this->with_current_range(
			array(
				'metrics'       => array(
					array( 'name' => 'screenPageViews' ),
				),
				'dimensions'    => array(
					array( 'name' => 'pageTitle' ),
					array( 'name' => 'pagePath' ),
				),
				'orderby'       => array(
					array(
						'metric' => array( 'metricName' => 'screenPageViews' ),
						'desc'   => true,
					),
				),
				'limit'         => 3,
				'keepEmptyRows' => true,
			),
			true
		);
	}

	/**
	 * Gets report options for top authors by pageviews.
	 *
	 * @since 1.167.0
	 *
	 * @return array Report request options array.
	 */
	public function get_top_authors_options() {
		return $this->with_current_range(
			array(
				'metrics'          => array(
					array( 'name' => 'screenPageViews' ),
				),
				'dimensions'       => array(
					array(
						'name' => sprintf(
							'customEvent:%s',
							Analytics_4::CUSTOM_DIMENSION_POST_AUTHOR
						),
					),
				),
				'dimensionFilters' => array(
					sprintf( 'customEvent:%s', Analytics_4::CUSTOM_DIMENSION_POST_AUTHOR ) => array(
						'filterType'    => 'emptyFilter',
						'notExpression' => true,
					),
				),
				'orderby'          => array(
					array(
						'metric' => array( 'metricName' => 'screenPageViews' ),
						'desc'   => true,
					),
				),
				'limit'            => 3,
				'keepEmptyRows'    => true,
			),
			true
		);
	}

	/**
	 * Gets report options for top categories by pageviews.
	 *
	 * @since 1.167.0
	 *
	 * @return array Report request options array.
	 */
	public function get_top_categories_options() {
		return $this->with_current_range(
			array(
				'metrics'          => array(
					array( 'name' => 'screenPageViews' ),
				),
				'dimensions'       => array(
					array(
						'name' => sprintf(
							'customEvent:%s',
							Analytics_4::CUSTOM_DIMENSION_POST_CATEGORIES
						),
					),
				),
				'dimensionFilters' => array(
					sprintf( 'customEvent:%s', Analytics_4::CUSTOM_DIMENSION_POST_CATEGORIES ) => array(
						'filterType'    => 'emptyFilter',
						'notExpression' => true,
					),
				),
				'orderby'          => array(
					array(
						'metric' => array( 'metricName' => 'screenPageViews' ),
						'desc'   => true,
					),
				),
				'limit'            => 3,
				'keepEmptyRows'    => true,
			),
			true
		);
	}

	/**
	 * Gets report options for the online store key action count.
	 *
	 * The options count `purchase` when the detected events hold it, and `add_to_cart` otherwise.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $custom_dimension Optional. Custom dimension slug to split the count by, such as
	 *                                 `googlesitekit_event_provider`. Default empty, which returns one
	 *                                 row for the whole site.
	 * @return array Report request options array.
	 */
	public function get_online_store_primary_options( $custom_dimension = '' ) {
		$primary_store_event = in_array( 'purchase', $this->detected_events, true ) ? 'purchase' : 'add_to_cart';

		return $this->build_event_count_options( $primary_store_event, $custom_dimension );
	}

	/**
	 * Gets report options for the lead generation key action count.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $custom_dimension Optional. Custom dimension slug to split the count by, such as
	 *                                 `googlesitekit_form_id`. Default empty, which returns one row per
	 *                                 detected lead event.
	 * @return array Report request options array.
	 */
	public function get_lead_primary_options( $custom_dimension = '' ) {
		return $this->build_event_count_options(
			array(
				'filterType' => 'inListFilter',
				'value'      => $this->get_detected_lead_events(),
			),
			$custom_dimension
		);
	}

	/**
	 * Gets report options for the engagement rate and the session count.
	 *
	 * The key action rate divides the key action count by the session count.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $custom_dimension Optional. Custom dimension slug to split the rows by, such as
	 *                                 `googlesitekit_event_provider`. Default empty, which returns one
	 *                                 row for the whole site.
	 * @return array Report request options array.
	 */
	public function get_engagement_options( $custom_dimension = '' ) {
		$options = array(
			'metrics' => array(
				array( 'name' => 'engagementRate' ),
				array( 'name' => 'sessions' ),
			),
		);

		$options = $this->with_breakdown_dimension( $options, $custom_dimension );

		return $this->with_current_range( $options, true );
	}

	/**
	 * Adds a breakdown dimension to report options, and keeps the rows that hold no data.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $options          Report request options array.
	 * @param string $custom_dimension Custom dimension slug to split the rows by, such as
	 *                                 `googlesitekit_form_id`. The method adds the `customEvent:`
	 *                                 prefix. Empty returns the options unchanged.
	 * @return array Report request options array.
	 */
	private function with_breakdown_dimension( $options, $custom_dimension ) {
		if ( ! $custom_dimension ) {
			return $options;
		}

		$options['dimensions'][]  = array( 'name' => Analytics_4::CUSTOM_EVENT_PREFIX . $custom_dimension );
		$options['keepEmptyRows'] = true;

		return $options;
	}

	/**
	 * Builds report options that count the events an `eventName` filter selects.
	 *
	 * @since n.e.x.t
	 *
	 * @param string|array $event_filter     Value for the `eventName` dimension filter. One event name,
	 *                                       such as `purchase`, or a filter array, such as
	 *                                       `array( 'filterType' => 'inListFilter', 'value' => array( 'contact' ) )`.
	 * @param string       $custom_dimension Optional. Custom dimension slug to split the count by, such
	 *                                       as `googlesitekit_form_id`. Default empty, which returns one
	 *                                       row per event name the filter selects.
	 * @return array Report request options array.
	 */
	private function build_event_count_options( $event_filter, $custom_dimension = '' ) {
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

		$options = $this->with_breakdown_dimension( $options, $custom_dimension );

		return $this->with_current_range( $options, true );
	}

	/**
	 * Builds report options for Site Kit-created audiences, with a fallback to the core dimension if unavailable.
	 *
	 * @since 1.167.0
	 *
	 * @param string $audience_slug    Audience slug (e.g. 'new-visitors').
	 * @param string $fallback_segment Fallback segment value for newVsReturning.
	 * @return array Report request options array.
	 */
	private function build_audience_report_options( $audience_slug, $fallback_segment ) {
		$site_kit_audiences = $this->audience_config->get_site_kit_audience_map();
		$resource_name      = $site_kit_audiences[ $audience_slug ] ?? '';

		if ( $resource_name ) {
			return $this->with_current_range(
				array(
					'metrics'          => array(
						array( 'name' => 'totalUsers' ),
					),
					'dimensions'       => array(
						array( 'name' => 'audienceResourceName' ),
					),
					'dimensionFilters' => array(
						'audienceResourceName' => array(
							'value' => $resource_name,
						),
					),
					'keepEmptyRows'    => true,
				),
				true
			);
		}

		return $this->with_current_range(
			array(
				'metrics'          => array(
					array( 'name' => 'activeUsers' ),
				),
				'dimensions'       => array(
					array( 'name' => 'newVsReturning' ),
				),
				'dimensionFilters' => array(
					'newVsReturning' => array(
						'value' => $fallback_segment,
					),
				),
				'keepEmptyRows'    => true,
			),
			true
		);
	}
}
