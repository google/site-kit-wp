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
 * @since 1.167.0
 *
 * @access private
 * @ignore
 */
class Report_Options extends Base_Report_Options {

	/**
	 * Gets report options for total impressions.
	 *
	 * @since 1.167.0
	 *
	 * @return array Report request options array for impressions.
	 */
	public function get_total_impressions_options() {
		return $this->get_search_funnel_options();
	}

	/**
	 * Gets report options for total clicks.
	 *
	 * @since 1.167.0
	 *
	 * @return array Report request options array for clicks.
	 */
	public function get_total_clicks_options() {
		return $this->get_search_funnel_options();
	}

	/**
	 * Gets report options for keywords with highest CTR.
	 *
	 * @since 1.167.0
	 *
	 * @return array Report request options array for CTR keywords.
	 */
	public function get_top_ctr_keywords_options() {
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
	 * @since 1.167.0
	 *
	 * @return array Report request options array for top pages.
	 */
	public function get_top_pages_by_clicks_options() {
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
	 * @since 1.167.0
	 *
	 * @return array Report request options array spanning both periods.
	 */
	private function get_search_funnel_options() {
		$combined_range = $this->get_combined_range();

		return array(
			'startDate'  => $combined_range['startDate'],
			'endDate'    => $combined_range['endDate'],
			'dimensions' => 'date',
		);
	}
}
