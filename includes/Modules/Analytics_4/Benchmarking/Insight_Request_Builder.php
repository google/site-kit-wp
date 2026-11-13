<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Benchmarking\Insight_Request_Builder
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Benchmarking;

use DateTimeImmutable;
use DateTimeZone;

/**
 * Builds the request the generated benchmarking insight is written from.
 *
 * The request has the shape of the body of the Site Kit service's
 * `POST /v1/ai/benchmarking` endpoint, without the site credentials and the
 * `async` flag, which `Google_Proxy` adds. It describes the selected period,
 * compared with the period before it, so its `days_in_period` is the length of
 * the date range the header shows, and it is built from the reports the
 * benchmarking response runs anyway. Every figure counts visits (sessions),
 * except the search query rows, which count clicks.
 *
 * The service requires only the period totals, and narrates whatever else the
 * request has, so a field without data is left out rather than sent empty.
 *
 * Building the request is deterministic: the same reports always give the same
 * request, since the service keys the insights it keeps for a day on the
 * request's values.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Insight_Request_Builder {

	/**
	 * The shortest period the service writes an insight for: one whole week.
	 *
	 * @since n.e.x.t
	 */
	const MIN_PERIOD_DAYS = 7;

	/**
	 * The longest period the service writes an insight for: 52 whole weeks.
	 *
	 * @since n.e.x.t
	 */
	const MAX_PERIOD_DAYS = 364;

	/**
	 * The most referring sites the request lists.
	 *
	 * @since n.e.x.t
	 */
	const MAX_REFERRERS = 10;

	/**
	 * The most search queries the request lists.
	 *
	 * @since n.e.x.t
	 */
	const MAX_SEARCH_QUERIES = 10;

	/**
	 * The most recently published posts the request lists.
	 *
	 * @since n.e.x.t
	 */
	const MAX_RECENT_CONTENT = 10;

	/**
	 * The paths, in lower case and without a trailing slash, that the service
	 * reads as the home page rather than as content.
	 *
	 * @since n.e.x.t
	 */
	const HOME_PAGE_PATHS = array( '', '/home', '/index.html', '/index.php' );

	/**
	 * Builds the request for the selected period.
	 *
	 * The request has no `baseline` while the site has too little recorded
	 * traffic for an expected range, and the service then says it is still
	 * learning what's usual for the site. In that case the request has
	 * `history_days` instead, so the service can say when the site will have a
	 * range.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $start_date      The first day of the selected period, as `YYYY-MM-DD`.
	 * @param string $end_date        The last day of the selected period, as `YYYY-MM-DD`.
	 * @param array  $daily_series    The visits of every day up to and including `$end_date`, oldest first, each as `array( 'date' => 'YYYY-MM-DD', 'visits' => int )`.
	 * @param array  $visits          The visits of the selected period and of the period before it, as `current` and `previous`.
	 * @param array  $contextual_data The rows of the benchmarking response, keyed by `contextualData` key, before they are ranked.
	 * @return array|null The request, or null when there is no insight to request: the period is shorter than `MIN_PERIOD_DAYS` days or longer than `MAX_PERIOD_DAYS` days, or neither period has a visit.
	 */
	public function build( $start_date, $end_date, array $daily_series, array $visits, array $contextual_data ) {
		$days_in_period = $this->get_days_in_period( $start_date, $end_date );

		if ( $days_in_period < self::MIN_PERIOD_DAYS || $days_in_period > self::MAX_PERIOD_DAYS ) {
			return null;
		}

		$current_period  = isset( $visits['current'] ) ? max( 0, (int) $visits['current'] ) : 0;
		$previous_period = isset( $visits['previous'] ) ? max( 0, (int) $visits['previous'] ) : 0;

		// The service has no change to describe without a visit in either
		// period, and refuses such a request.
		if ( 0 === $current_period && 0 === $previous_period ) {
			return null;
		}

		$period_baseline = Period_Baseline::from_daily_series( $daily_series );

		$request = array(
			'end_date'       => $end_date,
			'days_in_period' => $days_in_period,
			'visits'         => array(
				'current_period'  => $current_period,
				'previous_period' => $previous_period,
			),
		);

		$last_year = $period_baseline->get_last_year_visits( $end_date, $days_in_period );

		if ( null !== $last_year ) {
			$request['visits']['last_year'] = $last_year;
		}

		$baseline = $period_baseline->get_range( $end_date, $days_in_period );

		if ( null !== $baseline ) {
			$request['baseline'] = $baseline;
		} else {
			$request['history_days'] = $period_baseline->get_history_days( $end_date );
		}

		$request_contextual_data = $this->build_contextual_data( $contextual_data, $days_in_period );

		if ( ! empty( $request_contextual_data ) ) {
			$request['contextual_data'] = $request_contextual_data;
		}

		return $request;
	}

	/**
	 * Gets the number of days from one date to another, both included.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $start_date The first day, as `YYYY-MM-DD`.
	 * @param string $end_date   The last day, as `YYYY-MM-DD`.
	 * @return int The number of days.
	 */
	private function get_days_in_period( $start_date, $end_date ) {
		$utc = new DateTimeZone( 'UTC' );

		return ( new DateTimeImmutable( $start_date, $utc ) )->diff( new DateTimeImmutable( $end_date, $utc ) )->days + 1;
	}

	/**
	 * Builds the `contextual_data` of the request from the rows of the
	 * benchmarking response.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $contextual_data The rows, keyed by `contextualData` key.
	 * @param int   $days_in_period  The number of days in the selected period.
	 * @return array The contextual data, keyed by the service's field names, without the fields that have no rows.
	 */
	private function build_contextual_data( array $contextual_data, $days_in_period ) {
		$fields = array(
			// Every channel, so the channels add up to the site's visits.
			'traffic_channel_surges'  => array_map(
				fn( $row ) => array(
					'channel'  => $row['label'],
					'sessions' => $this->get_pair( $row ),
				),
				$this->sort_by_current( $this->get_rows( $contextual_data, 'channels' ) )
			),
			'device_shifts'           => array_map(
				fn( $row ) => array(
					'device'   => $row['label'],
					'sessions' => $this->get_pair( $row ),
				),
				$this->sort_by_current( $this->get_rows( $contextual_data, 'devices' ) )
			),
			'user_mix_shifts'         => array_map(
				fn( $row ) => array(
					'segment'  => $row['label'],
					'sessions' => $this->get_pair( $row ),
				),
				$this->sort_by_current( $this->get_rows( $contextual_data, 'visitorMix' ) )
			),
			'referrers'               => array_map(
				fn( $row ) => array(
					'referrer' => $row['label'],
					'sessions' => $this->get_pair( $row ),
				),
				$this->get_referrer_rows( $contextual_data )
			),
			'search_query_shifts'     => array_map(
				fn( $row ) => array(
					'query'    => $row['label'],
					'clicks'   => $this->get_pair( $row ),
					'position' => array(
						'current'  => $this->get_position( $row['positionCurrent'] ),
						'previous' => $this->get_position( $row['positionPrevious'] ),
					),
				),
				$this->get_search_query_rows( $contextual_data )
			),
			'recent_content_momentum' => array_map(
				fn( $row ) => array(
					'url'                => $row['url'],
					'title'              => $row['title'],
					'published_days_ago' => (int) $row['publishedDaysAgo'],
					'sessions'           => (int) $row['current'],
				),
				$this->get_recent_content_rows( $contextual_data, $days_in_period )
			),
		);

		return array_filter( $fields );
	}

	/**
	 * Gets the rows of one `contextualData` key.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $contextual_data     The rows, keyed by `contextualData` key.
	 * @param string $contextual_data_key The key, such as `channels`.
	 * @return array The rows, or an empty list when the key has none.
	 */
	private function get_rows( array $contextual_data, $contextual_data_key ) {
		return isset( $contextual_data[ $contextual_data_key ] ) && is_array( $contextual_data[ $contextual_data_key ] )
			? array_values( $contextual_data[ $contextual_data_key ] )
			: array();
	}

	/**
	 * Sorts rows by their visits in the selected period, most first, and then
	 * by their label.
	 *
	 * `usort()` isn't stable on PHP 7.4, so the label orders rows with the same
	 * visits, for the request to come out the same on every run.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $rows The rows, each with `label` and `current`.
	 * @return array The sorted rows.
	 */
	private function sort_by_current( array $rows ) {
		usort(
			$rows,
			fn( $first, $second ) => ( $second['current'] <=> $first['current'] ) ?: strcmp( $first['label'], $second['label'] )
		);

		return $rows;
	}

	/**
	 * Sorts rows by how far they moved from one period to the other, most
	 * first, then by their larger period, and then by their label.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $rows The rows, each with `label`, `current` and `previous`.
	 * @return array The sorted rows.
	 */
	private function sort_by_change( array $rows ) {
		usort(
			$rows,
			fn( $first, $second ) => ( abs( $second['current'] - $second['previous'] ) <=> abs( $first['current'] - $first['previous'] ) )
				?: ( max( $second['current'], $second['previous'] ) <=> max( $first['current'], $first['previous'] ) )
				?: strcmp( $first['label'], $second['label'] )
		);

		return $rows;
	}

	/**
	 * Gets the referring sites the request lists: the `MAX_REFERRERS` that moved
	 * most, among the sites with more than one visit in either period.
	 *
	 * Analytics names the visits it has no source for with a placeholder in
	 * parentheses, such as `(not set)`, which is no site.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $contextual_data The rows, keyed by `contextualData` key.
	 * @return array The rows of the referring sites.
	 */
	private function get_referrer_rows( array $contextual_data ) {
		$rows = array_filter(
			$this->get_rows( $contextual_data, 'referrers' ),
			fn( $row ) => ! $this->is_placeholder( $row['label'] ) && max( $row['current'], $row['previous'] ) > 1
		);

		return array_slice( $this->sort_by_change( $rows ), 0, self::MAX_REFERRERS );
	}

	/**
	 * Gets the search queries the request lists: the `MAX_SEARCH_QUERIES` whose
	 * clicks moved most.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $contextual_data The rows, keyed by `contextualData` key.
	 * @return array The rows of the search queries.
	 */
	private function get_search_query_rows( array $contextual_data ) {
		$rows = array_filter(
			$this->get_rows( $contextual_data, 'searchQueries' ),
			fn( $row ) => '' !== trim( $row['label'] )
		);

		return array_slice( $this->sort_by_change( $rows ), 0, self::MAX_SEARCH_QUERIES );
	}

	/**
	 * Gets the recently published posts the request lists: the
	 * `MAX_RECENT_CONTENT` with the most visits in the selected period, among the
	 * posts published during it.
	 *
	 * The home page is no published post, even when Analytics reports a post
	 * date for it.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $contextual_data The rows, keyed by `contextualData` key.
	 * @param int   $days_in_period  The number of days in the selected period.
	 * @return array The rows of the posts.
	 */
	private function get_recent_content_rows( array $contextual_data, $days_in_period ) {
		$rows = array_filter(
			$this->get_rows( $contextual_data, 'content' ),
			fn( $row ) => $row['current'] > 0
				&& $row['publishedDaysAgo'] <= $days_in_period
				&& ! $this->is_home_page( $row['url'] )
		);

		usort(
			$rows,
			fn( $first, $second ) => ( $second['current'] <=> $first['current'] ) ?: strcmp( $first['url'], $second['url'] )
		);

		return array_slice( $rows, 0, self::MAX_RECENT_CONTENT );
	}

	/**
	 * Gets the visits, or clicks, of a row in each period.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $row The row, with `current` and `previous`.
	 * @return array The pair, with `current` and `previous` as integers.
	 */
	private function get_pair( array $row ) {
		return array(
			'current'  => (int) $row['current'],
			'previous' => (int) $row['previous'],
		);
	}

	/**
	 * Gets the average position of a search query in a period, rounded to one
	 * decimal place.
	 *
	 * A query that Search Console didn't report in a period has no position in
	 * it, which the service reads as `0`, the position of a query without
	 * clicks.
	 *
	 * @since n.e.x.t
	 *
	 * @param float|null $position The average position, or null.
	 * @return float The rounded position.
	 */
	private function get_position( $position ) {
		return null === $position ? 0.0 : round( (float) $position, 1 );
	}

	/**
	 * Checks whether a value is empty or one of the placeholders Analytics
	 * reports in parentheses, such as `(not set)` or `(direct)`.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $value The value.
	 * @return bool True when the value is a placeholder, false otherwise.
	 */
	private function is_placeholder( $value ) {
		$value = trim( $value );

		return '' === $value || ( '(' === substr( $value, 0, 1 ) && ')' === substr( $value, -1 ) );
	}

	/**
	 * Checks whether a page is the site's home page.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $url The page's path or URL.
	 * @return bool True when the page is the home page, false otherwise.
	 */
	private function is_home_page( $url ) {
		$path = wp_parse_url( $url, PHP_URL_PATH );
		$path = is_string( $path ) ? strtolower( untrailingslashit( $path ) ) : '';

		return in_array( $path, self::HOME_PAGE_PATHS, true );
	}
}
