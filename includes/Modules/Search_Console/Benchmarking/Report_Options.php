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
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Report_Options {

	/**
	 * The start date of the selected period, as `YYYY-MM-DD`.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $start_date;

	/**
	 * The end date of the selected period, as `YYYY-MM-DD`.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $end_date;

	/**
	 * The start date of the compare period, as `YYYY-MM-DD`.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $compare_start_date;

	/**
	 * The end date of the compare period, as `YYYY-MM-DD`.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $compare_end_date;

	/**
	 * The most rows each report returns.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $row_limit;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
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
	 * Gets the requests of the two search query reports, one per period.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of the two `searchanalytics-batch` requests, identified by `current` for the selected period and `previous` for the compare period.
	 */
	public function get_search_query_requests() {
		return array(
			array(
				'identifier' => 'current',
				'startDate'  => $this->start_date,
				'endDate'    => $this->end_date,
				'dimensions' => 'query',
				'rowLimit'   => $this->row_limit,
			),
			array(
				'identifier' => 'previous',
				'startDate'  => $this->compare_start_date,
				'endDate'    => $this->compare_end_date,
				'dimensions' => 'query',
				'rowLimit'   => $this->row_limit,
			),
		);
	}
}
