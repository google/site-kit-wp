<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Benchmarking\Content_Markers
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
 * Picks the posts the Traffic overview chart marks: the posts published in the
 * selected period that brought it the most visits.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Content_Markers {

	/**
	 * The most posts the chart marks. The generated insight describes as many
	 * recently published posts, so on the 28 days the insight covers, the dots
	 * and the text name the same posts. A site that publishes every day would
	 * otherwise get a dot on every day of the line.
	 *
	 * @since n.e.x.t
	 */
	const MAX_POSTS = Insight_Request_Builder::MAX_RECENT_CONTENT;

	/**
	 * The most posts one marker names, so the tooltip of a busy day stays short.
	 *
	 * @since n.e.x.t
	 */
	const MAX_POSTS_PER_DAY = 2;

	/**
	 * Builds the markers from the rows of the content report.
	 *
	 * A post is marked when it was published on a day of the selected period
	 * and had visits in it. The home page is never marked, since a dot on it
	 * would label the site's front page as something that was published. Posts
	 * are ranked by their visits in the selected period, and the `MAX_POSTS`
	 * with the most visits are kept. Posts published on the same day share one
	 * marker, since one day is one dot, and a marker names the
	 * `MAX_POSTS_PER_DAY` of them with the most visits. A post a marker leaves
	 * out isn't replaced by the next post in the ranking, so every marked post
	 * is among the `MAX_POSTS` the insight describes.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $content_rows The `content` rows of the benchmarking response, before they are ranked. Each row has the post's path as `url`, its `title`, its `publishedDaysAgo` counted back from `$end_date`, and its visits in the selected period as `current`.
	 * @param string $start_date   The first day of the selected period, as `YYYY-MM-DD`.
	 * @param string $end_date     The last day of the selected period, as `YYYY-MM-DD`.
	 * @return array List of markers, oldest first. Each marker has its `date`, as `YYYY-MM-DD`, and its `posts`, at most `MAX_POSTS_PER_DAY`, most visited first, each with `title` and `url`, the post's path. A post whose title is a placeholder, such as `(not set)`, has its path as its title.
	 */
	public function build( array $content_rows, $start_date, $end_date ) {
		$utc   = new DateTimeZone( 'UTC' );
		$start = new DateTimeImmutable( $start_date, $utc );
		$end   = new DateTimeImmutable( $end_date, $utc );

		// Both days are at midnight UTC, where every day is 24 hours long, so
		// the difference of their timestamps is a whole number of days.
		$days_in_period = intdiv( $end->getTimestamp() - $start->getTimestamp(), DAY_IN_SECONDS ) + 1;

		$rows = array_filter(
			$content_rows,
			fn( $row ) => $row['current'] > 0
				&& $row['publishedDaysAgo'] < $days_in_period
				&& ! Insight_Request_Builder::is_home_page( $row['url'] )
		);

		// `usort()` isn't stable on PHP 7.4. So the `strcmp()` orders posts with
		// the same visits by path, to come back in the same order on every run.
		usort(
			$rows,
			fn( $first, $second ) => ( $second['current'] <=> $first['current'] ) ?: strcmp( $first['url'], $second['url'] )
		);

		$posts_by_date = array();

		foreach ( array_slice( $rows, 0, self::MAX_POSTS ) as $row ) {
			$date = $end->modify( sprintf( '-%d days', $row['publishedDaysAgo'] ) )->format( 'Y-m-d' );

			// The rows are ranked, so a day's first posts are its most visited.
			if ( isset( $posts_by_date[ $date ] ) && count( $posts_by_date[ $date ] ) >= self::MAX_POSTS_PER_DAY ) {
				continue;
			}

			$posts_by_date[ $date ][] = array(
				'title' => Insight_Request_Builder::is_placeholder( $row['title'] ) ? $row['url'] : $row['title'],
				'url'   => $row['url'],
			);
		}

		ksort( $posts_by_date );

		$markers = array();

		foreach ( $posts_by_date as $date => $posts ) {
			$markers[] = array(
				'date'  => $date,
				'posts' => $posts,
			);
		}

		return $markers;
	}
}
