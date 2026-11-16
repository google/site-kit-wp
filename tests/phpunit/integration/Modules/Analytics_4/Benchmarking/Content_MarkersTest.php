<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking\Content_MarkersTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking;

use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Content_Markers;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Analytics_4
 */
class Content_MarkersTest extends TestCase {

	/**
	 * Content_Markers instance.
	 *
	 * @var Content_Markers
	 */
	private $content_markers;

	public function set_up() {
		parent::set_up();

		$this->content_markers = new Content_Markers();
	}

	/**
	 * Builds a `content` row.
	 *
	 * @param string $url                The post's path.
	 * @param int    $published_days_ago The days from the post's publication to `2026-09-15`.
	 * @param int    $current            The post's visits in the selected period.
	 * @param string $title              Optional. The post's title. Default is made from the path.
	 * @return array The row.
	 */
	private function get_row( $url, $published_days_ago, $current, $title = null ) {
		return array(
			'url'              => $url,
			'title'            => null === $title ? ucfirst( str_replace( '-', ' ', trim( $url, '/' ) ) ) : $title,
			'publishedDaysAgo' => $published_days_ago,
			'current'          => $current,
			'previous'         => 0,
		);
	}

	public function test_build__marks_the_day_of_each_post_published_in_the_period_oldest_first() {
		$markers = $this->content_markers->build(
			array(
				$this->get_row( '/mulching-in-autumn/', 3, 40 ),
				$this->get_row( '/how-to-plant-garlic/', 14, 96 ),
			),
			'2026-08-19',
			'2026-09-15'
		);

		$this->assertSame(
			array(
				array(
					'date'  => '2026-09-01',
					'posts' => array(
						array(
							'title' => 'How to plant garlic',
							'url'   => '/how-to-plant-garlic/',
						),
					),
				),
				array(
					'date'  => '2026-09-12',
					'posts' => array(
						array(
							'title' => 'Mulching in autumn',
							'url'   => '/mulching-in-autumn/',
						),
					),
				),
			),
			$markers,
			'Each post should be marked on the day it was published, counted back from `2026-09-15`, with the oldest day first.'
		);
	}

	public function test_build__marks_posts_published_on_the_first_and_the_last_day_of_the_period() {
		$markers = $this->content_markers->build(
			array(
				$this->get_row( '/first-day/', 27, 10 ),
				$this->get_row( '/last-day/', 0, 10 ),
			),
			'2026-08-19',
			'2026-09-15'
		);

		$this->assertSame(
			array( '2026-08-19', '2026-09-15' ),
			array_column( $markers, 'date' ),
			'A post published on the first day, 27 days before the last, and a post published on the last day should both be marked.'
		);
	}

	public function test_build__does_not_mark_a_post_published_before_the_period() {
		$markers = $this->content_markers->build(
			array(
				// 28 days before `2026-09-15` is `2026-08-18`, the day before the
				// period starts.
				$this->get_row( '/day-before/', 28, 500 ),
				$this->get_row( '/last-year/', 400, 900 ),
			),
			'2026-08-19',
			'2026-09-15'
		);

		$this->assertSame( array(), $markers, 'A post published before the first day of the period should not be marked, however many visits it had.' );
	}

	public function test_build__does_not_mark_a_post_without_visits_in_the_period() {
		$markers = $this->content_markers->build(
			array( $this->get_row( '/no-visits/', 3, 0 ) ),
			'2026-08-19',
			'2026-09-15'
		);

		$this->assertSame( array(), $markers, 'A post with no visits in the selected period should not be marked.' );
	}

	/**
	 * @dataProvider data_home_page_paths
	 *
	 * @param string $url A path the service reads as the home page.
	 */
	public function test_build__does_not_mark_the_home_page( $url ) {
		$markers = $this->content_markers->build(
			array( $this->get_row( $url, 3, 900, 'Home' ) ),
			'2026-08-19',
			'2026-09-15'
		);

		$this->assertSame( array(), $markers, "The home page, `$url`, should not be marked even when Analytics reports a post date for it." );
	}

	public function data_home_page_paths() {
		return array(
			'the root'                  => array( '/' ),
			'the index file'            => array( '/index.php' ),
			'home in another case'      => array( '/Home/' ),
			'a full URL of the root'    => array( 'https://example.com/' ),
			'the index file as an HTML' => array( '/index.html' ),
		);
	}

	public function test_build__keeps_the_10_posts_with_the_most_visits() {
		$rows = array();

		// Twelve posts, one a day, the newest with the most visits.
		for ( $days_ago = 0; $days_ago < 12; $days_ago++ ) {
			$rows[] = $this->get_row( "/post-$days_ago/", $days_ago, 100 - $days_ago );
		}

		$markers = $this->content_markers->build( $rows, '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array( '/post-9/', '/post-8/', '/post-7/', '/post-6/', '/post-5/', '/post-4/', '/post-3/', '/post-2/', '/post-1/', '/post-0/' ),
			array_map( fn( $marker ) => $marker['posts'][0]['url'], $markers ),
			'The 10 posts with the most visits should be marked, and the 2 with the fewest, `/post-10/` and `/post-11/`, left out.'
		);
	}

	public function test_build__breaks_a_tie_in_visits_by_path() {
		$rows = array();

		// Twelve posts with the same visits, one a day, `/post-00/` the oldest.
		for ( $post = 11; $post >= 0; $post-- ) {
			$rows[] = $this->get_row( sprintf( '/post-%02d/', $post ), 11 - $post, 50 );
		}

		$markers = $this->content_markers->build( $rows, '2026-08-19', '2026-09-15' );

		$this->assertSame(
			array( '/post-00/', '/post-01/', '/post-02/', '/post-03/', '/post-04/', '/post-05/', '/post-06/', '/post-07/', '/post-08/', '/post-09/' ),
			array_map( fn( $marker ) => $marker['posts'][0]['url'], $markers ),
			'Among posts with the same visits, the first 10 by path should be kept, and the last 2 by path, `/post-10/` and `/post-11/`, left out, though they are the newest.'
		);
	}

	public function test_build__puts_the_posts_of_one_day_in_one_marker_most_visited_first() {
		$markers = $this->content_markers->build(
			array(
				$this->get_row( '/storing-garlic/', 14, 30 ),
				$this->get_row( '/mulching-in-autumn/', 3, 40 ),
				$this->get_row( '/how-to-plant-garlic/', 14, 96 ),
			),
			'2026-08-19',
			'2026-09-15'
		);

		$this->assertCount( 2, $markers, 'The two posts of `2026-09-01` should share one marker.' );
		$this->assertSame( '2026-09-01', $markers[0]['date'], 'The shared marker should be on `2026-09-01`.' );
		$this->assertSame(
			array( '/how-to-plant-garlic/', '/storing-garlic/' ),
			array_column( $markers[0]['posts'], 'url' ),
			'The posts of one day should be listed with the most visited first.'
		);
	}

	public function test_build__names_the_2_most_visited_posts_of_a_day() {
		$markers = $this->content_markers->build(
			array(
				$this->get_row( '/storing-garlic/', 14, 30 ),
				$this->get_row( '/garlic-varieties/', 14, 12 ),
				$this->get_row( '/how-to-plant-garlic/', 14, 96 ),
			),
			'2026-08-19',
			'2026-09-15'
		);

		$this->assertSame(
			array( '/how-to-plant-garlic/', '/storing-garlic/' ),
			array_column( $markers[0]['posts'], 'url' ),
			'The marker of a day with three posts should name its 2 most visited posts, most visited first, and leave out `/garlic-varieties/`.'
		);
	}

	public function test_build__does_not_mark_the_next_post_of_the_ranking_for_a_post_a_day_leaves_out() {
		// Three of the 10 most visited posts, all published on `2026-09-01`.
		$rows = array(
			$this->get_row( '/garlic-1/', 14, 100 ),
			$this->get_row( '/garlic-2/', 14, 99 ),
			$this->get_row( '/garlic-3/', 14, 98 ),
		);

		// The other seven of the 10, one a day.
		for ( $days_ago = 0; $days_ago < 7; $days_ago++ ) {
			$rows[] = $this->get_row( "/post-$days_ago/", $days_ago, 50 );
		}

		// The 11th most visited post.
		$rows[] = $this->get_row( '/eleventh/', 20, 10 );

		$markers = $this->content_markers->build( $rows, '2026-08-19', '2026-09-15' );
		$urls    = array_merge( ...array_map( fn( $marker ) => array_column( $marker['posts'], 'url' ), $markers ) );

		$this->assertCount( 9, $urls, 'The markers should name 9 posts: the 10 most visited, less the third of `2026-09-01`.' );
		$this->assertNotContains( '/eleventh/', $urls, 'The 11th most visited post should not be marked in place of the post `2026-09-01` leaves out.' );
	}

	/**
	 * @dataProvider data_placeholder_titles
	 *
	 * @param string $title A title that names no post.
	 */
	public function test_build__gives_a_post_without_a_title_its_path_as_its_title( $title ) {
		$markers = $this->content_markers->build(
			array( $this->get_row( '/how-to-plant-garlic/', 3, 40, $title ) ),
			'2026-08-19',
			'2026-09-15'
		);

		$this->assertSame( '/how-to-plant-garlic/', $markers[0]['posts'][0]['title'], 'A post whose title is a placeholder should take its path as its title.' );
	}

	public function data_placeholder_titles() {
		return array(
			'an empty title'     => array( '' ),
			'a blank title'      => array( '  ' ),
			'`(not set)`'        => array( '(not set)' ),
			'another in-bracket' => array( '(other)' ),
		);
	}

	public function test_build__marks_nothing_without_content_rows() {
		$this->assertSame( array(), $this->content_markers->build( array(), '2026-08-19', '2026-09-15' ), 'With no content rows, there should be no markers.' );
	}
}
