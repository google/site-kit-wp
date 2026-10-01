<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Benchmarking\Response_Builder
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Benchmarking;

use DateTimeImmutable;
use DateTimeZone;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Custom_Dimensions_Data_Available;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\RunReportResponse as Google_Service_AnalyticsData_RunReportResponse;
use WP_Error;

/**
 * Assembles the benchmarking response for a pair of dates.
 *
 * Everything the Typical Traffic tab renders comes from here, so the tab makes
 * one request and has one loading state instead of eight.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Response_Builder {

	/**
	 * The most rows a dimension keeps in the response.
	 */
	const MAX_ROWS_PER_DIMENSION = 5;

	/**
	 * Analytics 4 module instance.
	 *
	 * @since n.e.x.t
	 * @var Analytics_4
	 */
	private $analytics_4;

	/**
	 * Custom_Dimensions_Data_Available instance.
	 *
	 * @since n.e.x.t
	 * @var Custom_Dimensions_Data_Available
	 */
	private $custom_dimensions_data_available;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Analytics_4                      $analytics_4                      The Analytics 4 module instance, which runs the reports.
	 * @param Custom_Dimensions_Data_Available $custom_dimensions_data_available The Custom_Dimensions_Data_Available instance.
	 */
	public function __construct( Analytics_4 $analytics_4, Custom_Dimensions_Data_Available $custom_dimensions_data_available ) {
		$this->analytics_4                      = $analytics_4;
		$this->custom_dimensions_data_available = $custom_dimensions_data_available;
	}

	/**
	 * Builds the response for a pair of dates.
	 *
	 * Nothing is saved to the site, so every call builds the response again.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $start_date The start date, as `YYYY-MM-DD`.
	 * @param string $end_date   The end date, as `YYYY-MM-DD`.
	 * @return array|WP_Error {
	 *     The assembled response, or the error a failed report returned.
	 *
	 *     @type array $visitors       Visitor totals for the selected period and the one before it.
	 *     @type array $dailyTraffic   Daily visitor counts, oldest first.
	 *     @type array $dimensions     Dimension codes, in the order the Typical Traffic tab shows them.
	 *     @type array $contextualData Ranked rows, keyed by the dimension they belong to.
	 * }
	 */
	public function build( $start_date, $end_date ) {
		$report_options = new Report_Options( $start_date, $end_date );
		$requests       = $this->get_report_requests( $report_options );
		$reports        = $this->run_reports( $requests );

		if ( is_wp_error( $reports ) ) {
			return $reports;
		}

		$daily_traffic = $this->get_daily_traffic( $reports['dailyTraffic'], $requests['dailyTraffic']['startDate'] );
		$compare_range = $report_options->get_compare_range();

		$visitors = array(
			'current'  => $this->sum_visitors( $daily_traffic, $start_date, $end_date ),
			'previous' => $this->sum_visitors( $daily_traffic, $compare_range['startDate'], $compare_range['endDate'] ),
		);

		$ranked_data = $this->rank_contextual_data( $this->build_contextual_data( $reports, $end_date ), $visitors );

		return array(
			'visitors'       => $visitors,
			'dailyTraffic'   => $daily_traffic,
			'dimensions'     => $ranked_data['dimensions'],
			'contextualData' => $ranked_data['contextualData'],
		);
	}

	/**
	 * Ranks each dimension's rows, and orders the dimensions.
	 *
	 * The rows `Row_Scorer` doesn't exclude are ranked by score, highest first,
	 * and cut to `MAX_ROWS_PER_DIMENSION`. The dimensions are ordered by the sum
	 * of their row scores, which counts the rows past the cut too. A dimension
	 * with no row left is in neither `dimensions` nor `contextualData`.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $contextual_data The rows, keyed by `contextualData` key, such as `channels`. Every row has its `current` and `previous` visitors.
	 * @param array $visitors        The site's visitors, with `current` and `previous`.
	 * @return array {
	 *     The two response fields the ranking decides.
	 *
	 *     @type array $dimensions     Dimension codes, the highest sum of row scores first.
	 *     @type array $contextualData Rows each dimension keeps, keyed by `contextualData` key. A `CONTENT` row has `url`, `title`, `visitors`, and `publishedDaysAgo`. Every other row is unchanged.
	 * }
	 */
	public function rank_contextual_data( array $contextual_data, array $visitors ) {
		$row_scorer       = new Row_Scorer( $visitors['current'], $visitors['previous'] );
		$dimension_codes  = array_flip( Wire_Format::CONTEXTUAL_DATA_KEYS );
		$ranked_data      = array();
		$dimension_scores = array();

		foreach ( $contextual_data as $contextual_data_key => $rows ) {
			$dimension_code = $dimension_codes[ $contextual_data_key ];
			$label_key      = 'CONTENT' === $dimension_code ? 'url' : 'label';
			$scored_rows    = array();

			foreach ( $rows as $row ) {
				if ( $row_scorer->is_excluded_row( $dimension_code, $row ) ) {
					continue;
				}

				$scored_rows[] = array(
					'row'   => $row,
					'score' => $row_scorer->score_row( $dimension_code, $row ),
				);
			}

			if ( empty( $scored_rows ) ) {
				continue;
			}

			// The `strcmp()` sorts two rows with the same score, so their order doesn't
			// depend on the order of `$rows`.
			usort(
				$scored_rows,
				fn( $a, $b ) => ( $b['score'] <=> $a['score'] ) ?: strcmp( $a['row'][ $label_key ], $b['row'][ $label_key ] )
			);

			$dimension_scores[ $dimension_code ] = array_sum( array_column( $scored_rows, 'score' ) );
			$ranked_data[ $contextual_data_key ] = array_map(
				fn( $scored_row ) => $this->get_response_row( $dimension_code, $scored_row['row'] ),
				array_slice( $scored_rows, 0, self::MAX_ROWS_PER_DIMENSION )
			);
		}

		uksort(
			$dimension_scores,
			fn( $a, $b ) => ( $dimension_scores[ $b ] <=> $dimension_scores[ $a ] ) ?: Wire_Format::DIMENSION_INDEXES[ $a ] - Wire_Format::DIMENSION_INDEXES[ $b ]
		);

		return array(
			'dimensions'     => array_keys( $dimension_scores ),
			'contextualData' => $ranked_data,
		);
	}

	/**
	 * Gets the options of every report the response needs.
	 *
	 * The `CONTENT` and `CATEGORIES` reports count visitors by a custom dimension,
	 * so each one runs only while its dimension has data.
	 *
	 * @since n.e.x.t
	 *
	 * @param Report_Options $report_options The report options for the two dates.
	 * @return array Report request options, keyed by `dailyTraffic` or by dimension code, such as `CHANNELS`. The daily series is first.
	 */
	private function get_report_requests( Report_Options $report_options ) {
		$data_availability = $this->custom_dimensions_data_available->get_data_availability();

		$requests = array(
			'dailyTraffic' => $report_options->get_daily_series_options(),
			'CHANNELS'     => $report_options->get_channels_options(),
			'DEVICES'      => $report_options->get_devices_options(),
			'VISITOR_MIX'  => $report_options->get_visitor_mix_options(),
			'REFERRERS'    => $report_options->get_referrers_options(),
		);

		if ( $data_availability[ Analytics_4::CUSTOM_DIMENSION_POST_DATE ] ) {
			$requests['CONTENT'] = $report_options->get_content_options();
		}

		if ( $data_availability[ Analytics_4::CUSTOM_DIMENSION_POST_CATEGORIES ] ) {
			$requests['CATEGORIES'] = $report_options->get_categories_options();
		}

		return $requests;
	}

	/**
	 * Runs the reports in batch calls, because one `GET:batch-report` call takes
	 * at most five reports.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $requests The report request options, keyed by `dailyTraffic` or by dimension code.
	 * @return array|WP_Error Report rows, keyed like the requests, or the error the first failed call returned.
	 */
	private function run_reports( array $requests ) {
		$reports = array();

		foreach ( array_chunk( $requests, 5, true ) as $chunk ) {
			$response = $this->analytics_4->get_data(
				'batch-report',
				array(
					'requests' => array_values( $chunk ),
				)
			);

			if ( is_wp_error( $response ) ) {
				return $response;
			}

			$batch_reports = $response->getReports();

			foreach ( array_keys( $chunk ) as $index => $request_key ) {
				$reports[ $request_key ] = $this->get_report_rows( $batch_reports[ $index ] );
			}
		}

		return $reports;
	}

	/**
	 * Gets the rows of a report, as plain arrays.
	 *
	 * @since n.e.x.t
	 *
	 * @param Google_Service_AnalyticsData_RunReportResponse $report A report from a batch call.
	 * @return array List of rows, each with its dimension `values` in the order the report asked for them, its `dateRange`, and its `visitors`.
	 */
	private function get_report_rows( Google_Service_AnalyticsData_RunReportResponse $report ) {
		$dimension_names = array_map(
			fn( $dimension_header ) => $dimension_header->getName(),
			$report->getDimensionHeaders()
		);

		$rows = array();

		foreach ( $report->getRows() as $row ) {
			$values = array_combine(
				$dimension_names,
				array_map( fn( $dimension_value ) => $dimension_value->getValue(), $row->getDimensionValues() )
			);

			// Each row of a report with two periods has a `dateRange` value:
			// `date_range_0` for the selected period, and `date_range_1` for the
			// compare period.
			$date_range = $values['dateRange'] ?? 'date_range_0';
			unset( $values['dateRange'] );

			$rows[] = array(
				'values'    => array_values( $values ),
				'dateRange' => $date_range,
				'visitors'  => (int) $row->getMetricValues()[0]->getValue(),
			);
		}

		return $rows;
	}

	/**
	 * Gets each day's visitors in the daily series, oldest first.
	 *
	 * Analytics returns no row for a day with no visitors, so that day is listed
	 * with `0` visitors. `Response_Encoder` keeps only the first date, so every
	 * day has to be in the list.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $report_rows The rows of the daily series report.
	 * @param string $first_date  The first day of the daily series, as `YYYY-MM-DD`.
	 * @return array List of days, each with `visitors` and a `date` as `YYYY-MM-DD`.
	 */
	private function get_daily_traffic( array $report_rows, $first_date ) {
		$visitors_by_date = array();

		foreach ( $report_rows as $report_row ) {
			$visitors_by_date[ $report_row['values'][0] ] = $report_row['visitors'];
		}

		$date          = new DateTimeImmutable( $first_date, new DateTimeZone( 'UTC' ) );
		$daily_traffic = array();

		for ( $day = 0; $day < Report_Options::DAILY_SERIES_DAYS; $day++ ) {
			$daily_traffic[] = array(
				'date'     => $date->format( 'Y-m-d' ),
				'visitors' => $visitors_by_date[ $date->format( 'Ymd' ) ] ?? 0,
			);

			$date = $date->modify( '+1 day' );
		}

		return $daily_traffic;
	}

	/**
	 * Adds up each day's visitors from one date to another.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $daily_traffic The days, each with `visitors` and a `date` as `YYYY-MM-DD`.
	 * @param string $start_date    The first day to count, as `YYYY-MM-DD`.
	 * @param string $end_date      The last day to count, as `YYYY-MM-DD`.
	 * @return int The total visitors from `$start_date` to `$end_date`.
	 */
	private function sum_visitors( array $daily_traffic, $start_date, $end_date ) {
		$visitors = 0;

		foreach ( $daily_traffic as $day ) {
			// Dates written as `YYYY-MM-DD` compare in date order as strings.
			if ( $day['date'] >= $start_date && $day['date'] <= $end_date ) {
				$visitors += $day['visitors'];
			}
		}

		return $visitors;
	}

	/**
	 * Builds each dimension's rows from its report.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $reports  The report rows, keyed by `dailyTraffic` or by dimension code.
	 * @param string $end_date The end date, as `YYYY-MM-DD`.
	 * @return array Rows, keyed by `contextualData` key. Every row has its `current` and `previous` visitors.
	 */
	private function build_contextual_data( array $reports, $end_date ) {
		$contextual_data = array();

		foreach ( Wire_Format::CONTEXTUAL_DATA_KEYS as $dimension_code => $contextual_data_key ) {
			if ( ! isset( $reports[ $dimension_code ] ) ) {
				continue;
			}

			$pairs = $this->pair_periods( $reports[ $dimension_code ] );

			if ( 'CONTENT' === $dimension_code ) {
				$contextual_data[ $contextual_data_key ] = $this->build_content_rows( $pairs, $end_date );
				continue;
			}

			$contextual_data[ $contextual_data_key ] = array_map(
				fn( $pair ) => array(
					'label'    => $pair['values'][0],
					'current'  => $pair['current'],
					'previous' => $pair['previous'],
				),
				$pairs
			);
		}

		return $contextual_data;
	}

	/**
	 * Pairs a dimension report's two periods by the value of its first dimension.
	 *
	 * A value missing from one period has `0` visitors in that period. The rows
	 * of the selected period are read first, so a page keeps its title from the
	 * selected period.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $report_rows The rows of a dimension report.
	 * @return array List of pairs, one per value. Each pair has `current` and `previous`, and the `values` of the first row read for that value.
	 */
	private function pair_periods( array $report_rows ) {
		$pairs = array();

		foreach ( array(
			'date_range_0' => 'current',
			'date_range_1' => 'previous',
		) as $date_range => $count_key ) {
			foreach ( $report_rows as $report_row ) {
				if ( $date_range !== $report_row['dateRange'] ) {
					continue;
				}

				$value = $report_row['values'][0];

				if ( ! isset( $pairs[ $value ] ) ) {
					$pairs[ $value ] = array(
						'values'   => $report_row['values'],
						'current'  => 0,
						'previous' => 0,
					);
				}

				$pairs[ $value ][ $count_key ] += $report_row['visitors'];
			}
		}

		return array_values( $pairs );
	}

	/**
	 * Builds the `CONTENT` rows, one per page.
	 *
	 * Analytics returns the post date as `YYYYMMDD`, and a page whose post date
	 * isn't a real day is skipped, since it has no age to report.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $pairs    The pairs from the content report, each with the page path, the page title, and the post date as its values.
	 * @param string $end_date The end date, as `YYYY-MM-DD`.
	 * @return array List of rows, each with `url`, `title`, `publishedDaysAgo`, `current`, and `previous`.
	 */
	private function build_content_rows( array $pairs, $end_date ) {
		$utc  = new DateTimeZone( 'UTC' );
		$end  = new DateTimeImmutable( $end_date, $utc );
		$rows = array();

		foreach ( $pairs as $pair ) {
			list( $url, $title, $post_date ) = $pair['values'];

			// The `!` sets the time to midnight, the same as `$end`, so the two dates
			// are whole days apart.
			$published = DateTimeImmutable::createFromFormat( '!Ymd', $post_date, $utc );

			// `createFromFormat()` reads `20260231` as 3 March 2026 rather than
			// refusing it.
			if ( ! $published || $published->format( 'Ymd' ) !== $post_date ) {
				continue;
			}

			$rows[] = array(
				'url'              => $url,
				'title'            => $title,
				// A site's time zone can be hours later than the Analytics
				// property's time zone, so a post can be dated after the end date.
				'publishedDaysAgo' => max( 0, intdiv( $end->getTimestamp() - $published->getTimestamp(), DAY_IN_SECONDS ) ),
				'current'          => $pair['current'],
				'previous'         => $pair['previous'],
			);
		}

		return $rows;
	}

	/**
	 * Gets the shape a row takes in the response.
	 *
	 * A `CONTENT` row reports the visitors of the selected period as
	 * `visitors`, without the `previous` count that only its score used.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $dimension_code The dimension code the row belongs to, such as `CONTENT`.
	 * @param array  $row            The row, with its `current` and `previous` visitors.
	 * @return array The row as the response lists it.
	 */
	private function get_response_row( $dimension_code, array $row ) {
		if ( 'CONTENT' !== $dimension_code ) {
			return $row;
		}

		return array(
			'url'              => $row['url'],
			'title'            => $row['title'],
			'visitors'         => $row['current'],
			'publishedDaysAgo' => $row['publishedDaysAgo'],
		);
	}
}
