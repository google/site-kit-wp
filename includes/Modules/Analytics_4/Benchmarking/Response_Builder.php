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
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Custom_Dimensions_Data_Available;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\RunReportResponse as Google_Service_AnalyticsData_RunReportResponse;
use WP_Error;

/**
 * Assembles the benchmarking response for a pair of dates.
 *
 * The Traffic overview tab reads all of its benchmarking data from here, so the
 * tab makes one request and has one loading state instead of eight.
 *
 * @since 1.190.0
 * @access private
 * @ignore
 */
class Response_Builder {

	/**
	 * The fields each row of a breakdown report gets its dimension values as,
	 * in the order the report asks for the dimensions, keyed by contextual data
	 * key.
	 *
	 * @since n.e.x.t
	 */
	const BREAKDOWN_FIELDS = array(
		'channelBreakdowns' => array( 'channel', 'device', 'userType' ),
		'channelSources'    => array( 'channel', 'source' ),
		'channelPages'      => array( 'channel', 'page' ),
		'channelCampaigns'  => array( 'channel', 'campaign' ),
	);

	/**
	 * Analytics 4 module instance.
	 *
	 * @since 1.190.0
	 * @var Analytics_4
	 */
	private $analytics_4;

	/**
	 * Custom_Dimensions_Data_Available instance.
	 *
	 * @since 1.190.0
	 * @var Custom_Dimensions_Data_Available
	 */
	private $custom_dimensions_data_available;

	/**
	 * The titles of the published posts at the paths the key factor cards
	 * name, each a title or null, keyed by path, once looked up.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	private $page_titles = array();

	/**
	 * Constructor.
	 *
	 * @since 1.190.0
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
	 * @since 1.190.0
	 * @since 1.191.0 Returns `visits` in place of `visitors`, and each day's count as `visits`.
	 * @since 1.192.0 `dailyTraffic` changed from the 395 days that end on the end date to the days of the selected period.
	 * @since n.e.x.t Gives each day of `dailyTraffic` its expected range, and returns `availability`.
	 * @since n.e.x.t Returns `insightRequest` with the `trafficInsights` feature.
	 * @since n.e.x.t Returns `contentMarkers`.
	 * @since n.e.x.t Returns `keyFactors` in place of `dimensions` and `contextualData`.
	 * @since n.e.x.t Returns `steadyTraffic`.
	 * @since n.e.x.t Returns `bandReferenceDays`.
	 *
	 * @param string $start_date The start date, as `YYYY-MM-DD`.
	 * @param string $end_date   The end date, as `YYYY-MM-DD`.
	 * @return array|WP_Error {
	 *     The assembled response, or the error a failed report returned.
	 *
	 *     @type array       $visits            Visit totals for the selected period and the one before it.
	 *     @type array       $dailyTraffic      List of the days of the selected period, oldest first, each with `date` as `YYYY-MM-DD`, `visits`, and the bounds of its expected range as `expectedMin` and `expectedMax`: the band `Period_Baseline::get_daily_ranges()` fits for the period. The bounds are null on every day when `availability` has no band for the period: it has fewer than `Period_Baseline::get_min_band_history_days()` days of recorded traffic up to and including its last day, or the site has low traffic.
	 *     @type array       $availability      Which parts of the typical traffic view show for the period, as `Typical_Traffic_Availability::get()` returns them, so the panel reads them instead of working them out again.
	 *     @type int|null    $bandReferenceDays The number of days of traffic the band of the period's last day is fitted on, at most 365, which the band's tooltip names in weeks. Null when the period has no band.
	 *     @type array       $keyFactors        The key factor cards, as `Key_Factors::get_cards()` returns them. Empty when `availability` has no key factors for the period: it is shorter than 7 days, the compare period starts before the site's first day with visits, since a day before it wasn't measured yet, or the site has low traffic. Also empty when nothing moved enough for a card.
	 *     @type bool        $steadyTraffic     Whether no channel changed notably, as `Key_Factors::is_steady()` tells. The key factor cards are then the channels with the most visits, each with its share of the site's visits as `sharePct`. False when the period has no key factors.
	 *     @type array       $contentMarkers    The posts published in the selected period that the chart marks, as `Content_Markers::build()` returns them. Empty when the property has no post date custom dimension, since the content report doesn't run then, or when the dimension has no data yet.
	 *     @type array|null  $insightRequest    Only with the `trafficInsights` feature: the request the generated insight is written from, as `Insight_Request_Builder::build()` returns it, or null when there is no insight to request, which includes a period without key factors.
	 * }
	 */
	public function build( $start_date, $end_date ) {
		$report_options = new Report_Options( $start_date, $end_date );
		$requests       = $this->get_report_requests( $report_options );
		$reports        = $this->run_reports( $requests );
		if ( is_wp_error( $reports ) ) {
			return $reports;
		}

		$daily_series    = $this->get_daily_series( $reports['dailyTraffic'], $requests['dailyTraffic']['startDate'], $end_date );
		$period_baseline = Period_Baseline::from_daily_series( $daily_series );
		$compare_range   = $report_options->get_compare_range();
		$availability    = Typical_Traffic_Availability::get( $period_baseline, $end_date, $report_options->get_period_days() );

		$visits = array(
			'current'  => $this->sum_visits( $daily_series, $start_date, $end_date ),
			'previous' => $this->sum_visits( $daily_series, $compare_range['startDate'], $compare_range['endDate'] ),
		);

		$contextual_data = $this->filter_contextual_data(
			$this->build_contextual_data( $reports, $end_date ),
			array(
				'start_date'         => $start_date,
				'end_date'           => $end_date,
				'compare_start_date' => $compare_range['startDate'],
				'compare_end_date'   => $compare_range['endDate'],
				'row_limit'          => Report_Options::REPORT_ROW_LIMIT,
			)
		);

		// Every card compares the selected period with the compare period, so a
		// compare period with days before the site was measured would make
		// every driver look like growth, and a period of fewer than 7 days is
		// too short for a card.
		$key_factors    = array();
		$steady_traffic = false;
		$decomposition  = null;

		if ( $availability['key_factors_available'] ) {
			// The insight request carries the cards the panel shows as its
			// decomposition, built in the same pass from the same figures, so
			// the insight's text describes the cards.
			$key_factors_builder = new Key_Factors(
				$contextual_data,
				$visits,
				$report_options->get_period_days(),
				self::get_home_path(),
				fn( $path ) => $this->get_page_title( $path )
			);
			$key_factors         = $key_factors_builder->get_cards();
			$steady_traffic      = $key_factors_builder->is_steady();
			$decomposition       = $key_factors_builder->get_decomposition();
		}

		// The band's tooltip says how much traffic the band is based on: the
		// days the fit of the period's last day reads, the longest of any day.
		// A site with low traffic has no band, whatever its history.
		$daily_range = $availability['band_available']
			? $period_baseline->get_daily_range( $end_date, $report_options->get_period_days() )
			: null;

		$response = array(
			'visits'            => $visits,
			'dailyTraffic'      => $this->get_daily_traffic( $daily_series, $start_date, $end_date, $availability['band_available'] ? $period_baseline : null ),
			'availability'      => $availability,
			'bandReferenceDays' => null === $daily_range ? null : $daily_range['reference_days'],
			'keyFactors'        => $key_factors,
			'steadyTraffic'     => $steady_traffic,
			'contentMarkers'    => ( new Content_Markers() )->build(
				isset( $contextual_data['content'] ) ? $contextual_data['content'] : array(),
				$start_date,
				$end_date
			),
		);

		if ( Feature_Flags::enabled( 'trafficInsights' ) ) {
			// The insight's driver describes the change the key factor cards
			// show, so the insight is requested only with them, whether the
			// period has a band or not, and the request carries them. The
			// request reads the same fits as the band of `dailyTraffic`, so the
			// chart and the verdict agree.
			$response['insightRequest'] = $availability['insight_request_allowed']
				? ( new Insight_Request_Builder() )->build( $start_date, $end_date, $period_baseline, $visits, $this->get_insight_rows( $contextual_data ), $decomposition )
				: null;
		}

		return $response;
	}

	/**
	 * Gets the path of the site's homepage, which a key factor card names the
	 * homepage by, and which tells the homepage of a site that lives under a
	 * folder.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The path, with a trailing slash, such as `/` or `/blog/`.
	 */
	private static function get_home_path() {
		$path = wp_parse_url( home_url(), PHP_URL_PATH );

		return trailingslashit( is_string( $path ) ? $path : '' );
	}

	/**
	 * Gets the title of the published post at a path, which a key factor card
	 * names a landing page by.
	 *
	 * Each path is looked up once per request.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $path The path of the page on the site's host, such as `/plant-garlic/`.
	 * @return string|null The post's title, with its HTML characters decoded, or null when the page isn't a published post.
	 */
	private function get_page_title( $path ) {
		if ( ! array_key_exists( $path, $this->page_titles ) ) {
			// phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.url_to_postid_url_to_postid -- A page that isn't a post simply has no title.
			$post_id = url_to_postid( self::get_site_origin() . $path );

			// A post's title is filtered for display, with its HTML characters
			// escaped.
			$this->page_titles[ $path ] = $post_id && 'publish' === get_post_status( $post_id )
				? html_entity_decode( get_the_title( $post_id ), ENT_QUOTES | ENT_HTML5, 'UTF-8' )
				: null;
		}

		return $this->page_titles[ $path ];
	}

	/**
	 * Gets the scheme and host of the site's URL, which a landing page's path
	 * is on.
	 *
	 * A landing page's path already has the folder a site lives under, so the
	 * site's own path is left out.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The scheme and host, with the port when the URL has one, such as `https://example.com`.
	 */
	private static function get_site_origin() {
		$home_url = wp_parse_url( home_url() );
		$origin   = ( isset( $home_url['scheme'] ) ? $home_url['scheme'] : 'https' ) . '://' . ( isset( $home_url['host'] ) ? $home_url['host'] : '' );

		return isset( $home_url['port'] ) ? "{$origin}:{$home_url['port']}" : $origin;
	}

	/**
	 * Gets the rows the insight request is written from.
	 *
	 * The channels, devices, visitor types and referring sources are the sums
	 * of the breakdowns the key factor cards are picked from, so the insight
	 * and the cards describe the same visits. The breakdowns themselves are
	 * passed on too.
	 *
	 * @since n.e.x.t
	 * @since n.e.x.t Also returns the `channelBreakdowns`, `channelPages`, `channelCampaigns` and `searchClicks` rows.
	 *
	 * @param array $contextual_data The rows, keyed by contextual data key.
	 * @return array The rows, keyed by `channels`, `devices`, `visitorMix`, `referrers`, `searchQueries`, `content`, and by the contextual data keys passed on. Each `channels`, `devices`, `visitorMix` and `referrers` row has `label`, `current` and `previous`.
	 */
	private function get_insight_rows( array $contextual_data ) {
		$breakdowns = isset( $contextual_data['channelBreakdowns'] ) ? $contextual_data['channelBreakdowns'] : array();
		$sources    = isset( $contextual_data['channelSources'] ) ? $contextual_data['channelSources'] : array();

		return array_merge(
			array_intersect_key(
				$contextual_data,
				array_flip( array( 'channelBreakdowns', 'channelPages', 'channelCampaigns', 'searchClicks' ) )
			),
			array(
				'channels'      => Key_Factors::sum_by( $breakdowns, 'channel' ),
				'devices'       => Key_Factors::sum_by( $breakdowns, 'device' ),
				'visitorMix'    => array_values(
					array_filter(
						Key_Factors::sum_by( $breakdowns, 'userType' ),
						fn( $row ) => '' !== $row['label']
					)
				),
				// Analytics reports `(direct)` for a visit that no site referred.
				'referrers'     => array_values(
					array_filter(
						Key_Factors::sum_by( $sources, 'source' ),
						fn( $row ) => '(direct)' !== $row['label']
					)
				),
				'searchQueries' => isset( $contextual_data['searchQueries'] ) ? $contextual_data['searchQueries'] : array(),
				'content'       => isset( $contextual_data['content'] ) ? $contextual_data['content'] : array(),
			)
		);
	}

	/**
	 * Gets the options of every report the response needs before the key
	 * factor cards are picked.
	 *
	 * The content report counts visits by the post date custom dimension, so it
	 * runs only when the property has the dimension. See `has_custom_dimension()`.
	 *
	 * @since 1.190.0
	 * @since n.e.x.t Runs the content report when the property has the post date dimension, whether or not Site Kit has recorded that it has data.
	 * @since n.e.x.t Runs the four channel breakdowns in place of the channel, device, visitor mix and referrer reports, and no categories report.
	 *
	 * @param Report_Options $report_options The report options for the selected period.
	 * @return array Report request options, keyed by `dailyTraffic` or by contextual data key, such as `channelBreakdowns`. The daily series is first.
	 */
	private function get_report_requests( Report_Options $report_options ) {
		$requests = array(
			'dailyTraffic'      => $report_options->get_daily_series_options(),
			'channelBreakdowns' => $report_options->get_channel_breakdowns_options(),
			'channelSources'    => $report_options->get_channel_sources_options(),
			'channelPages'      => $report_options->get_channel_pages_options(),
			'channelCampaigns'  => $report_options->get_channel_campaigns_options(),
		);

		if ( $this->has_custom_dimension( Analytics_4::CUSTOM_DIMENSION_POST_DATE ) ) {
			$requests['content'] = $report_options->get_content_options();
		}

		return $requests;
	}

	/**
	 * Checks whether the property has a custom dimension, so a report can ask
	 * for it.
	 *
	 * The property has a dimension when the module's `availableCustomDimensions`
	 * setting lists it, or when Site Kit has recorded that the dimension has
	 * data. Site Kit records this only when a Key Metrics tile that needs the
	 * dimension is shown, so the recorded state alone misses a dimension
	 * that has data on a site without such a tile. A dimension that has no data
	 * yet returns no rows.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $custom_dimension The custom dimension slug, such as `googlesitekit_post_date`.
	 * @return bool True if the property has the custom dimension, otherwise false.
	 */
	private function has_custom_dimension( $custom_dimension ) {
		$data_availability = $this->custom_dimensions_data_available->get_data_availability();

		if ( ! empty( $data_availability[ $custom_dimension ] ) ) {
			return true;
		}

		$settings = $this->analytics_4->get_settings()->get();

		return is_array( $settings['availableCustomDimensions'] )
			&& in_array( $custom_dimension, $settings['availableCustomDimensions'], true );
	}

	/**
	 * Runs the reports in batch calls, because one `GET:batch-report` call takes
	 * at most five reports.
	 *
	 * @since 1.190.0
	 *
	 * @param array $requests The report request options, keyed by what each report is for, such as `dailyTraffic`.
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
	 * @since 1.190.0
	 * @since n.e.x.t Each row has its `count` in place of its `visitors`, since the daily series counts visits.
	 *
	 * @param Google_Service_AnalyticsData_RunReportResponse $report A report from a batch call.
	 * @return array List of rows, each with its dimension `values` in the order the report asked for them, its `dateRange`, and its `count`, the value of the report's one metric: the visits of a day of the daily series, or of a dimension value.
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
				'count'     => (int) $row->getMetricValues()[0]->getValue(),
			);
		}

		return $rows;
	}

	/**
	 * Gets each day's visits in the daily series, oldest first.
	 *
	 * Analytics returns no row for a day with no visits, so that day is listed
	 * with `0` visits. `Response_Encoder` keeps only the first date, so every
	 * day has to be in the list.
	 *
	 * @since 1.190.0
	 * @since 1.191.0 Lists each day's count as `visits` in place of `visitors`.
	 * @since 1.192.0 Method renamed from `get_daily_traffic()`, and changed from walking 395 days to walking every day from `$first_date` to `$end_date`.
	 *
	 * @param array  $report_rows The rows of the daily series report.
	 * @param string $first_date  The first day of the daily series, as `YYYY-MM-DD`.
	 * @param string $end_date    The last day of the daily series, as `YYYY-MM-DD`.
	 * @return array List of days, each with `visits` and a `date` as `YYYY-MM-DD`.
	 */
	private function get_daily_series( array $report_rows, $first_date, $end_date ) {
		$visits_by_date = array();

		foreach ( $report_rows as $report_row ) {
			$visits_by_date[ $report_row['values'][0] ] = $report_row['count'];
		}

		$utc          = new DateTimeZone( 'UTC' );
		$date         = new DateTimeImmutable( $first_date, $utc );
		$end          = new DateTimeImmutable( $end_date, $utc );
		$daily_series = array();

		// The day after `9999-12-31` formats as `10000-01-01`, which sorts
		// before it as a string, so the loop compares the dates themselves.
		while ( $date <= $end ) {
			$daily_series[] = array(
				'date'   => $date->format( 'Y-m-d' ),
				'visits' => $visits_by_date[ $date->format( 'Ymd' ) ] ?? 0,
			);

			$date = $date->modify( '+1 day' );
		}

		return $daily_series;
	}

	/**
	 * Gets the days of the selected period from the daily series, oldest first,
	 * each with the bounds of its expected range.
	 *
	 * The daily series starts with the history the expected range is fitted on,
	 * which `dailyTraffic` leaves out.
	 *
	 * @since 1.192.0
	 * @since n.e.x.t Added the `$end_date` and `$period_baseline` parameters, and gives each day `expectedMin` and `expectedMax`.
	 *
	 * @param array                $daily_series    The days of the daily series, oldest first, each with `visits` and a `date` as `YYYY-MM-DD`.
	 * @param string               $start_date      The first day of the selected period, as `YYYY-MM-DD`.
	 * @param string               $end_date        The last day of the selected period, as `YYYY-MM-DD`.
	 * @param Period_Baseline|null $period_baseline The model of the same daily series, or null when the period has no band.
	 * @return array List of days from `$start_date` on, keyed from `0`, each with `date`, `visits`, `expectedMin` and `expectedMax`.
	 */
	private function get_daily_traffic( array $daily_series, $start_date, $end_date, ?Period_Baseline $period_baseline ) {
		$period_days = array_values(
			array_filter(
				$daily_series,
				fn( $day ) => $day['date'] >= $start_date
			)
		);

		// The band comes from the same fits as the range the insight request
		// sends as its `baseline`, and its days add up to that range.
		$daily_ranges = $period_baseline ? $period_baseline->get_daily_ranges( $end_date, count( $period_days ) ) : null;

		return array_map(
			function ( $day ) use ( $daily_ranges ) {
				$daily_range = isset( $daily_ranges[ $day['date'] ] ) ? $daily_ranges[ $day['date'] ] : null;

				return array(
					'date'        => $day['date'],
					'visits'      => $day['visits'],
					'expectedMin' => $daily_range ? $daily_range['expected_min'] : null,
					'expectedMax' => $daily_range ? $daily_range['expected_max'] : null,
				);
			},
			$period_days
		);
	}

	/**
	 * Adds up each day's visits from one date to another.
	 *
	 * @since 1.190.0
	 * @since 1.191.0 Renamed from `sum_visitors()`.
	 * @since 1.192.0 Parameter `$daily_traffic` renamed to `$daily_series`, because `dailyTraffic` now has the selected period alone.
	 *
	 * @param array  $daily_series The days of the daily series, each with `visits` and a `date` as `YYYY-MM-DD`.
	 * @param string $start_date   The first day to count, as `YYYY-MM-DD`.
	 * @param string $end_date     The last day to count, as `YYYY-MM-DD`.
	 * @return int The total visits from `$start_date` to `$end_date`.
	 */
	private function sum_visits( array $daily_series, $start_date, $end_date ) {
		$visits = 0;

		foreach ( $daily_series as $day ) {
			if ( $day['date'] >= $start_date && $day['date'] <= $end_date ) {
				$visits += $day['visits'];
			}
		}

		return $visits;
	}

	/**
	 * Builds the rows of each contextual data key from its report.
	 *
	 * @since 1.190.0
	 * @since n.e.x.t Builds the rows of the channel breakdowns, keyed by contextual data key.
	 *
	 * @param array  $reports  The report rows, keyed by `dailyTraffic` or by contextual data key.
	 * @param string $end_date The end date, as `YYYY-MM-DD`.
	 * @return array Rows, keyed by contextual data key. Every row has its `current` and `previous` visits.
	 */
	private function build_contextual_data( array $reports, $end_date ) {
		$contextual_data = array();

		foreach ( array_keys( self::BREAKDOWN_FIELDS ) as $contextual_data_key ) {
			if ( isset( $reports[ $contextual_data_key ] ) ) {
				$contextual_data[ $contextual_data_key ] = $this->build_breakdown_rows( $contextual_data_key, $reports[ $contextual_data_key ] );
			}
		}

		if ( isset( $reports['content'] ) ) {
			$contextual_data['content'] = $this->build_content_rows( $this->pair_periods( $reports['content'], 1 ), $end_date );
		}

		return $contextual_data;
	}

	/**
	 * Builds the rows of a breakdown report, one per combination of its
	 * dimension values.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $breakdown   The key of the breakdown in `BREAKDOWN_FIELDS`, such as `channelPages`.
	 * @param array  $report_rows The rows of the report.
	 * @return array List of rows, each with its dimension values under the fields `BREAKDOWN_FIELDS` names, and its `current` and `previous` visits.
	 */
	private function build_breakdown_rows( $breakdown, array $report_rows ) {
		$fields = self::BREAKDOWN_FIELDS[ $breakdown ];

		return array_map(
			fn( $pair ) => array_merge(
				array_combine( $fields, array_slice( $pair['values'], 0, count( $fields ) ) ),
				array(
					'current'  => $pair['current'],
					'previous' => $pair['previous'],
				)
			),
			$this->pair_periods( $report_rows, count( $fields ) )
		);
	}

	/**
	 * Runs each `googlesitekit_benchmarking_contextual_data` callback, so another
	 * module can add the rows of a dimension Analytics doesn't report, such as
	 * `searchQueries`.
	 *
	 * Each callback runs in its own `try`, rather than all of them in one
	 * `apply_filters()` call, so a callback that throws or doesn't return an
	 * array is skipped and the rows every other callback and Analytics added are
	 * kept. Running them outside `apply_filters()` also means `current_filter()`
	 * and the `all` hook don't see the filter. They still run in the order of
	 * their priority, since `WP_Hook` keeps them sorted by it.
	 *
	 * @since 1.190.0
	 *
	 * @param array $contextual_data The rows built from Analytics reports, keyed by contextual data key.
	 * @param array $args            The dates and the row limit the callbacks receive.
	 * @return array The rows, keyed by contextual data key, validated after each callback that returned an array.
	 */
	private function filter_contextual_data( array $contextual_data, array $args ) {
		global $wp_filter;

		if ( ! isset( $wp_filter['googlesitekit_benchmarking_contextual_data'] ) ) {
			return $contextual_data;
		}

		$validator = new Contextual_Data_Validator();

		/**
		 * Filters the rows the key factor cards are picked from and the
		 * insight request is written from.
		 *
		 * A callback adds rows under a contextual data key. Each key has its
		 * own row fields, and every row has the visits (sessions) of the
		 * selected and the compare period as `current` and `previous`, or
		 * the clicks for a search query:
		 * - `channelBreakdowns`: `channel`, `device` and `userType`.
		 * - `channelSources`: `channel` and `source`.
		 * - `channelPages`: `channel` and `page`, the landing page's path.
		 * - `channelCampaigns`: `channel` and `campaign`.
		 * - `searchQueries`: `label`, and the average position of each
		 *   period as `positionCurrent` and `positionPrevious`, or `null`
		 *   for a period the query isn't reported in.
		 * - `searchClicks`: one row, with no field besides the clicks of
		 *   every search query.
		 * - `content`: `url`, `title` and `publishedDaysAgo`.
		 *
		 * What a callback returns is checked before the next callback receives
		 * it. These are removed:
		 * - A key or a row field the response doesn't define.
		 * - A key whose value isn't a list of rows.
		 * - A row that misses a field or has a value of the wrong type.
		 *
		 * A numeric string is stored as a number. A row a callback adds counts
		 * towards the key factor cards like any other row.
		 *
		 * @since 1.190.0
		 * @since n.e.x.t The rows count visits in place of visitors.
		 * @since n.e.x.t The channel breakdowns in place of the channel, device, visitor mix, referrer and category rows.
		 * @since n.e.x.t Added `searchClicks`.
		 *
		 * @param array $contextual_data The rows, keyed by contextual data key.
		 * @param array $args {
		 *     The period the rows are for.
		 *
		 *     @type string $start_date         The start date of the selected period, as `YYYY-MM-DD`.
		 *     @type string $end_date           The end date of the selected period, as `YYYY-MM-DD`.
		 *     @type string $compare_start_date The start date of the compare period, as `YYYY-MM-DD`.
		 *     @type string $compare_end_date   The end date of the compare period, as `YYYY-MM-DD`.
		 *     @type int    $row_limit          The most rows to ask a report for.
		 * }
		 */
		foreach ( $wp_filter['googlesitekit_benchmarking_contextual_data']->callbacks as $priority_callbacks ) {
			foreach ( $priority_callbacks as $callback ) {
				try {
					// Pass only as many arguments as the callback accepts, as
					// `apply_filters()` does.
					$filtered_data = call_user_func_array(
						$callback['function'],
						array_slice( array( $contextual_data, $args ), 0, (int) $callback['accepted_args'] )
					);
				} catch ( \Throwable $exception ) {
					continue;
				}

				if ( is_array( $filtered_data ) ) {
					$contextual_data = $validator->validate( $filtered_data );
				}
			}
		}

		return $contextual_data;
	}

	/**
	 * Pairs a dimension report's two periods by the values of its first
	 * dimensions.
	 *
	 * A combination of values missing from one period has `0` visits in that
	 * period. A pair keeps the `values` of its first row, such as a page's
	 * title, and the rows of the selected period are read first.
	 *
	 * @since 1.190.0
	 * @since n.e.x.t Added the `$key_count` parameter.
	 *
	 * @param array $report_rows The rows of a dimension report.
	 * @param int   $key_count   The number of dimensions, from the first, whose values identify a pair.
	 * @return array List of pairs, one per combination of values. Each pair has `current` and `previous`, and the `values` of the first row read for that combination.
	 */
	private function pair_periods( array $report_rows, $key_count ) {
		$pairs = array();

		foreach ( array(
			'date_range_0' => 'current',
			'date_range_1' => 'previous',
		) as $date_range => $count_key ) {
			foreach ( $report_rows as $report_row ) {
				if ( $date_range !== $report_row['dateRange'] ) {
					continue;
				}

				// A list of the values identifies a pair, since no separator can
				// be told apart from a value with it in.
				$value = wp_json_encode( array_slice( $report_row['values'], 0, $key_count ) );

				if ( ! isset( $pairs[ $value ] ) ) {
					$pairs[ $value ] = array(
						'values'   => $report_row['values'],
						'current'  => 0,
						'previous' => 0,
					);
				}

				$pairs[ $value ][ $count_key ] += $report_row['count'];
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
	 * @since 1.190.0
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

			// The `!` sets the time to midnight, so `$published` and `$end` are
			// whole days apart.
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
}
