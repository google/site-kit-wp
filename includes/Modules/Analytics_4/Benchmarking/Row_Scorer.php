<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Benchmarking\Row_Scorer
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Benchmarking;

/**
 * Scores a candidate driver of a key factor card by how much of the site's
 * change in visits it explains.
 *
 * One formula scores every candidate of every kind, so a channel, a page, and a
 * search keyword are ranked on the same scale.
 *
 * @since 1.190.0
 * @since n.e.x.t Scores the candidate drivers of the key factor cards in place of the rows of each dimension.
 * @access private
 * @ignore
 */
class Row_Scorer {

	/**
	 * What the score of each kind of driver is multiplied by, so a specific
	 * driver, such as a page, scores higher than a channel with the same change.
	 *
	 * @since n.e.x.t
	 */
	const KIND_WEIGHTS = array(
		'CONTENT'        => 1.5,
		'SEARCH_KEYWORD' => 1.4,
		'REFERRING_SITE' => 1.3,
		'CAMPAIGN'       => 1.2,
		'CHANNEL'        => 1.1,
	);

	/**
	 * A candidate's score is multiplied by this number when its visits moved the
	 * same way as the site's, and the site went up or down by at least
	 * `SITE_DIRECTION_THRESHOLD_PERCENT`.
	 *
	 * @since 1.190.0
	 */
	const SAME_DIRECTION_BOOST = 1.25;

	/**
	 * The smallest change in the site's visits, in percent, that counts as going
	 * up or down.
	 *
	 * @since 1.190.0
	 */
	const SITE_DIRECTION_THRESHOLD_PERCENT = 3;

	/**
	 * The smallest change in visits a candidate needs to stay a candidate.
	 *
	 * @since 1.190.0
	 */
	const MINIMUM_ABSOLUTE_DELTA = 5;

	/**
	 * The smallest change a candidate needs to stay a candidate, as a percentage
	 * of the larger of the site's two visit totals.
	 *
	 * @since 1.190.0
	 */
	const MINIMUM_TRAFFIC_IMPACT_PERCENT = 0.40;

	/**
	 * A candidate that moved against the site stays a candidate when its change
	 * is at least this percentage of the larger of the site's two visit totals.
	 *
	 * @since 1.190.0
	 */
	const COUNTER_TREND_TRAFFIC_IMPACT_PERCENT = 1.0;

	/**
	 * A candidate that moved against the site also stays a candidate when its own
	 * visits changed by at least this percentage and by `COUNTER_TREND_DELTA`
	 * visits.
	 *
	 * @since 1.190.0
	 */
	const COUNTER_TREND_SELF_CHANGE_PERCENT = 10;

	/**
	 * The smallest change in visits that, together with
	 * `COUNTER_TREND_SELF_CHANGE_PERCENT`, keeps a candidate that moved against
	 * the site.
	 *
	 * @since 1.190.0
	 */
	const COUNTER_TREND_DELTA = 25;

	/**
	 * The site's direction when its visits went up by `SITE_DIRECTION_THRESHOLD_PERCENT` or more.
	 *
	 * @since 1.190.0
	 */
	const DIRECTION_UP = 'UP';

	/**
	 * The site's direction when its visits went down by `SITE_DIRECTION_THRESHOLD_PERCENT` or more.
	 *
	 * @since 1.190.0
	 */
	const DIRECTION_DOWN = 'DOWN';

	/**
	 * The site's direction when its visits changed by less than `SITE_DIRECTION_THRESHOLD_PERCENT`.
	 *
	 * @since 1.190.0
	 */
	const DIRECTION_STABLE = 'STABLE';

	/**
	 * The site's visits in the selected period.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $visits_current;

	/**
	 * The site's visits in the compare period.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $visits_previous;

	/**
	 * Constructor.
	 *
	 * @since 1.190.0
	 * @since n.e.x.t Takes the site's visits in place of its visitors.
	 *
	 * @param int $visits_current  The site's visits in the selected period.
	 * @param int $visits_previous The site's visits in the compare period.
	 */
	public function __construct( $visits_current, $visits_previous ) {
		$this->visits_current  = $visits_current;
		$this->visits_previous = $visits_previous;
	}

	/**
	 * Scores how much of the site's change in visits a candidate explains.
	 *
	 * The size of the candidate's change counts for 60% of the score. The other
	 * 40% is how far that change is from the change the candidate would show if
	 * it changed by the same percentage as the site. The weight of the
	 * candidate's kind multiplies the sum, and so does the boost when the
	 * candidate moved the same way as the site.
	 *
	 * @since 1.190.0
	 * @since n.e.x.t Takes the kind of the candidate in place of a dimension code.
	 *
	 * @param string $kind The kind of the candidate, such as `CHANNEL`.
	 * @param array  $row  The candidate, with its `current` and `previous` visits, or clicks for a search keyword.
	 * @return float The candidate's score. A higher score explains more of the site's change.
	 */
	public function score_row( $kind, array $row ) {
		$delta          = $row['current'] - $row['previous'];
		$expected_delta = $row['previous'] * $this->get_site_change_percent() / 100;
		$site_direction = $this->get_site_direction();

		$moves_with_site = ( self::DIRECTION_UP === $site_direction && $delta > 0 )
			|| ( self::DIRECTION_DOWN === $site_direction && $delta < 0 );

		$traffic_impact = $this->get_traffic_impact_percent( $delta );
		$excess_impact  = $this->get_traffic_impact_percent( $delta - $expected_delta );
		$boost          = $moves_with_site ? self::SAME_DIRECTION_BOOST : 1;

		return ( 0.6 * abs( $traffic_impact ) + 0.4 * abs( $excess_impact ) ) * self::KIND_WEIGHTS[ $kind ] * $boost;
	}

	/**
	 * Checks whether a candidate is dropped.
	 *
	 * A candidate is dropped when either of these is true:
	 * - Its change is under `MINIMUM_ABSOLUTE_DELTA` visits or under
	 *   `MINIMUM_TRAFFIC_IMPACT_PERCENT`.
	 * - It moved against the site, and neither `COUNTER_TREND_TRAFFIC_IMPACT_PERCENT`
	 *   nor `COUNTER_TREND_SELF_CHANGE_PERCENT` together with `COUNTER_TREND_DELTA` keeps it.
	 *
	 * @since 1.190.0
	 * @since n.e.x.t Takes the candidate alone. A device or a visitor type is never a candidate, so no rule is left for it.
	 *
	 * @param array $row The candidate, with its `current` and `previous` visits, or clicks for a search keyword.
	 * @return bool True when the candidate is dropped, false when it stays a candidate.
	 */
	public function is_excluded_row( array $row ) {
		$delta          = $row['current'] - $row['previous'];
		$traffic_impact = abs( $this->get_traffic_impact_percent( $delta ) );

		if ( abs( $delta ) < self::MINIMUM_ABSOLUTE_DELTA || $traffic_impact < self::MINIMUM_TRAFFIC_IMPACT_PERCENT ) {
			return true;
		}

		$self_change    = self::get_self_change_percent( $row );
		$site_direction = $this->get_site_direction();

		$moves_against_site = ( self::DIRECTION_UP === $site_direction && $delta < 0 )
			|| ( self::DIRECTION_DOWN === $site_direction && $delta > 0 );

		$is_large_change = $traffic_impact >= self::COUNTER_TREND_TRAFFIC_IMPACT_PERCENT
			|| ( abs( $self_change ) >= self::COUNTER_TREND_SELF_CHANGE_PERCENT && abs( $delta ) >= self::COUNTER_TREND_DELTA );

		return $moves_against_site && ! $is_large_change;
	}

	/**
	 * Gets the direction the site's visits moved in, from the compare period
	 * to the selected period.
	 *
	 * @since 1.190.0
	 *
	 * @return string The direction, `UP`, `DOWN`, or `STABLE`.
	 */
	public function get_site_direction() {
		$site_change = $this->get_site_change_percent();

		if ( $site_change >= self::SITE_DIRECTION_THRESHOLD_PERCENT ) {
			return self::DIRECTION_UP;
		}

		if ( $site_change <= -self::SITE_DIRECTION_THRESHOLD_PERCENT ) {
			return self::DIRECTION_DOWN;
		}

		return self::DIRECTION_STABLE;
	}

	/**
	 * Gets a change in visits as a percentage of the larger of the site's two
	 * totals.
	 *
	 * @since 1.190.0
	 *
	 * @param int|float $change The change in visits.
	 * @return int|float The change as a percentage, such as `10` for 10%, or `0` when the site had no visits in either period.
	 */
	private function get_traffic_impact_percent( $change ) {
		$site_visits = max( $this->visits_current, $this->visits_previous );

		return $site_visits > 0 ? $change * 100 / $site_visits : 0;
	}

	/**
	 * Gets the change in a row's own visits, in percent.
	 *
	 * @since 1.190.0
	 * @since n.e.x.t Made public, so a key factor card can compare its attributes' changes with its own.
	 *
	 * @param array $row The row, with its `current` and `previous` visits.
	 * @return int|float The change in percent, such as `50` for a rise of 50%, or `100` for a row with no visits in the compare period.
	 */
	public static function get_self_change_percent( array $row ) {
		if ( $row['previous'] > 0 ) {
			return ( $row['current'] - $row['previous'] ) * 100 / $row['previous'];
		}

		return 100;
	}

	/**
	 * Gets the change in the site's visits, in percent.
	 *
	 * @since 1.190.0
	 *
	 * @return int|float The change in percent, such as `25` for a rise of 25%, or `0` when the site had no visits in the compare period.
	 */
	private function get_site_change_percent() {
		if ( $this->visits_previous > 0 ) {
			return ( $this->visits_current - $this->visits_previous ) * 100 / $this->visits_previous;
		}

		return 0;
	}
}
