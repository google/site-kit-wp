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

	public function test_score_row__scores_a_row_that_moved_with_the_site() {
		// The site went from 800 to 1000 visitors, up 25%.
		$row_scorer = new Row_Scorer( 1000, 800 );

		// The row's change is 10% of the site's visitors, and its distance from the
		// site's rate is 5% of them, so the score is
		// ( 0.6 * 10 + 0.4 * 5 ) * 1.1 * 1.25.
		$this->assertEqualsWithDelta(
			11.0,
			$row_scorer->score_row(
				'CHANNELS',
				array(
					'label'    => 'Organic Search',
					'current'  => 300,
					'previous' => 200,
				)
			),
			0.0001,
			'A channel that went from 200 to 300 visitors while the site went from 800 to 1000 should score 11.'
		);
	}

	public function test_score_row__does_not_boost_a_row_that_moved_against_the_site() {
		$row_scorer = new Row_Scorer( 1000, 800 );

		// The row's change is -5% of the site's visitors, and its distance from the
		// site's rate is 10% of them, so the score is
		// ( 0.6 * 5 + 0.4 * 10 ) * 1.1, with no boost.
		$this->assertEqualsWithDelta(
			7.7,
			$row_scorer->score_row(
				'CHANNELS',
				array(
					'label'    => 'Direct',
					'current'  => 150,
					'previous' => 200,
				)
			),
			0.0001,
			'A channel that went from 200 to 150 visitors while the site went up should score 7.7, with no boost.'
		);
	}

	public function test_score_row__scores_a_row_with_no_visitors_in_the_compare_period() {
		$row_scorer = new Row_Scorer( 1000, 800 );

		// The row had no visitors to grow from, so its change and its distance from
		// the site's rate are both 4% of the site's visitors. The score is
		// ( 0.6 * 4 + 0.4 * 4 ) * 1.3 * 1.25.
		$this->assertEqualsWithDelta(
			6.5,
			$row_scorer->score_row(
				'REFERRERS',
				array(
					'label'    => 'news.example.com',
					'current'  => 40,
					'previous' => 0,
				)
			),
			0.0001,
			'A referrer that went from 0 to 40 visitors while the site went up should score 6.5.'
		);
	}

	public function test_score_row__multiplies_the_score_by_the_weight_of_each_dimension() {
		$row_scorer = new Row_Scorer( 1000, 800 );
		$row        = array(
			'label'    => 'Example',
			'current'  => 300,
			'previous' => 200,
		);

		// The same row scores ( 0.6 * 10 + 0.4 * 5 ) * 1.25 = 10 before its
		// dimension's weight.
		$this->assertEqualsWithDelta( 15.0, $row_scorer->score_row( 'CONTENT', $row ), 0.0001, 'A `CONTENT` row should be weighted by 1.5.' );
		$this->assertEqualsWithDelta( 14.0, $row_scorer->score_row( 'SEARCH_QUERIES', $row ), 0.0001, 'A `SEARCH_QUERIES` row should be weighted by 1.4.' );
		$this->assertEqualsWithDelta( 13.0, $row_scorer->score_row( 'REFERRERS', $row ), 0.0001, 'A `REFERRERS` row should be weighted by 1.3.' );
		$this->assertEqualsWithDelta( 12.0, $row_scorer->score_row( 'CATEGORIES', $row ), 0.0001, 'A `CATEGORIES` row should be weighted by 1.2.' );
		$this->assertEqualsWithDelta( 11.0, $row_scorer->score_row( 'CHANNELS', $row ), 0.0001, 'A `CHANNELS` row should be weighted by 1.1.' );
		$this->assertEqualsWithDelta( 10.0, $row_scorer->score_row( 'DEVICES', $row ), 0.0001, 'A `DEVICES` row should be weighted by 1.0.' );
		$this->assertEqualsWithDelta( 10.0, $row_scorer->score_row( 'VISITOR_MIX', $row ), 0.0001, 'A `VISITOR_MIX` row should be weighted by 1.0.' );
	}

	public function test_score_row__boosts_a_row_that_fell_when_the_site_fell() {
		// The site went from 1000 to 800 visitors, down 20%.
		$row_scorer = new Row_Scorer( 800, 1000 );

		// The row's change is -10% of the site's visitors, and its distance from the
		// site's rate is 6% of them, so the score is
		// ( 0.6 * 10 + 0.4 * 6 ) * 1.1 * 1.25.
		$this->assertEqualsWithDelta(
			11.55,
			$row_scorer->score_row(
				'CHANNELS',
				array(
					'label'    => 'Email',
					'current'  => 100,
					'previous' => 200,
				)
			),
			0.0001,
			'A channel that went from 200 to 100 visitors while the site fell should score 11.55, with the boost.'
		);

		// The row's change is 10% of the site's visitors, and its distance from the
		// site's rate is 14% of them, so the score is
		// ( 0.6 * 10 + 0.4 * 14 ) * 1.1, with no boost.
		$this->assertEqualsWithDelta(
			12.76,
			$row_scorer->score_row(
				'CHANNELS',
				array(
					'label'    => 'Referral',
					'current'  => 300,
					'previous' => 200,
				)
			),
			0.0001,
			'A channel that went from 200 to 300 visitors while the site fell should score 12.76, with no boost.'
		);
	}

	public function test_score_row__does_not_boost_a_row_when_the_site_is_stable() {
		// The site had 1000 visitors in both periods.
		$row_scorer = new Row_Scorer( 1000, 1000 );

		// The site didn't grow, so the row's change and its distance from the site's
		// rate are both 10% of the site's visitors. The score is
		// ( 0.6 * 10 + 0.4 * 10 ) * 1.1, with no boost.
		$this->assertEqualsWithDelta(
			11.0,
			$row_scorer->score_row(
				'CHANNELS',
				array(
					'label'    => 'Organic Search',
					'current'  => 300,
					'previous' => 200,
				)
			),
			0.0001,
			'A channel that went from 200 to 300 visitors while the site stayed at 1000 should score 11, with no boost.'
		);
	}

	public function test_score_row__scores_a_row_when_the_site_had_no_visitors_in_the_compare_period() {
		// The site went from 0 to 500 visitors.
		$row_scorer = new Row_Scorer( 500, 0 );

		// The row had no visitors to grow from, so its change and its distance from
		// the site's rate are both 10% of the site's visitors. The site counts as
		// stable, so the score is ( 0.6 * 10 + 0.4 * 10 ) * 1.1, with no boost.
		$this->assertEqualsWithDelta(
			11.0,
			$row_scorer->score_row(
				'CHANNELS',
				array(
					'label'    => 'Organic Search',
					'current'  => 50,
					'previous' => 0,
				)
			),
			0.0001,
			'A channel that went from 0 to 50 visitors while the site went from 0 to 500 should score 11.'
		);
	}

	public function test_score_row__scores_0_for_a_row_with_no_visitors_when_the_site_had_none_in_either_period() {
		// Both site totals are 0, so there's nothing to take a percentage of.
		$row_scorer = new Row_Scorer( 0, 0 );

		$this->assertEqualsWithDelta(
			0.0,
			$row_scorer->score_row(
				'CHANNELS',
				array(
					'label'    => 'Organic Search',
					'current'  => 0,
					'previous' => 0,
				)
			),
			0.0001,
			'A channel with no visitors should score 0 while the site had no visitors in either period.'
		);
	}

	public function test_get_site_direction__returns_up_for_a_rise_of_3_percent() {
		$this->assertSame( 'UP', ( new Row_Scorer( 1030, 1000 ) )->get_site_direction(), 'A site that went from 1000 to 1030 visitors, up 3%, should be going `UP`.' );
	}

	public function test_get_site_direction__returns_down_for_a_fall_of_3_percent() {
		$this->assertSame( 'DOWN', ( new Row_Scorer( 970, 1000 ) )->get_site_direction(), 'A site that went from 1000 to 970 visitors, down 3%, should be going `DOWN`.' );
	}

	public function test_get_site_direction__returns_stable_for_a_change_under_3_percent() {
		$this->assertSame( 'STABLE', ( new Row_Scorer( 1029, 1000 ) )->get_site_direction(), 'A site that went from 1000 to 1029 visitors, up 2.9%, should be `STABLE`.' );
		$this->assertSame( 'STABLE', ( new Row_Scorer( 971, 1000 ) )->get_site_direction(), 'A site that went from 1000 to 971 visitors, down 2.9%, should be `STABLE`.' );
	}

	public function test_get_site_direction__returns_stable_when_the_site_had_no_visitors_in_the_compare_period() {
		$this->assertSame( 'STABLE', ( new Row_Scorer( 500, 0 ) )->get_site_direction(), 'A site that went from 0 to 500 visitors should be `STABLE`, since a change from 0 visitors has no percentage.' );
	}

	public function test_is_excluded_row__excludes_a_row_that_changed_by_fewer_than_5_visitors() {
		$row_scorer = new Row_Scorer( 1000, 800 );

		$this->assertTrue(
			$row_scorer->is_excluded_row(
				'CHANNELS',
				array(
					'label'    => 'Email',
					'current'  => 104,
					'previous' => 100,
				)
			),
			'A channel that went up by 4 visitors should be excluded.'
		);
		$this->assertFalse(
			$row_scorer->is_excluded_row(
				'CHANNELS',
				array(
					'label'    => 'Email',
					'current'  => 105,
					'previous' => 100,
				)
			),
			'A channel that went up by 5 visitors should be kept.'
		);
	}

	public function test_is_excluded_row__excludes_a_row_whose_change_is_under_0_40_percent_of_the_site() {
		// The larger of the site's two totals is 2000 visitors.
		$row_scorer = new Row_Scorer( 2000, 1600 );

		$this->assertTrue(
			$row_scorer->is_excluded_row(
				'CHANNELS',
				array(
					'label'    => 'Email',
					'current'  => 107,
					'previous' => 100,
				)
			),
			'A channel that went up by 7 visitors, 0.35% of the site, should be excluded.'
		);
		$this->assertFalse(
			$row_scorer->is_excluded_row(
				'CHANNELS',
				array(
					'label'    => 'Email',
					'current'  => 108,
					'previous' => 100,
				)
			),
			'A channel that went up by 8 visitors, 0.40% of the site, should be kept.'
		);
	}

	public function test_is_excluded_row__excludes_a_row_with_a_small_change_against_the_site() {
		// The site went from 800 to 1000 visitors, up 25%.
		$row_scorer = new Row_Scorer( 1000, 800 );

		$this->assertTrue(
			$row_scorer->is_excluded_row(
				'CHANNELS',
				array(
					'label'    => 'Direct',
					'current'  => 91,
					'previous' => 100,
				)
			),
			'A channel that lost 9 visitors, 0.9% of the site and 9% of its own, should be excluded while the site went up.'
		);
		$this->assertFalse(
			$row_scorer->is_excluded_row(
				'CHANNELS',
				array(
					'label'    => 'Direct',
					'current'  => 90,
					'previous' => 100,
				)
			),
			'A channel that lost 10 visitors, 1% of the site, should be kept while the site went up.'
		);
		$this->assertFalse(
			$row_scorer->is_excluded_row(
				'CHANNELS',
				array(
					'label'    => 'Direct',
					'current'  => 109,
					'previous' => 100,
				)
			),
			'A channel that went up by 9 visitors should be kept while the site went up, since it moved with the site.'
		);
	}

	public function test_is_excluded_row__excludes_a_row_with_a_small_gain_when_the_site_lost_visitors() {
		// The site went from 1000 to 800 visitors, down 20%.
		$row_scorer = new Row_Scorer( 800, 1000 );

		$this->assertTrue(
			$row_scorer->is_excluded_row(
				'CHANNELS',
				array(
					'label'    => 'Direct',
					'current'  => 109,
					'previous' => 100,
				)
			),
			'A channel that went up by 9 visitors, 0.9% of the site and 9% of its own, should be excluded while the site went down.'
		);
		$this->assertFalse(
			$row_scorer->is_excluded_row(
				'CHANNELS',
				array(
					'label'    => 'Direct',
					'current'  => 110,
					'previous' => 100,
				)
			),
			'A channel that went up by 10 visitors, 1% of the site, should be kept while the site went down.'
		);
		$this->assertFalse(
			$row_scorer->is_excluded_row(
				'CHANNELS',
				array(
					'label'    => 'Direct',
					'current'  => 91,
					'previous' => 100,
				)
			),
			'A channel that lost 9 visitors should be kept while the site went down, since it moved with the site.'
		);
	}

	public function test_is_excluded_row__keeps_a_row_against_the_site_that_changed_by_10_percent_and_25_visitors() {
		// The larger of the site's two totals is 4000 visitors, so a change of 25
		// visitors is 0.625% of the site, under the 1% that keeps a row on its own.
		$row_scorer = new Row_Scorer( 4000, 3200 );

		$this->assertFalse(
			$row_scorer->is_excluded_row(
				'CHANNELS',
				array(
					'label'    => 'Direct',
					'current'  => 225,
					'previous' => 250,
				)
			),
			'A channel that lost 25 visitors, 10% of its own, should be kept while the site went up.'
		);
		$this->assertTrue(
			$row_scorer->is_excluded_row(
				'CHANNELS',
				array(
					'label'    => 'Direct',
					'current'  => 80,
					'previous' => 100,
				)
			),
			'A channel that lost 20% of its own visitors, but only 20 visitors, should be excluded while the site went up.'
		);
		$this->assertTrue(
			$row_scorer->is_excluded_row(
				'CHANNELS',
				array(
					'label'    => 'Direct',
					'current'  => 474,
					'previous' => 500,
				)
			),
			'A channel that lost 26 visitors, but only 5.2% of its own, should be excluded while the site went up.'
		);
	}

	public function test_is_excluded_row__keeps_a_row_against_the_site_that_went_from_0_to_30_visitors() {
		// The larger of the site's two totals is 4000 visitors, so a change of 30
		// visitors is 0.75% of the site, under the 1% that keeps a row on its own.
		$row_scorer = new Row_Scorer( 3200, 4000 );

		$this->assertFalse(
			$row_scorer->is_excluded_row(
				'CHANNELS',
				array(
					'label'    => 'Referral',
					'current'  => 30,
					'previous' => 0,
				)
			),
			'A channel that went from 0 to 30 visitors should be kept while the site went down, since a channel with no visitors in the compare period counts as up 100%.'
		);
	}

	public function test_is_excluded_row__excludes_a_device_row_with_no_visitors_in_the_compare_period_when_the_site_doubled() {
		$row = array(
			'label'    => 'tablet',
			'current'  => 50,
			'previous' => 0,
		);

		$this->assertTrue( ( new Row_Scorer( 2000, 1000 ) )->is_excluded_row( 'DEVICES', $row ), 'A device category that went from 0 to 50 visitors should be excluded while the site went up 100%, since the device category counts as up 100% too.' );
		$this->assertFalse( ( new Row_Scorer( 1950, 1000 ) )->is_excluded_row( 'DEVICES', $row ), 'A device category that went from 0 to 50 visitors should be kept while the site went up 95%.' );
		$this->assertFalse( ( new Row_Scorer( 2050, 1000 ) )->is_excluded_row( 'DEVICES', $row ), 'A device category that went from 0 to 50 visitors should be kept while the site went up 105%.' );
	}

	public function test_is_excluded_row__keeps_a_row_with_a_small_loss_when_the_site_is_stable() {
		$row_scorer = new Row_Scorer( 1000, 1000 );

		$this->assertFalse(
			$row_scorer->is_excluded_row(
				'CHANNELS',
				array(
					'label'    => 'Direct',
					'current'  => 91,
					'previous' => 100,
				)
			),
			'A channel that lost 9 visitors should be kept while the site stayed at 1000, since a stable site has no direction to move against.'
		);
	}

	public function test_is_excluded_row__excludes_a_device_or_visitor_mix_row_that_only_follows_the_site() {
		// The site went from 800 to 1000 visitors, up 25%.
		$row_scorer = new Row_Scorer( 1000, 800 );

		$this->assertTrue(
			$row_scorer->is_excluded_row(
				'DEVICES',
				array(
					'label'    => 'mobile',
					'current'  => 128,
					'previous' => 100,
				)
			),
			'A device category that went up 28% should be excluded while the site went up 25%.'
		);
		$this->assertTrue(
			$row_scorer->is_excluded_row(
				'VISITOR_MIX',
				array(
					'label'    => 'returning',
					'current'  => 128,
					'previous' => 100,
				)
			),
			'Returning visitors that went up 28% should be excluded while the site went up 25%.'
		);
		$this->assertFalse(
			$row_scorer->is_excluded_row(
				'DEVICES',
				array(
					'label'    => 'mobile',
					'current'  => 130,
					'previous' => 100,
				)
			),
			'A device category that went up 30% should be kept while the site went up 25%.'
		);
		$this->assertFalse(
			$row_scorer->is_excluded_row(
				'DEVICES',
				array(
					'label'    => 'mobile',
					'current'  => 110,
					'previous' => 100,
				)
			),
			'A device category that went up 10% should be kept while the site went up 25%.'
		);
	}

	public function test_is_excluded_row__keeps_a_channel_row_that_only_follows_the_site() {
		$row_scorer = new Row_Scorer( 1000, 800 );

		$this->assertFalse(
			$row_scorer->is_excluded_row(
				'CHANNELS',
				array(
					'label'    => 'Organic Search',
					'current'  => 128,
					'previous' => 100,
				)
			),
			"A channel that went up 28% should be kept while the site went up 25%, because channels aren't compared with the site."
		);
	}

	public function test_is_excluded_row__keeps_rows_that_appeared_when_the_site_had_no_visitors_in_the_compare_period() {
		$row_scorer = new Row_Scorer( 500, 0 );

		$this->assertFalse(
			$row_scorer->is_excluded_row(
				'CHANNELS',
				array(
					'label'    => 'Organic Search',
					'current'  => 50,
					'previous' => 0,
				)
			),
			'A channel that went from 0 to 50 visitors should be kept while the site went from 0 to 500.'
		);
		$this->assertFalse(
			$row_scorer->is_excluded_row(
				'DEVICES',
				array(
					'label'    => 'mobile',
					'current'  => 50,
					'previous' => 0,
				)
			),
			'A device category that went from 0 to 50 visitors should be kept while the site went from 0 to 500.'
		);
	}

	public function test_is_excluded_row__excludes_a_row_with_no_visitors_when_the_site_had_none_in_either_period() {
		// Both site totals are 0, so there's nothing to take a percentage of.
		$row_scorer = new Row_Scorer( 0, 0 );

		$this->assertTrue(
			$row_scorer->is_excluded_row(
				'CHANNELS',
				array(
					'label'    => 'Organic Search',
					'current'  => 0,
					'previous' => 0,
				)
			),
			'A channel with no visitors should be excluded while the site had no visitors in either period.'
		);
	}
}
