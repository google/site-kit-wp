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
 * The request carries the key factor cards the panel shows, as
 * `decomposition`, so the insight's driver text describes those cards rather
 * than rows the service ranks itself.
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
	 * The most landing pages the request lists for each channel and direction:
	 * the pages that rose most, and the pages that fell most.
	 *
	 * @since n.e.x.t
	 */
	const MAX_CHANNEL_PAGES_PER_DIRECTION = 30;

	/**
	 * The most campaigns the request lists for each channel.
	 *
	 * @since n.e.x.t
	 */
	const MAX_CHANNEL_CAMPAIGNS = 5;

	/**
	 * The most visited pages the request lists for each period.
	 *
	 * @since n.e.x.t
	 */
	const MAX_TOP_PAGES = 20;

	/**
	 * The paths, in lower case and without a trailing slash, that the service
	 * reads as the home page rather than as content.
	 *
	 * @since n.e.x.t
	 */
	const HOME_PAGE_PATHS = array( '', '/home', '/index.html', '/index.php' );

	/**
	 * The ID of the post at each path looked up so far, or `0` for a path that
	 * isn't a post.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	private $post_ids = array();

	/**
	 * Builds the request for the selected period.
	 *
	 * The request has no `baseline` while the site has too little recorded
	 * traffic for an expected range, fewer than
	 * `Period_Baseline::get_min_band_history_days()` days, and the service
	 * then says it is still learning what's usual for the site. In that case
	 * the request has `history_days` instead, so the service can say when the
	 * site will have a range.
	 *
	 * The request carries the given `decomposition`, the key factor cards the
	 * panel shows, as `Key_Factors::get_decomposition()` builds them. It has
	 * one with no cards when the panel shows none, so the service doesn't name
	 * a driver the panel doesn't show.
	 *
	 * @since n.e.x.t
	 * @since n.e.x.t Added the `$decomposition` parameter, and sends the channel breakdowns, the search clicks and the most visited pages.
	 *
	 * @param string          $start_date      The first day of the selected period, as `YYYY-MM-DD`.
	 * @param string          $end_date        The last day of the selected period, as `YYYY-MM-DD`.
	 * @param Period_Baseline $period_baseline The model of the visits of every day up to and including `$end_date`, from the first day with visits on, as `Period_Baseline::from_daily_series()` builds it. The chart's band reads the same model, so its fits are made once.
	 * @param array           $visits          The visits of the selected period and of the period before it, as `current` and `previous`.
	 * @param array           $contextual_data The rows of the benchmarking response, keyed by `contextualData` key, before they are ranked.
	 * @param array|null      $decomposition   Optional. The key factor cards the panel shows, as `Key_Factors::get_decomposition()` returns them, or null without channels. Default null.
	 * @return array|null The request, or null when there is no insight to request: the period is shorter than `MIN_PERIOD_DAYS` days or longer than `MAX_PERIOD_DAYS` days, or neither period has a visit.
	 */
	public function build( $start_date, $end_date, Period_Baseline $period_baseline, array $visits, array $contextual_data, $decomposition = null ) {
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

		$request_contextual_data = $this->build_contextual_data( $contextual_data, $end_date, $days_in_period );

		if ( ! empty( $request_contextual_data ) ) {
			$request['contextual_data'] = $request_contextual_data;
		}

		if ( is_array( $decomposition ) ) {
			$request['decomposition'] = $decomposition;
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
	 * @since n.e.x.t Added the `$end_date` parameter, and the channel breakdowns, the search clicks and the most visited pages.
	 *
	 * @param array  $contextual_data The rows, keyed by `contextualData` key.
	 * @param string $end_date        The last day of the selected period, as `YYYY-MM-DD`.
	 * @param int    $days_in_period  The number of days in the selected period.
	 * @return array The contextual data, keyed by the service's field names, without the fields that have no rows.
	 */
	private function build_contextual_data( array $contextual_data, $end_date, $days_in_period ) {
		$compare_end_date = ( new DateTimeImmutable( $end_date, new DateTimeZone( 'UTC' ) ) )
			->modify( "-{$days_in_period} days" )
			->format( 'Y-m-d' );

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
			// Every combination, so each channel's devices and visitor types
			// add up to it.
			'channel_breakdowns'      => array_map(
				fn( $row ) => array(
					'channel'  => $row['channel'],
					'device'   => $row['device'],
					'segment'  => $row['userType'],
					'sessions' => $this->get_pair( $row ),
				),
				$this->sort_by_current( $this->get_rows( $contextual_data, 'channelBreakdowns' ), array( 'channel', 'device', 'userType' ) )
			),
			'channel_pages'           => array_map(
				fn( $row ) => array(
					'channel'  => $row['channel'],
					'url'      => $row['page'],
					'sessions' => $this->get_pair( $row ),
				),
				$this->get_channel_page_rows( $contextual_data )
			),
			'channel_campaigns'       => array_map(
				fn( $row ) => array(
					'channel'  => $row['channel'],
					'campaign' => $row['campaign'],
					'sessions' => $this->get_pair( $row ),
				),
				$this->get_channel_campaign_rows( $contextual_data )
			),
			'search_clicks'           => $this->get_search_clicks( $contextual_data ),
			// A page published after a period's last day had no categories
			// to draw visits with in it.
			'top_pages'               => $this->get_top_page_rows( $contextual_data, 'current', $end_date ),
			'previous_top_pages'      => $this->get_top_page_rows( $contextual_data, 'previous', $compare_end_date ),
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
	 * by their labels.
	 *
	 * `usort()` isn't stable on PHP 7.4, so the labels order rows with the same
	 * visits, for the request to come out the same on every run.
	 *
	 * @since n.e.x.t
	 * @since n.e.x.t Added the `$label_fields` parameter.
	 *
	 * @param array $rows         The rows, each with `current` and the label fields.
	 * @param array $label_fields Optional. The fields that label a row, compared in order. Default `array( 'label' )`.
	 * @return array The sorted rows.
	 */
	private function sort_by_current( array $rows, array $label_fields = array( 'label' ) ) {
		usort(
			$rows,
			fn( $first, $second ) => ( $second['current'] <=> $first['current'] ) ?: self::compare_labels( $first, $second, $label_fields )
		);

		return $rows;
	}

	/**
	 * Sorts rows by how far they moved from one period to the other, most
	 * first, then by their larger period, and then by their labels.
	 *
	 * @since n.e.x.t
	 * @since n.e.x.t Added the `$label_fields` parameter.
	 *
	 * @param array $rows         The rows, each with `current`, `previous` and the label fields.
	 * @param array $label_fields Optional. The fields that label a row, compared in order. Default `array( 'label' )`.
	 * @return array The sorted rows.
	 */
	private function sort_by_change( array $rows, array $label_fields = array( 'label' ) ) {
		usort(
			$rows,
			fn( $first, $second ) => ( abs( $second['current'] - $second['previous'] ) <=> abs( $first['current'] - $first['previous'] ) )
				?: ( max( $second['current'], $second['previous'] ) <=> max( $first['current'], $first['previous'] ) )
				?: self::compare_labels( $first, $second, $label_fields )
		);

		return $rows;
	}

	/**
	 * Compares the labels of two rows, field by field.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $first        The first row.
	 * @param array $second       The second row.
	 * @param array $label_fields The fields that label a row, compared in order.
	 * @return int Less than, equal to, or greater than `0` when the first row's labels sort before, with, or after the second's.
	 */
	private static function compare_labels( array $first, array $second, array $label_fields ) {
		foreach ( $label_fields as $field ) {
			$result = strcmp( $first[ $field ], $second[ $field ] );

			if ( 0 !== $result ) {
				return $result;
			}
		}

		return 0;
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
			fn( $row ) => ! self::is_placeholder( $row['label'] ) && max( $row['current'], $row['previous'] ) > 1
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
				&& ! self::is_home_page( $row['url'] )
		);

		usort(
			$rows,
			fn( $first, $second ) => ( $second['current'] <=> $first['current'] ) ?: strcmp( $first['url'], $second['url'] )
		);

		return array_slice( $rows, 0, self::MAX_RECENT_CONTENT );
	}

	/**
	 * Gets the landing pages the request lists: for each channel, the
	 * `MAX_CHANNEL_PAGES_PER_DIRECTION` pages that rose most and the
	 * `MAX_CHANNEL_PAGES_PER_DIRECTION` that fell most.
	 *
	 * The service finds the page that carried each channel's change among
	 * them, and a page that didn't move carried none of it.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $contextual_data The rows, keyed by `contextualData` key.
	 * @return array The rows of the pages, each with `channel`, `page`, `current` and `previous`.
	 */
	private function get_channel_page_rows( array $contextual_data ) {
		$rows_by_direction = array();

		foreach ( $this->get_rows( $contextual_data, 'channelPages' ) as $row ) {
			$delta = (int) $row['current'] - (int) $row['previous'];

			if ( 0 !== $delta ) {
				$rows_by_direction[ wp_json_encode( array( $row['channel'], $delta > 0 ) ) ][] = $row;
			}
		}

		$rows = array();

		foreach ( $rows_by_direction as $direction_rows ) {
			$rows = array_merge( $rows, array_slice( $this->sort_by_change( $direction_rows, array( 'page' ) ), 0, self::MAX_CHANNEL_PAGES_PER_DIRECTION ) );
		}

		return $this->sort_by_change( $rows, array( 'channel', 'page' ) );
	}

	/**
	 * Gets the campaigns the request lists: for each channel, the
	 * `MAX_CHANNEL_CAMPAIGNS` that moved most.
	 *
	 * Analytics names the visits of no campaign with a placeholder, such as
	 * `(organic)` or `(not set)`, which no card can name, and an ID or a
	 * personal label is no name a card shows either, so neither takes a
	 * campaign's place. See `Source_Classifier::get_campaign_title()`.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $contextual_data The rows, keyed by `contextualData` key.
	 * @return array The rows of the campaigns, each with `channel`, `campaign`, `current` and `previous`.
	 */
	private function get_channel_campaign_rows( array $contextual_data ) {
		$rows_by_channel = array();

		foreach ( $this->get_rows( $contextual_data, 'channelCampaigns' ) as $row ) {
			if ( '' !== Source_Classifier::get_campaign_title( $row['campaign'] ) && (int) $row['current'] !== (int) $row['previous'] ) {
				$rows_by_channel[ $row['channel'] ][] = $row;
			}
		}

		$rows = array();

		foreach ( $rows_by_channel as $channel_rows ) {
			$rows = array_merge( $rows, array_slice( $this->sort_by_change( $channel_rows, array( 'campaign' ) ), 0, self::MAX_CHANNEL_CAMPAIGNS ) );
		}

		return $this->sort_by_change( $rows, array( 'channel', 'campaign' ) );
	}

	/**
	 * Gets the site's search clicks in each period.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $contextual_data The rows, keyed by `contextualData` key.
	 * @return array|null The clicks, as `current` and `previous`, or null without them, as when Search Console isn't connected or a report failed.
	 */
	private function get_search_clicks( array $contextual_data ) {
		$rows = $this->get_rows( $contextual_data, 'searchClicks' );

		return empty( $rows ) ? null : $this->get_pair( $rows[0] );
	}

	/**
	 * Gets the `MAX_TOP_PAGES` most visited pages of a period, with the
	 * categories of the post at each.
	 *
	 * A page's visits are the sum of its visits through every channel. The
	 * home page is listed like any other page, since the service counts the
	 * categories of the most visited pages among all of them.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $contextual_data The rows, keyed by `contextualData` key.
	 * @param string $period          The period, `current` or `previous`.
	 * @param string $last_date       The period's last day, as `YYYY-MM-DD`. A post published after it has no categories in the list.
	 * @return array List of pages, most visited first, then by path. Each has `url`, the page's path, and `visits`, and `categories` when it is a post with categories.
	 */
	private function get_top_page_rows( array $contextual_data, $period, $last_date ) {
		$visits = array();

		foreach ( $this->get_rows( $contextual_data, 'channelPages' ) as $row ) {
			// A landing page's query names no other page, and Analytics names
			// the visits with no landing page with a placeholder.
			$path = preg_replace( '/[?#].*$/', '', $row['page'] );

			if ( ! self::is_placeholder( $path ) ) {
				$visits[ $path ] = ( isset( $visits[ $path ] ) ? $visits[ $path ] : 0 ) + (int) $row[ $period ];
			}
		}

		$paths = array_keys( array_filter( $visits ) );

		// A path never looks like a number, so it stays a string as a key.
		usort(
			$paths,
			fn( $first, $second ) => ( $visits[ $second ] <=> $visits[ $first ] ) ?: strcmp( $first, $second )
		);

		return array_map(
			function ( $path ) use ( $visits, $last_date ) {
				$row = array(
					'url'    => $path,
					'visits' => (int) $visits[ $path ],
				);

				$categories = $this->get_post_categories( $path, $last_date );

				if ( ! empty( $categories ) ) {
					$row['categories'] = $categories;
				}

				return $row;
			},
			array_slice( $paths, 0, self::MAX_TOP_PAGES )
		);
	}

	/**
	 * Gets the names of the categories of the published post at a path.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $path      The path of the page on the site's host, such as `/plant-garlic/`.
	 * @param string $last_date The last day the post may have been published on, as `YYYY-MM-DD` in UTC.
	 * @return array List of the names of the post's categories, or an empty list when the page isn't a post published by `$last_date`.
	 */
	private function get_post_categories( $path, $last_date ) {
		if ( ! isset( $this->post_ids[ $path ] ) ) {
			// phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.url_to_postid_url_to_postid -- A page that isn't a post simply has no categories.
			$this->post_ids[ $path ] = url_to_postid( self::get_site_origin() . $path );
		}

		$post_id = $this->post_ids[ $path ];

		if ( ! $post_id || 'publish' !== get_post_status( $post_id ) || get_post_time( 'Y-m-d', true, $post_id ) > $last_date ) {
			return array();
		}

		$categories = get_the_category( $post_id );

		// A term's name is stored with its HTML characters escaped.
		return array_values(
			array_unique(
				array_map(
					fn( $category ) => wp_specialchars_decode( $category->name, ENT_QUOTES ),
					$categories
				)
			)
		);
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
	public static function is_placeholder( $value ) {
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
	public static function is_home_page( $url ) {
		$path = wp_parse_url( $url, PHP_URL_PATH );
		$path = is_string( $path ) ? strtolower( untrailingslashit( $path ) ) : '';

		return in_array( $path, self::HOME_PAGE_PATHS, true );
	}
}
