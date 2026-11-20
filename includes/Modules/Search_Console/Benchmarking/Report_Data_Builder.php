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
 * @since 1.190.0
 * @access private
 * @ignore
 */
class Report_Data_Builder {

	/**
	 * Search Console module instance.
	 *
	 * @since 1.190.0
	 * @var Search_Console
	 */
	private $search_console;

	/**
	 * Constructor.
	 *
	 * @since 1.190.0
	 *
	 * @param Search_Console $search_console The Search Console module instance, which runs the reports.
	 */
	public function __construct( Search_Console $search_console ) {
		$this->search_console = $search_console;
	}

	/**
	 * Builds the search query rows for the period the benchmarking response is
	 * for, in one batch call.
	 *
	 * Without both periods every query would look new or gone, so a key whose
	 * report fails in either period is left out. A page is the path of its URL,
	 * as Analytics names a landing page, and a device is in lowercase, as
	 * Analytics names it, so the rows of both modules match.
	 *
	 * The site's clicks are left out when neither period has one, since Search
	 * Console reports no row both for a period without clicks and for a
	 * property without data, and the insight request never sends a `0` for
	 * missing data.
	 *
	 * @since n.e.x.t
	 * @since n.e.x.t Also returns the site's clicks in each period, as `searchClicks`.
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
	 * @return array {
	 *     The rows, keyed by contextual data key, without a key whose reports failed or have no rows.
	 *
	 *     @type array $searchQueries      List of rows, one per query, each with `label`, `current`, `previous`, `positionCurrent`, and `positionPrevious`.
	 *     @type array $searchQueryPages   List of rows, one per query and page, each with `query`, `page`, `current`, and `previous`.
	 *     @type array $searchQueryDevices List of rows, one per query and device, each with `query`, `device`, `current`, and `previous`.
	 *     @type array $searchClicks       List of one row, with the site's clicks over every query as `current` and `previous`.
	 * }
	 */
	public function build_rows( array $args ) {
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
				'requests' => array_merge(
					$report_options->get_search_query_requests(),
					$report_options->get_search_clicks_requests()
				),
			)
		);

		if ( is_wp_error( $reports ) ) {
			return array();
		}

		$rows = array(
			'searchQueries'      => $this->has_both_periods( $reports, '' ) ? $this->build_search_query_rows( $reports ) : array(),
			'searchQueryPages'   => $this->has_both_periods( $reports, '-pages' )
				? $this->build_breakdown_rows(
					$reports,
					'-pages',
					'page',
					function ( $url ) {
						$path = wp_parse_url( $url, PHP_URL_PATH );

						return is_string( $path ) && '' !== $path ? $path : '/';
					}
				)
				: array(),
			'searchQueryDevices' => $this->has_both_periods( $reports, '-devices' )
				? $this->build_breakdown_rows( $reports, '-devices', 'device', 'strtolower' )
				: array(),
			'searchClicks'       => $this->has_both_periods( $reports, '-totals' ) ? $this->build_search_clicks_rows( $reports ) : array(),
		);

		return array_filter( $rows );
	}

	/**
	 * Builds the row of the site's clicks in each period.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $reports The reports of the batch call, keyed by identifier.
	 * @return array List of one row with `current` and `previous`, or an empty list when neither period has a click.
	 */
	private function build_search_clicks_rows( array $reports ) {
		$clicks = array();

		foreach ( array( 'current', 'previous' ) as $period ) {
			$clicks[ $period ] = array_sum(
				array_map(
					fn( $report_row ) => (int) $report_row->getClicks(),
					$reports[ "{$period}-totals" ]
				)
			);
		}

		return 0 === $clicks['current'] && 0 === $clicks['previous'] ? array() : array( $clicks );
	}

	/**
	 * Checks whether the reports of both periods for one breakdown succeeded.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $reports The reports of the batch call, keyed by identifier.
	 * @param string $suffix  The suffix of the breakdown's identifiers, such as `-pages`, or an empty string for the queries.
	 * @return bool True when both reports have rows to read, otherwise false.
	 */
	private function has_both_periods( array $reports, $suffix ) {
		foreach ( array( 'current', 'previous' ) as $period ) {
			if ( ! isset( $reports[ $period . $suffix ] ) || is_wp_error( $reports[ $period . $suffix ] ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Builds the rows of the queries, each with its clicks and its average
	 * position in both periods.
	 *
	 * @since 1.190.0
	 * @since n.e.x.t Takes the reports of the batch call.
	 *
	 * @param array $reports The reports of the batch call, keyed by identifier.
	 * @return array List of rows, one per query, each with `label`, `current`, `previous`, `positionCurrent`, and `positionPrevious`.
	 */
	private function build_search_query_rows( array $reports ) {
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

	/**
	 * Builds the rows of a breakdown of the queries' clicks by a second
	 * dimension, each with its clicks in both periods.
	 *
	 * Two values that name the same thing once they are mapped, such as the
	 * `http` and the `https` URL of a page, are one row.
	 *
	 * @since n.e.x.t
	 *
	 * @param array    $reports   The reports of the batch call, keyed by identifier.
	 * @param string   $suffix    The suffix of the breakdown's identifiers, such as `-pages`.
	 * @param string   $field     The field of the second dimension in a row, such as `page`.
	 * @param callable $map_value Maps a value of the second dimension to the value the row lists.
	 * @return array List of rows, one per query and value, each with `query`, the field, `current`, and `previous`.
	 */
	private function build_breakdown_rows( array $reports, $suffix, $field, callable $map_value ) {
		$rows = array();

		foreach ( array( 'current', 'previous' ) as $period ) {
			foreach ( $reports[ $period . $suffix ] as $report_row ) {
				$keys  = $report_row->getKeys();
				$value = $map_value( $keys[1] );
				$key   = wp_json_encode( array( $keys[0], $value ) );

				if ( ! isset( $rows[ $key ] ) ) {
					$rows[ $key ] = array(
						'query'    => $keys[0],
						$field     => $value,
						'current'  => 0,
						'previous' => 0,
					);
				}

				$rows[ $key ][ $period ] += (int) $report_row->getClicks();
			}
		}

		return array_values( $rows );
	}
}
