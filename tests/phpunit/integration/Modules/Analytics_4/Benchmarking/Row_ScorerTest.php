<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking\Row_ScorerTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking;

use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Row_Scorer;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Analytics_4
 */
class Row_ScorerTest extends TestCase {

	public function test_score_row__boosts_a_row_that_moved_with_the_site() {
		// The site went from 800 to 1000 visits, up 25%.
		$row_scorer = new Row_Scorer( 1000, 800 );

		// The row's change is 10% of the site's visits, and its distance from the
		// site's rate is 5% of them, so the score is
		// ( 0.6 * 10 + 0.4 * 5 ) * 1.1 * 1.25.
		$this->assertEqualsWithDelta(
			11.0,
			$row_scorer->score_row(
				'CHANNEL',
				array(
					'label'    => 'Organic Search',
					'current'  => 300,
					'previous' => 200,
				)
			),
			0.0001,
			'A channel that went from 200 to 300 visits while the site went from 800 to 1000 should score 11.'
		);
	}

	public function test_score_row__does_not_boost_a_row_that_moved_against_the_site() {
		$row_scorer = new Row_Scorer( 1000, 800 );

		// The row's change is -5% of the site's visits, and its distance from the
		// site's rate is 10% of them, so the score is
		// ( 0.6 * 5 + 0.4 * 10 ) * 1.1, with no boost.
		$this->assertEqualsWithDelta(
			7.7,
			$row_scorer->score_row(
				'CHANNEL',
				array(
					'label'    => 'Direct',
					'current'  => 150,
					'previous' => 200,
				)
			),
			0.0001,
			'A channel that went from 200 to 150 visits while the site went up should score 7.7, with no boost.'
		);
	}

	public function test_score_row__scores_a_row_with_no_visits_in_the_compare_period() {
		$row_scorer = new Row_Scorer( 1000, 800 );

		// The row had no visits to grow from, so its change and its distance from
		// the site's rate are both 4% of the site's visits. The score is
		// ( 0.6 * 4 + 0.4 * 4 ) * 1.3 * 1.25.
		$this->assertEqualsWithDelta(
			6.5,
			$row_scorer->score_row(
				'REFERRING_SITE',
				array(
					'label'    => 'news.example.com',
					'current'  => 40,
					'previous' => 0,
				)
			),
			0.0001,
			'A referring site that went from 0 to 40 visits while the site went up should score 6.5.'
		);
	}

	public function test_score_row__multiplies_the_score_by_the_weight_of_each_kind() {
		$row_scorer = new Row_Scorer( 1000, 800 );
		$row        = array(
			'label'    => 'Example',
			'current'  => 300,
			'previous' => 200,
		);

		// `$row` scores ( 0.6 * 10 + 0.4 * 5 ) * 1.25 = 10 before the weight.
		$this->assertEqualsWithDelta( 15.0, $row_scorer->score_row( 'CONTENT', $row ), 0.0001, 'A `CONTENT` candidate should be weighted by 1.5.' );
		$this->assertEqualsWithDelta( 14.0, $row_scorer->score_row( 'SEARCH_KEYWORD', $row ), 0.0001, 'A `SEARCH_KEYWORD` candidate should be weighted by 1.4.' );
		$this->assertEqualsWithDelta( 13.0, $row_scorer->score_row( 'REFERRING_SITE', $row ), 0.0001, 'A `REFERRING_SITE` candidate should be weighted by 1.3.' );
		$this->assertEqualsWithDelta( 12.0, $row_scorer->score_row( 'CAMPAIGN', $row ), 0.0001, 'A `CAMPAIGN` candidate should be weighted by 1.2.' );
		$this->assertEqualsWithDelta( 11.0, $row_scorer->score_row( 'CHANNEL', $row ), 0.0001, 'A `CHANNEL` candidate should be weighted by 1.1.' );
	}

	public function test_score_row__boosts_a_row_that_fell_when_the_site_fell() {
		// The site went from 1000 to 800 visits, down 20%.
		$row_scorer = new Row_Scorer( 800, 1000 );

		// The row's change is -10% of 1000 visits, and its distance from the site's
		// rate is 6% of them, so the score is ( 0.6 * 10 + 0.4 * 6 ) * 1.1 * 1.25.
		$this->assertEqualsWithDelta(
			11.55,
			$row_scorer->score_row(
				'CHANNEL',
				array(
					'label'    => 'Email',
					'current'  => 100,
					'previous' => 200,
				)
			),
			0.0001,
			'A channel that went from 200 to 100 visits while the site fell should score 11.55, with the boost.'
		);

		// The row's change is 10% of 1000 visits, and its distance from the
		// site's rate is 14% of them, so the score is
		// ( 0.6 * 10 + 0.4 * 14 ) * 1.1, with no boost.
		$this->assertEqualsWithDelta(
			12.76,
			$row_scorer->score_row(
				'CHANNEL',
				array(
					'label'    => 'Referral',
					'current'  => 300,
					'previous' => 200,
				)
			),
			0.0001,
			'A channel that went from 200 to 300 visits while the site fell should score 12.76, with no boost.'
		);
	}

	public function test_score_row__does_not_boost_a_row_when_the_site_is_stable() {
		$row_scorer = new Row_Scorer( 1000, 1000 );

		// The site didn't grow, so the row's change and its distance from the site's
		// rate are both 10% of the site's visits. The score is
		// ( 0.6 * 10 + 0.4 * 10 ) * 1.1, with no boost.
		$this->assertEqualsWithDelta(
			11.0,
			$row_scorer->score_row(
				'CHANNEL',
				array(
					'label'    => 'Organic Search',
					'current'  => 300,
					'previous' => 200,
				)
			),
			0.0001,
			'A channel that went from 200 to 300 visits while the site stayed at 1000 should score 11, with no boost.'
		);
	}

	public function test_score_row__scores_a_row_when_the_site_had_no_visits_in_the_compare_period() {
		$row_scorer = new Row_Scorer( 500, 0 );

		// The row had no visits to grow from, so its change and its distance from
		// the site's rate are both 10% of the site's visits. The site counts as
		// stable, so the score is ( 0.6 * 10 + 0.4 * 10 ) * 1.1, with no boost.
		$this->assertEqualsWithDelta(
			11.0,
			$row_scorer->score_row(
				'CHANNEL',
				array(
					'label'    => 'Organic Search',
					'current'  => 50,
					'previous' => 0,
				)
			),
			0.0001,
			'A channel that went from 0 to 50 visits while the site went from 0 to 500 should score 11.'
		);
	}

	public function test_score_row__scores_0_for_a_row_with_no_visits_when_the_site_had_none_in_either_period() {
		$row_scorer = new Row_Scorer( 0, 0 );

		$this->assertEqualsWithDelta(
			0.0,
			$row_scorer->score_row(
				'CHANNEL',
				array(
					'label'    => 'Organic Search',
					'current'  => 0,
					'previous' => 0,
				)
			),
			0.0001,
			'A channel with no visits should score 0 while the site had no visits in either period.'
		);
	}

	public function test_get_site_direction__returns_up_for_a_rise_of_3_percent() {
		$this->assertSame( 'UP', ( new Row_Scorer( 1030, 1000 ) )->get_site_direction(), 'A site that went from 1000 to 1030 visits, up 3%, should be going `UP`.' );
	}

	public function test_get_site_direction__returns_down_for_a_fall_of_3_percent() {
		$this->assertSame( 'DOWN', ( new Row_Scorer( 970, 1000 ) )->get_site_direction(), 'A site that went from 1000 to 970 visits, down 3%, should be going `DOWN`.' );
	}

	public function test_get_site_direction__returns_stable_for_a_change_under_3_percent() {
		$this->assertSame( 'STABLE', ( new Row_Scorer( 1029, 1000 ) )->get_site_direction(), 'A site that went from 1000 to 1029 visits, up 2.9%, should be `STABLE`.' );
		$this->assertSame( 'STABLE', ( new Row_Scorer( 971, 1000 ) )->get_site_direction(), 'A site that went from 1000 to 971 visits, down 2.9%, should be `STABLE`.' );
	}

	public function test_get_site_direction__returns_stable_when_the_site_had_no_visits_in_the_compare_period() {
		$this->assertSame( 'STABLE', ( new Row_Scorer( 500, 0 ) )->get_site_direction(), 'A site that went from 0 to 500 visits should be `STABLE`, since a change from 0 visits has no percentage.' );
	}

	public function test_is_excluded_row__excludes_a_row_that_changed_by_fewer_than_5_visits() {
		$row_scorer = new Row_Scorer( 1000, 800 );

		$this->assertTrue(
			$row_scorer->is_excluded_row(
				array(
					'label'    => 'Email',
					'current'  => 104,
					'previous' => 100,
				)
			),
			'A channel that went up by 4 visits should be excluded.'
		);
		$this->assertFalse(
			$row_scorer->is_excluded_row(
				array(
					'label'    => 'Email',
					'current'  => 105,
					'previous' => 100,
				)
			),
			'A channel that went up by 5 visits should be kept.'
		);
	}

	public function test_is_excluded_row__excludes_a_row_whose_change_is_under_0_40_percent_of_the_site() {
		// The larger of the site's two totals is 2000 visits.
		$row_scorer = new Row_Scorer( 2000, 1600 );

		$this->assertTrue(
			$row_scorer->is_excluded_row(
				array(
					'label'    => 'Email',
					'current'  => 107,
					'previous' => 100,
				)
			),
			'A channel that went up by 7 visits, 0.35% of the site, should be excluded.'
		);
		$this->assertFalse(
			$row_scorer->is_excluded_row(
				array(
					'label'    => 'Email',
					'current'  => 108,
					'previous' => 100,
				)
			),
			'A channel that went up by 8 visits, 0.40% of the site, should be kept.'
		);
	}

	public function test_is_excluded_row__excludes_a_row_that_lost_under_1_percent_of_the_site_when_the_site_went_up() {
		$row_scorer = new Row_Scorer( 1000, 800 );

		$this->assertTrue(
			$row_scorer->is_excluded_row(
				array(
					'label'    => 'Direct',
					'current'  => 91,
					'previous' => 100,
				)
			),
			'A channel that lost 9 visits, 0.9% of the site and 9% of its own, should be excluded while the site went up.'
		);
		$this->assertFalse(
			$row_scorer->is_excluded_row(
				array(
					'label'    => 'Direct',
					'current'  => 90,
					'previous' => 100,
				)
			),
			'A channel that lost 10 visits, 1% of the site, should be kept while the site went up.'
		);
		$this->assertFalse(
			$row_scorer->is_excluded_row(
				array(
					'label'    => 'Direct',
					'current'  => 109,
					'previous' => 100,
				)
			),
			'A channel that went up by 9 visits should be kept while the site went up, since it moved with the site.'
		);
	}

	public function test_is_excluded_row__excludes_a_row_that_went_up_by_under_1_percent_of_the_site_when_the_site_went_down() {
		$row_scorer = new Row_Scorer( 800, 1000 );

		$this->assertTrue(
			$row_scorer->is_excluded_row(
				array(
					'label'    => 'Direct',
					'current'  => 109,
					'previous' => 100,
				)
			),
			"A channel that went up by 9 visits, 0.9% of the larger of the site's two totals and 9% of its own, should be excluded while the site went down."
		);
		$this->assertFalse(
			$row_scorer->is_excluded_row(
				array(
					'label'    => 'Direct',
					'current'  => 110,
					'previous' => 100,
				)
			),
			"A channel that went up by 10 visits, 1% of the larger of the site's two totals, should be kept while the site went down."
		);
		$this->assertFalse(
			$row_scorer->is_excluded_row(
				array(
					'label'    => 'Direct',
					'current'  => 91,
					'previous' => 100,
				)
			),
			'A channel that lost 9 visits should be kept while the site went down, since it moved with the site.'
		);
	}

	public function test_is_excluded_row__keeps_a_row_that_lost_25_visits_and_10_percent_of_its_own_when_the_site_went_up() {
		// `COUNTER_TREND_TRAFFIC_IMPACT_PERCENT` doesn't keep a row that changed by
		// fewer than 40 visits, 1% of 4000.
		$row_scorer = new Row_Scorer( 4000, 3200 );

		$this->assertFalse(
			$row_scorer->is_excluded_row(
				array(
					'label'    => 'Direct',
					'current'  => 225,
					'previous' => 250,
				)
			),
			'A channel that lost 25 visits, 10% of its own, should be kept while the site went up.'
		);
		$this->assertTrue(
			$row_scorer->is_excluded_row(
				array(
					'label'    => 'Direct',
					'current'  => 176,
					'previous' => 200,
				)
			),
			'A channel that lost 12% of its own visits, but only 24 visits, should be excluded while the site went up.'
		);
		$this->assertTrue(
			$row_scorer->is_excluded_row(
				array(
					'label'    => 'Direct',
					'current'  => 273,
					'previous' => 300,
				)
			),
			'A channel that lost 27 visits, but only 9% of its own, should be excluded while the site went up.'
		);
	}

	public function test_is_excluded_row__keeps_a_row_that_went_from_0_to_30_visits_when_the_site_went_down() {
		// `COUNTER_TREND_TRAFFIC_IMPACT_PERCENT` doesn't keep a row that changed by
		// 30 visits, 0.75% of 4000.
		$row_scorer = new Row_Scorer( 3200, 4000 );

		$this->assertFalse(
			$row_scorer->is_excluded_row(
				array(
					'label'    => 'Referral',
					'current'  => 30,
					'previous' => 0,
				)
			),
			'A channel that went from 0 to 30 visits should be kept while the site went down, since a channel with no visits in the compare period counts as up 100%.'
		);
	}

	public function test_is_excluded_row__keeps_a_row_that_changed_by_under_1_percent_of_the_site_when_the_site_is_stable() {
		$row_scorer = new Row_Scorer( 1000, 1000 );

		$this->assertFalse(
			$row_scorer->is_excluded_row(
				array(
					'label'    => 'Direct',
					'current'  => 91,
					'previous' => 100,
				)
			),
			'A channel that lost 9 visits should be kept while the site stayed at 1000, since a stable site has no direction to move against.'
		);
		$this->assertFalse(
			$row_scorer->is_excluded_row(
				array(
					'label'    => 'Direct',
					'current'  => 109,
					'previous' => 100,
				)
			),
			'A channel that went up by 9 visits should be kept while the site stayed at 1000, since a stable site has no direction to move against.'
		);
	}

	public function test_is_excluded_row__keeps_a_row_that_appeared_when_the_site_had_no_visits_in_the_compare_period() {
		$row_scorer = new Row_Scorer( 500, 0 );

		$this->assertFalse(
			$row_scorer->is_excluded_row(
				array(
					'label'    => 'Organic Search',
					'current'  => 50,
					'previous' => 0,
				)
			),
			'A channel that went from 0 to 50 visits should be kept while the site went from 0 to 500.'
		);
	}

	public function test_is_excluded_row__excludes_a_row_with_no_visits_when_the_site_had_none_in_either_period() {
		$row_scorer = new Row_Scorer( 0, 0 );

		$this->assertTrue(
			$row_scorer->is_excluded_row(
				array(
					'label'    => 'Organic Search',
					'current'  => 0,
					'previous' => 0,
				)
			),
			'A channel with no visits should be excluded while the site had no visits in either period.'
		);
	}

	public function test_get_self_change_percent__returns_the_change_of_a_row_in_percent() {
		$this->assertSame(
			-25,
			Row_Scorer::get_self_change_percent(
				array(
					'current'  => 150,
					'previous' => 200,
				)
			),
			'A row that went from 200 to 150 visits should have changed by -25%.'
		);
	}

	public function test_get_self_change_percent__returns_100_for_a_row_with_no_visits_in_the_compare_period() {
		$this->assertSame(
			100,
			Row_Scorer::get_self_change_percent(
				array(
					'current'  => 40,
					'previous' => 0,
				)
			),
			'A row that went from 0 to 40 visits should count as up 100%.'
		);
	}
}
