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

		$conversion_events = $this->report_options->get_conversion_events();
		$has_add_to_cart   = in_array( 'add_to_cart', $conversion_events, true );
		$has_purchase      = in_array( 'purchase', $conversion_events, true );

		if ( $has_add_to_cart || $has_purchase ) {
			$requests['total_conversion_events'] = $this->report_options->get_total_conversion_events_options();

			if ( $has_add_to_cart ) {
				$requests['products_added_to_cart'] = $this->report_options->get_products_added_to_cart_options();
			}

			if ( $has_purchase ) {
				$requests['purchases'] = $this->report_options->get_purchases_options();
			}
		}

		if ( $this->report_options->is_audience_segmentation_enabled() ) {
			$requests['new_visitors']       = $this->report_options->get_new_visitors_options();
			$requests['returning_visitors'] = $this->report_options->get_returning_visitors_options();

			list( $custom_audience_requests, $custom_titles_map ) = $this->build_custom_audience_requests();
			$requests      = array_merge( $requests, $custom_audience_requests );
			$custom_titles = array_merge( $custom_titles, $custom_titles_map );
		}

		if ( $this->report_options->has_custom_dimension_data( 'postAuthor' ) ) {
			$requests['top_authors'] = $this->report_options->get_top_authors_options();
		}

		if ( $this->report_options->has_custom_dimension_data( 'postCategories' ) ) {
			$requests['top_categories'] = $this->report_options->get_top_categories_options();
		}

		return array( $requests, $custom_titles );
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
