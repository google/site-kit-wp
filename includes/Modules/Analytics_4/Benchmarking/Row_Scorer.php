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
 * Scores a dimension row by how much of the site's change in visitors it explains.
 *
 * One formula scores every row in every dimension, so a channel, a device, and a
 * search query are ranked on the same scale.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Row_Scorer {

	/**
	 * What each dimension's scores are multiplied by, so a page or a referrer
	 * counts for more than a device category.
	 */
	const DIMENSION_WEIGHTS = array(
		'CONTENT'        => 1.5,
		'SEARCH_QUERIES' => 1.4,
		'REFERRERS'      => 1.3,
		'CATEGORIES'     => 1.2,
		'CHANNELS'       => 1.1,
		'DEVICES'        => 1.0,
		'VISITOR_MIX'    => 1.0,
	);

	/**
	 * A row's score is multiplied by this number when the row's visitors and the
	 * site's visitors both went up, or both went down.
	 */
	const SAME_DIRECTION_BOOST = 1.25;

	/**
	 * The smallest change in the site's visitors, in percent, that counts as going
	 * up or down.
	 */
	const SITE_DIRECTION_THRESHOLD_PERCENT = 3;

	/**
	 * The smallest change in visitors a row needs to stay in the response.
	 */
	const MINIMUM_ABSOLUTE_DELTA = 5;

	/**
	 * The smallest change a row needs to stay in the response, as a percentage of
	 * the larger of the site's two visitor totals.
	 */
	const MINIMUM_TRAFFIC_IMPACT_PERCENT = 0.40;

	/**
	 * A row that moved against the site stays in the response when its change is
	 * at least this percentage of the larger of the site's two visitor totals.
	 */
	const COUNTER_TREND_TRAFFIC_IMPACT_PERCENT = 1.0;

	/**
	 * A row that moved against the site also stays in the response when its own
	 * visitors changed by at least this percentage and `COUNTER_TREND_DELTA`
	 * visitors.
	 */
	const COUNTER_TREND_SELF_CHANGE_PERCENT = 10;

	/**
	 * The smallest change in visitors that, together with
	 * `COUNTER_TREND_SELF_CHANGE_PERCENT`, keeps a row that moved against the site.
	 */
	const COUNTER_TREND_DELTA = 25;

	/**
	 * A device or visitor mix row is excluded when its own change is less than this
	 * many percentage points from the site's change, because it only follows the site.
	 */
	const MACRO_DIVERGENCE_PERCENT = 5;

	/**
	 * The site's direction when its visitors went up by `SITE_DIRECTION_THRESHOLD_PERCENT` or more.
	 */
	const DIRECTION_UP = 'UP';

	/**
	 * The site's direction when its visitors went down by `SITE_DIRECTION_THRESHOLD_PERCENT` or more.
	 */
	const DIRECTION_DOWN = 'DOWN';

	/**
	 * The site's direction when its visitors changed by less than `SITE_DIRECTION_THRESHOLD_PERCENT`.
	 */
	const DIRECTION_STABLE = 'STABLE';

	/**
	 * The site's visitors in the selected period.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $visitors_current;

	/**
	 * The site's visitors in the compare period.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $visitors_previous;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $visitors_current  The site's visitors in the selected period.
	 * @param int $visitors_previous The site's visitors in the compare period.
	 */
	public function __construct( $visitors_current, $visitors_previous ) {
		$this->visitors_current  = $visitors_current;
		$this->visitors_previous = $visitors_previous;
	}

	/**
	 * Scores how much of the site's change in visitors a row explains.
	 *
	 * The size of the row's change counts for 60% of the score. The other 40% is
	 * how far that change is from the change the row would show if it changed by
	 * the same percentage as the site. The dimension's weight multiplies the sum,
	 * and so does the boost when the row moved the same way as the site.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $dimension_code The dimension code the row belongs to, such as `CHANNELS`.
	 * @param array  $row            The row, with its `current` and `previous` visitors.
	 * @return float The row's score. A higher score explains more of the site's change.
	 */
	public function score_row( $dimension_code, array $row ) {
		$delta          = $row['current'] - $row['previous'];
		$expected_delta = $row['previous'] * $this->get_site_change_percent() / 100;
		$site_direction = $this->get_site_direction();

		$moves_with_site = ( self::DIRECTION_UP === $site_direction && $delta > 0 )
			|| ( self::DIRECTION_DOWN === $site_direction && $delta < 0 );

		$traffic_impact = $this->get_traffic_impact_percent( $delta );
		$excess_impact  = $this->get_traffic_impact_percent( $delta - $expected_delta );
		$boost          = $moves_with_site ? self::SAME_DIRECTION_BOOST : 1;

		return ( 0.6 * abs( $traffic_impact ) + 0.4 * abs( $excess_impact ) ) * self::DIMENSION_WEIGHTS[ $dimension_code ] * $boost;
	}

	/**
	 * Checks whether a row is excluded from the response.
	 *
	 * A row is excluded when any of these is true:
	 * - Its change is under `MINIMUM_ABSOLUTE_DELTA` visitors or under
	 *   `MINIMUM_TRAFFIC_IMPACT_PERCENT`.
	 * - It moved against the site, and neither `COUNTER_TREND_TRAFFIC_IMPACT_PERCENT`
	 *   nor `COUNTER_TREND_SELF_CHANGE_PERCENT` keeps it.
	 * - It's a `DEVICES` or `VISITOR_MIX` row whose own change is less than
	 *   `MACRO_DIVERGENCE_PERCENT` percentage points from the site's change.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $dimension_code The dimension code the row belongs to, such as `DEVICES`.
	 * @param array  $row            The row, with its `current` and `previous` visitors.
	 * @return bool True when the row is excluded, false when the row is ranked.
	 */
	public function is_excluded_row( $dimension_code, array $row ) {
		$delta          = $row['current'] - $row['previous'];
		$traffic_impact = abs( $this->get_traffic_impact_percent( $delta ) );

		if ( abs( $delta ) < self::MINIMUM_ABSOLUTE_DELTA || $traffic_impact < self::MINIMUM_TRAFFIC_IMPACT_PERCENT ) {
			return true;
		}

		$self_change    = $this->get_self_change_percent( $row );
		$site_direction = $this->get_site_direction();

		$moves_against_site = ( self::DIRECTION_UP === $site_direction && $delta < 0 )
			|| ( self::DIRECTION_DOWN === $site_direction && $delta > 0 );

		$is_large_change = $traffic_impact >= self::COUNTER_TREND_TRAFFIC_IMPACT_PERCENT
			|| ( abs( $self_change ) >= self::COUNTER_TREND_SELF_CHANGE_PERCENT && abs( $delta ) >= self::COUNTER_TREND_DELTA );

		if ( $moves_against_site && ! $is_large_change ) {
			return true;
		}

		return in_array( $dimension_code, array( 'DEVICES', 'VISITOR_MIX' ), true )
			&& abs( $self_change - $this->get_site_change_percent() ) < self::MACRO_DIVERGENCE_PERCENT;
	}

	/**
	 * Gets the direction the site's visitors moved in, from the compare period
	 * to the selected period.
	 *
	 * @since n.e.x.t
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
	 * Gets the change in visitors as a percentage of the larger of the site's two
	 * totals.
	 *
	 * @since n.e.x.t
	 *
	 * @param int|float $change The change in visitors.
	 * @return int|float The change as a percentage, such as `10` for 10%, or `0` when the site had no visitors in either period.
	 */
	private function get_traffic_impact_percent( $change ) {
		$site_visitors = max( $this->visitors_current, $this->visitors_previous );

		return $site_visitors > 0 ? $change * 100 / $site_visitors : 0;
	}

	/**
	 * Gets the change in a row's own visitors, in percent.
	 *
	 * `is_excluded_row()` excludes a row with no visitors in either period before
	 * it calls this method.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $row The row, with its `current` and `previous` visitors.
	 * @return int|float The change in percent, such as `50` for a rise of 50%, or `100` for a row with no visitors in the compare period.
	 */
	private function get_self_change_percent( array $row ) {
		if ( $row['previous'] > 0 ) {
			return ( $row['current'] - $row['previous'] ) * 100 / $row['previous'];
		}

		return 100;
	}

	/**
	 * Gets the change in the site's visitors, in percent.
	 *
	 * @since n.e.x.t
	 *
	 * @return int|float The change in percent, such as `25` for a rise of 25%, or `0` when the site had no visitors in the compare period.
	 */
	private function get_site_change_percent() {
		if ( $this->visitors_previous > 0 ) {
			return ( $this->visitors_current - $this->visitors_previous ) * 100 / $this->visitors_previous;
		}

		return 0;
	}
}
