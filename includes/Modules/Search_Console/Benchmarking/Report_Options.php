<?php
/**
 * Class Google\Site_Kit\Modules\Search_Console\Benchmarking\Report_Options
 *
 * @package   Google\Site_Kit\Modules\Search_Console\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Search_Console\Benchmarking;

/**
 * Builds the Search Console report options the benchmarking response needs.
 *
 * @since 1.190.0
 * @access private
 * @ignore
 */
class Report_Options {

	/**
	 * The start date of the selected period, as `YYYY-MM-DD`.
	 *
	 * @since 1.190.0
	 * @var string
	 */
	private $start_date;

	/**
	 * The end date of the selected period, as `YYYY-MM-DD`.
	 *
	 * @since 1.190.0
	 * @var string
	 */
	private $end_date;

	/**
	 * The start date of the compare period, as `YYYY-MM-DD`.
	 *
	 * @since 1.190.0
	 * @var string
	 */
	private $compare_start_date;

	/**
	 * The end date of the compare period, as `YYYY-MM-DD`.
	 *
	 * @since 1.190.0
	 * @var string
	 */
	private $compare_end_date;

	/**
	 * The most rows each report returns.
	 *
	 * @since 1.190.0
	 * @var int
	 */
	private $row_limit;

	/**
	 * Constructor.
	 *
	 * @since 1.190.0
	 *
	 * @param string $start_date         The start date of the selected period, as `YYYY-MM-DD`.
	 * @param string $end_date           The end date of the selected period, as `YYYY-MM-DD`.
	 * @param string $compare_start_date The start date of the compare period, as `YYYY-MM-DD`.
	 * @param string $compare_end_date   The end date of the compare period, as `YYYY-MM-DD`.
	 * @param int    $row_limit          The most rows each report returns.
	 */
	public function __construct( $start_date, $end_date, $compare_start_date, $compare_end_date, $row_limit ) {
		$this->start_date         = $start_date;
		$this->end_date           = $end_date;
		$this->compare_start_date = $compare_start_date;
		$this->compare_end_date   = $compare_end_date;
		$this->row_limit          = $row_limit;
	}

	/**
	 * Gets the requests of the search query reports, each once per period: the
	 * clicks of each query, of each query on each page, and of each query on
	 * each device.
	 *
	 * @since 1.190.0
	 * @since n.e.x.t Added the requests of each query's clicks on each page and on each device.
	 *
	 * @return array List of the six `searchanalytics-batch` requests. A query report is identified by `current` for the selected period and `previous` for the compare period, a page report by `current-pages` and `previous-pages`, and a device report by `current-devices` and `previous-devices`.
	 */
	public function get_search_query_requests() {
		$requests = array();

		foreach ( array(
			''         => 'query',
			'-pages'   => 'query,page',
			'-devices' => 'query,device',
		) as $suffix => $dimensions ) {
			$requests[] = array(
				'identifier' => "current{$suffix}",
				'startDate'  => $this->start_date,
				'endDate'    => $this->end_date,
				'dimensions' => $dimensions,
				'rowLimit'   => $this->row_limit,
			);

			$requests[] = array(
				'identifier' => "previous{$suffix}",
				'startDate'  => $this->compare_start_date,
				'endDate'    => $this->compare_end_date,
				'dimensions' => $dimensions,
				'rowLimit'   => $this->row_limit,
			);
		}

		return $requests;
	}
}
