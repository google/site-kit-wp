<?php
/**
 * Class Google\Site_Kit\Modules\Search_Console\Email_Reporting\Report_Request_Assembler
 *
 * @package   Google\Site_Kit\Modules\Search_Console\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Search_Console\Email_Reporting;

use WP_Error;

/**
 * Builds Search Console batch requests and maps responses for email reporting.
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
	 * @var Report_Options
	 */
	private $report_options;

	/**
	 * Constructor.
	 *
	 * @since 1.170.0
	 *
	 * @param Report_Options $report_options Report options instance.
	 */
	public function __construct( Report_Options $report_options ) {
		$this->report_options = $report_options;
	}

	/**
	 * Builds Search Console batch requests.
	 *
	 * @since 1.170.0
	 *
	 * @return array Tuple of (requests, request_map).
	 */
	public function build_requests() {
		$requests    = array();
		$request_map = array();

		$this->add_single_period_requests( $requests, $request_map );
		$this->add_compare_period_requests( $requests, $request_map );

		return array( $requests, $request_map );
	}

	/**
	 * Adds current-period Search Console requests.
	 *
	 * @since 1.170.0
	 *
	 * @param array $requests    Request list (by reference).
	 * @param array $request_map Request metadata map (by reference).
	 */
	private function add_single_period_requests( &$requests, &$request_map ) {
		$this->add_request( $requests, $request_map, 'total_impressions', 'total_impressions', $this->report_options->get_total_impressions_options() );
		$this->add_request( $requests, $request_map, 'total_clicks', 'total_clicks', $this->report_options->get_total_clicks_options() );

		$top_ctr_keywords = $this->report_options->get_top_ctr_keywords_options();
		$this->add_request( $requests, $request_map, 'top_ctr_keywords_current', 'top_ctr_keywords', $top_ctr_keywords, 'current' );

		$top_pages_by_clicks = $this->report_options->get_top_pages_by_clicks_options();
		$this->add_request( $requests, $request_map, 'top_pages_by_clicks_current', 'top_pages_by_clicks', $top_pages_by_clicks, 'current' );

		$keywords_ctr_increase = $this->report_options->get_keywords_ctr_increase_options();
		$this->add_request( $requests, $request_map, 'keywords_ctr_increase_current', 'keywords_ctr_increase', $keywords_ctr_increase, 'current' );

		$pages_clicks_increase = $this->report_options->get_pages_clicks_increase_options();
		$this->add_request( $requests, $request_map, 'pages_clicks_increase_current', 'pages_clicks_increase', $pages_clicks_increase, 'current' );
	}

	/**
	 * Adds compare-period Search Console requests.
	 *
	 * @since 1.170.0
	 *
	 * @param array $requests    Request list (by reference).
	 * @param array $request_map Request metadata map (by reference).
	 */
	private function add_compare_period_requests( &$requests, &$request_map ) {
		$compare_range = $this->report_options->get_compare_range();
		if ( empty( $compare_range ) ) {
			return;
		}

		$compare_options = array(
			'startDate' => $compare_range['startDate'],
			'endDate'   => $compare_range['endDate'],
		);

		$this->add_request(
			$requests,
			$request_map,
			'top_ctr_keywords_compare',
			'top_ctr_keywords',
			array_merge( $this->report_options->get_top_ctr_keywords_options(), $compare_options ),
			'compare'
		);

		$this->add_request(
			$requests,
			$request_map,
			'top_pages_by_clicks_compare',
			'top_pages_by_clicks',
			array_merge( $this->report_options->get_top_pages_by_clicks_options(), $compare_options ),
			'compare'
		);

		$this->add_request(
			$requests,
			$request_map,
			'keywords_ctr_increase_compare',
			'keywords_ctr_increase',
			array_merge( $this->report_options->get_keywords_ctr_increase_options(), $compare_options ),
			'compare'
		);

		$this->add_request(
			$requests,
			$request_map,
			'pages_clicks_increase_compare',
			'pages_clicks_increase',
			array_merge( $this->report_options->get_pages_clicks_increase_options(), $compare_options ),
			'compare'
		);
	}

	/**
	 * Adds a single Search Console request to the batch lists.
	 *
	 * @since 1.170.0
	 *
	 * @param array  $requests    Request list (by reference).
	 * @param array  $request_map Request metadata map (by reference).
	 * @param string $identifier  Unique request identifier.
	 * @param string $section_key Section key.
	 * @param array  $options     Request options.
	 * @param string $context     Context flag (single/current/compare).
	 */
	private function add_request( &$requests, &$request_map, $identifier, $section_key, $options, $context = 'single' ) {
		// Keep identifiers unique (e.g. current/compare) so batch responses do not overwrite each other,
		// while still mapping them back to the same section key for rendering.
		$request_map[ $identifier ] = array(
			'section_key' => $section_key,
			'context'     => $context,
		);

		$requests[] = array_merge(
			$options,
			array( 'identifier' => $identifier )
		);
	}

	/**
	 * Maps batch responses back to section payloads.
	 *
	 * @since 1.170.0
	 *
	 * @param array $responses   Batch responses keyed by identifier.
	 * @param array $request_map Request metadata map.
	 * @return array Section payloads keyed by section slug.
	 */
	public function map_responses( $responses, $request_map ) {
		$payload = array();

		foreach ( $request_map as $identifier => $metadata ) {
			$result = isset( $responses[ $identifier ] )
				? $responses[ $identifier ]
				: new WP_Error(
					'email_report_search_console_missing_result',
					__( 'Search Console data could not be retrieved.', 'google-site-kit' )
				);

			if ( 'compare' === $metadata['context'] || 'current' === $metadata['context'] ) {
				if ( ! isset( $payload[ $metadata['section_key'] ] ) || ! is_array( $payload[ $metadata['section_key'] ] ) ) {
					$payload[ $metadata['section_key'] ] = array();
				}

				$payload[ $metadata['section_key'] ][ $metadata['context'] ] = $result;
				continue;
			}

			$payload[ $metadata['section_key'] ] = $result;
		}

		return $payload;
	}
}
