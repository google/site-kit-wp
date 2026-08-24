<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Email_Reporting\Report_Request_Assembler
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Email_Reporting;

use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Email_Reporting\Report_Options as Analytics_Report_Options;

/**
 * Builds Analytics 4 batch requests and maps responses for email reporting.
 *
 * @since 1.170.0
 * @access private
 * @ignore
 */
class Report_Request_Assembler {

	/**
	 * Payload key of the report that counts online store key actions across the whole site.
	 *
	 * @since n.e.x.t
	 */
	const SITE_GOALS_ONLINE_STORE_PRIMARY_KEY = 'site_goals_online_store_primary';

	/**
	 * Payload key of the report that counts online store key actions, one row per event provider.
	 *
	 * @since n.e.x.t
	 */
	const SITE_GOALS_ONLINE_STORE_PRIMARY_BY_PROVIDER_KEY = 'site_goals_online_store_primary_by_provider';

	/**
	 * Payload key of the report that counts lead generation key actions across the whole site.
	 *
	 * @since n.e.x.t
	 */
	const SITE_GOALS_LEAD_PRIMARY_KEY = 'site_goals_lead_primary';

	/**
	 * Payload key of the report that counts lead generation key actions, one row per form.
	 *
	 * @since n.e.x.t
	 */
	const SITE_GOALS_LEAD_PRIMARY_BY_FORM_KEY = 'site_goals_lead_primary_by_form';

	/**
	 * Payload key of the report that holds the engagement rate and the session count of the whole site.
	 *
	 * @since n.e.x.t
	 */
	const SITE_GOALS_ENGAGEMENT_KEY = 'site_goals_engagement';

	/**
	 * Payload key of the report that holds the engagement rate and the session count, one row per event provider.
	 *
	 * @since n.e.x.t
	 */
	const SITE_GOALS_ENGAGEMENT_BY_PROVIDER_KEY = 'site_goals_engagement_by_provider';

	/**
	 * Payload key of the report that holds the engagement rate and the session count, one row per form.
	 *
	 * @since n.e.x.t
	 */
	const SITE_GOALS_ENGAGEMENT_BY_FORM_KEY = 'site_goals_engagement_by_form';

	/**
	 * Every payload key a Site Goals report sits under.
	 *
	 * Each Site Goals section reads more than one of these reports, so `Report_Data_Builder`
	 * skips every key in this list rather than build one section per report.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	const SITE_GOALS_REQUEST_KEYS = array(
		self::SITE_GOALS_ONLINE_STORE_PRIMARY_KEY,
		self::SITE_GOALS_ONLINE_STORE_PRIMARY_BY_PROVIDER_KEY,
		self::SITE_GOALS_LEAD_PRIMARY_KEY,
		self::SITE_GOALS_LEAD_PRIMARY_BY_FORM_KEY,
		self::SITE_GOALS_ENGAGEMENT_KEY,
		self::SITE_GOALS_ENGAGEMENT_BY_PROVIDER_KEY,
		self::SITE_GOALS_ENGAGEMENT_BY_FORM_KEY,
	);

	/**
	 * Report options instance.
	 *
	 * @since 1.170.0
	 * @var Analytics_Report_Options
	 */
	private $report_options;

	/**
	 * Constructor.
	 *
	 * @since 1.170.0
	 *
	 * @param Analytics_Report_Options $report_options Report options instance.
	 */
	public function __construct( Analytics_Report_Options $report_options ) {
		$this->report_options = $report_options;
	}

	/**
	 * Builds Analytics 4 batch report requests.
	 *
	 * @since 1.170.0
	 * @since n.e.x.t Added the Site Goals report requests, and fixed the author and
	 *                category dimension keys, which never matched the availability map.
	 *
	 * @param array $custom_titles Optional. Custom titles keyed by request key.
	 * @return array Array of report requests keyed by payload key.
	 */
	public function build_requests( array $custom_titles = array() ) {
		$requests = array(
			'total_visitors'   => $this->report_options->get_total_visitors_options(),
			'traffic_channels' => $this->report_options->get_traffic_channels_options(),
			'popular_content'  => $this->report_options->get_popular_content_options(),
		);

		if ( $this->report_options->is_audience_segmentation_enabled() ) {
			$requests['new_visitors']       = $this->report_options->get_new_visitors_options();
			$requests['returning_visitors'] = $this->report_options->get_returning_visitors_options();

			list( $custom_audience_requests, $custom_titles_map ) = $this->build_custom_audience_requests();
			$requests      = array_merge( $requests, $custom_audience_requests );
			$custom_titles = array_merge( $custom_titles, $custom_titles_map );
		}

		if ( $this->report_options->has_custom_dimension_data( Analytics_4::CUSTOM_DIMENSION_POST_AUTHOR ) ) {
			$requests['top_authors'] = $this->report_options->get_top_authors_options();
		}

		if ( $this->report_options->has_custom_dimension_data( Analytics_4::CUSTOM_DIMENSION_POST_CATEGORIES ) ) {
			$requests['top_categories'] = $this->report_options->get_top_categories_options();
		}

		$requests = array_merge( $requests, $this->build_site_goals_requests() );

		return array( $requests, $custom_titles );
	}

	/**
	 * Builds the Site Goals requests for each widget whose events Analytics has detected.
	 *
	 * The online store widget and the lead generation widget each need their own key
	 * action count, plus the engagement rate and the session count. Two widgets with no
	 * breakdown dimension write the same `site_goals_engagement` key, so the batch asks
	 * for that report once.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Report requests keyed by payload key.
	 */
	private function build_site_goals_requests() {
		$requests = array();

		if ( $this->report_options->has_ecommerce_events() ) {
			if ( $this->report_options->has_custom_dimension_data( Analytics_4::CUSTOM_DIMENSION_EVENT_PROVIDER ) ) {
				$requests[ self::SITE_GOALS_ONLINE_STORE_PRIMARY_BY_PROVIDER_KEY ] = $this->report_options->get_online_store_primary_options( Analytics_4::CUSTOM_DIMENSION_EVENT_PROVIDER );
				$requests[ self::SITE_GOALS_ENGAGEMENT_BY_PROVIDER_KEY ]           = $this->report_options->get_engagement_options( Analytics_4::CUSTOM_DIMENSION_EVENT_PROVIDER );
			} else {
				$requests[ self::SITE_GOALS_ONLINE_STORE_PRIMARY_KEY ] = $this->report_options->get_online_store_primary_options();
				$requests[ self::SITE_GOALS_ENGAGEMENT_KEY ]           = $this->report_options->get_engagement_options();
			}
		}

		if ( $this->report_options->has_lead_events() ) {
			if ( $this->report_options->has_custom_dimension_data( Analytics_4::CUSTOM_DIMENSION_FORM_ID ) ) {
				$requests[ self::SITE_GOALS_LEAD_PRIMARY_BY_FORM_KEY ] = $this->report_options->get_lead_primary_options( Analytics_4::CUSTOM_DIMENSION_FORM_ID );
				$requests[ self::SITE_GOALS_ENGAGEMENT_BY_FORM_KEY ]   = $this->report_options->get_engagement_options( Analytics_4::CUSTOM_DIMENSION_FORM_ID );
			} else {
				$requests[ self::SITE_GOALS_LEAD_PRIMARY_KEY ] = $this->report_options->get_lead_primary_options();
				$requests[ self::SITE_GOALS_ENGAGEMENT_KEY ]   = $this->report_options->get_engagement_options();
			}
		}

		return $requests;
	}

	/**
	 * Builds custom audience requests and titles from configured audiences.
	 *
	 * @since 1.170.0
	 *
	 * @return array Tuple of request map and titles map.
	 */
	private function build_custom_audience_requests() {
		$custom_requests = array();
		$custom_titles   = array();

		$custom_audiences = $this->report_options->get_custom_audiences_options();
		if ( empty( $custom_audiences['options'] ) || empty( $custom_audiences['audiences'] ) ) {
			return array( $custom_requests, $custom_titles );
		}

		$site_kit_audience_resources = $this->report_options->get_site_kit_audience_resource_names();
		$base_options                = $custom_audiences['options'];

		foreach ( $custom_audiences['audiences'] as $index => $audience ) {
			$resource_name = $audience['resourceName'] ?? '';
			$display_name  = $audience['displayName'] ?? $resource_name;

			if ( '' === $resource_name ) {
				continue;
			}

			// Avoid duplicating Site Kit-provided audiences (new/returning).
			if ( in_array( $resource_name, $site_kit_audience_resources, true ) ) {
				continue;
			}

			$custom_options = $base_options;
			$custom_options['dimensionFilters']['audienceResourceName'] = array( $resource_name );

			$request_key                     = sprintf( 'custom_audience_%d', $index );
			$custom_requests[ $request_key ] = $custom_options;
			$custom_titles[ $request_key ]   = $display_name;
		}

		return array( $custom_requests, $custom_titles );
	}
}
