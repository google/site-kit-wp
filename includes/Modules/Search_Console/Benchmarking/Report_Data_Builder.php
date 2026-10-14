<?php
/**
 * Class Google\Site_Kit\Modules\Search_Console\Benchmarking\Report_Data_Builder
 *
 * @package   Google\Site_Kit\Modules\Search_Console\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Search_Console\Benchmarking;

use Google\Site_Kit\Modules\Search_Console;

/**
 * Builds the search query rows of the benchmarking response.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Report_Data_Builder {

	/**
	 * Search Console module instance.
	 *
	 * @since n.e.x.t
	 * @var Search_Console
	 */
	private $search_console;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Search_Console $search_console The Search Console module instance, which runs the reports.
	 */
	public function __construct( Search_Console $search_console ) {
		$this->search_console = $search_console;
	}

	/**
	 * Builds the search query rows for the period the benchmarking response is for.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $args {
	 *     The period the rows are for, as the `googlesitekit_benchmarking_contextual_data` filter passes it.
	 *
	 *     @type string $start_date         The start date of the selected period, as `YYYY-MM-DD`.
	 *     @type string $end_date           The end date of the selected period, as `YYYY-MM-DD`.
	 *     @type string $compare_start_date The start date of the compare period, as `YYYY-MM-DD`.
	 *     @type string $compare_end_date   The end date of the compare period, as `YYYY-MM-DD`.
	 *     @type int    $row_limit          The most rows each report returns.
	 * }
	 * @return array List of rows, one per query, each with `label`, `current`, `previous`, `positionCurrent`, and `positionPrevious`. Empty when a report fails or neither report has rows.
	 */
	public function build_search_query_rows( array $args ) {
		$report_options = new Report_Options(
			$args['start_date'],
			$args['end_date'],
			$args['compare_start_date'],
			$args['compare_end_date'],
			$args['row_limit']
		);

		$reports = $this->search_console->set_data(
			'searchanalytics-batch',
			array(
				'requests' => $report_options->get_search_query_requests(),
			)
		);

		// Without both periods every query would look new or gone, so a failed
		// report leaves out the search queries altogether.
		if ( is_wp_error( $reports ) || is_wp_error( $reports['current'] ) || is_wp_error( $reports['previous'] ) ) {
			return array();
		}

		$rows = array();

		foreach ( array(
			'current'  => 'positionCurrent',
			'previous' => 'positionPrevious',
		) as $period => $position_key ) {
			foreach ( $reports[ $period ] as $report_row ) {
				$query = $report_row->getKeys()[0];

				if ( ! isset( $rows[ $query ] ) ) {
					$rows[ $query ] = array(
						'label'            => $query,
						'current'          => 0,
						'previous'         => 0,
						'positionCurrent'  => null,
						'positionPrevious' => null,
					);
				}

				$rows[ $query ][ $period ]       = (int) $report_row->getClicks();
				$rows[ $query ][ $position_key ] = (float) $report_row->getPosition();
			}
		}

		return array_values( $rows );
	}
}
