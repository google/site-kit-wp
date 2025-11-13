<?php
/**
 * Class Google\Site_Kit\Modules\Search_Console\Email_Reporting\Report_Options
 *
 * @package   Google\Site_Kit\Modules\Search_Console\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Search_Console\Email_Reporting;

use Google\Site_Kit\Core\Email_Reporting\Report_Options\Report_Options as Base_Report_Options;

/**
 * Builds Search Console report option payloads for email reporting.
 *
 * @since n.e.x.t
 *
 * @access private
 * @ignore
 */
class Report_Options extends Base_Report_Options {

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param array|null $date_range    Current period range array.
	 * @param array      $compare_range Optional. Compare period range array.
	 * @throws \InvalidArgumentException When the date range payload is missing.
	 */
	public function __construct( $date_range = null, $compare_range = array() ) {
		if ( null === $date_range ) {
			throw new \InvalidArgumentException( 'Email reporting date range is required.' );
		}

		parent::__construct( $date_range, $compare_range );
	}

	/**
	 * Gets report options for total impressions.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	public function get_total_impressions_report_options() {
		return $this->get_search_funnel_report_options();
	}

	/**
	 * Gets report options for total clicks.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	public function get_total_clicks_report_options() {
		return $this->get_search_funnel_report_options();
	}

	/**
	 * Gets report options for keywords with highest CTR.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	public function get_top_ctr_keywords_report_options() {
		$current_range = $this->get_current_range_values();

		return array(
			'startDate'  => $current_range['startDate'],
			'endDate'    => $current_range['endDate'],
			'dimensions' => 'query',
			'limit'      => 10,
		);
	}

	/**
	 * Gets report options for the pages with most clicks.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	public function get_top_pages_by_clicks_report_options() {
		$current_range = $this->get_current_range_values();

		return array(
			'startDate'  => $current_range['startDate'],
			'endDate'    => $current_range['endDate'],
			'dimensions' => 'page',
			'limit'      => 10,
		);
	}

	/**
	 * Shared Search Console report options used for total clicks/impressions.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	private function get_search_funnel_report_options() {
		$combined_range = $this->get_combined_range();

		return array(
			'startDate'  => $combined_range['startDate'],
			'endDate'    => $combined_range['endDate'],
			'dimensions' => 'date',
		);
	}
}
