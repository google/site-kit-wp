<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Benchmarking\Typical_Traffic_Availability
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
 * Says which parts of the typical traffic view show for a site and a selected
 * period.
 *
 * This is a port of the Site Kit Service's `TypicalTrafficAvailabilityFor()`,
 * `internal/ai/typical_traffic_availability.go`, which §8 of the service's
 * `docs/benchmarking_feature_design.md` specifies (*When each part shows*).
 * The daily visits line always shows, and each other part waits for its own
 * history, counted from the site's first day of data through the period's
 * last day:
 *
 * - The band needs `d + 83` days, the history `Period_Baseline` fits it on.
 * - The key factor cards need a period of at least 7 days, and every day of
 *   the period before it.
 * - The benchmarking insight is requested with the key factor cards, since
 *   its driver describes the change they show, whether the band shows or not.
 * - The insight's analysis compares the period with the band, so it shows
 *   with the band and the request.
 *
 * Two rules are the plugin's own:
 *
 * - The service writes the insight for a period of up to 364 days, and
 *   refuses a longer one, but its rules have no longest period, since its
 *   dashboards only send periods of 7, 14, 28 or 90 days. The plugin's custom
 *   date ranges can be longer, so a period longer than 364 days is too long
 *   for the insight: it has the band and the key factor cards, but the insight
 *   isn't requested.
 * - A site with too little traffic has no band, no key factor cards and no
 *   insight, however long its history: the line alone shows, with a notice
 *   that says why. At a few visits a day, the band is so wide that it holds
 *   almost any number of visits, and a card can name a change of a handful of
 *   visits. Time fixes a short history, but not a low volume. The service's
 *   rules have no such state, and the threshold is provisional until product
 *   decides it (D12 of the scenarios doc).
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Typical_Traffic_Availability {

	/**
	 * The number of days, up to and including the period's last day, that the
	 * low traffic state measures the site's traffic over: the last 8 weeks.
	 *
	 * The window doesn't depend on the period's length, so every period that
	 * ends on a day gets the same answer, and a drop within a short period
	 * doesn't hide the band that shows it.
	 *
	 * @since n.e.x.t
	 */
	const LOW_TRAFFIC_DAYS = 56;

	/**
	 * The visits per 28 days under which a site has low traffic.
	 *
	 * This is the top of the service's lowest traffic tier, T0, in its
	 * population evaluation. At this level, the floor of the band's margin
	 * alone is 63 visits on a center of 100, so the band says little.
	 *
	 * @since n.e.x.t
	 */
	const LOW_TRAFFIC_VISITS_PER_28_DAYS = 100;

	/**
	 * Gets which parts of the typical traffic view show for the period that
	 * ends on a day.
	 *
	 * The keys are those of the service's availability fixtures, so the rules
	 * can be checked against them.
	 *
	 * @since n.e.x.t
	 *
	 * @param Period_Baseline $period_baseline The model of the site's daily series, from its first day with visits on.
	 * @param string          $end_date        The period's last day, as `YYYY-MM-DD`.
	 * @param int             $period_days     The period's length in days. A length that is not above `0` is read as 28, as `Period_Baseline` reads it.
	 * @return array {
	 *     Which parts show. A date is null when the site has no history up to
	 *     and including the period's last day. The dates count the history
	 *     alone, so a site with low traffic still has them.
	 *
	 *     @type bool        $range_too_short               Whether the period is shorter than 7 days, too short for the key factor cards and the insight.
	 *     @type bool        $band_available                Whether every day of the period has its band, which is also when the insight request carries a baseline: never for a site with low traffic.
	 *     @type string|null $band_available_from           The first last day of a period of this length with a band, as `YYYY-MM-DD`.
	 *     @type bool        $key_factors_available         Whether the period is long enough for the key factor cards, and every day of the period before it is in the history: never for a site with low traffic.
	 *     @type string|null $key_factors_available_from    The first last day of a period of this length whose previous period is in the history, as `YYYY-MM-DD`.
	 *     @type bool        $insight_request_allowed       Whether the insight is requested: with the key factor cards, for a period of up to 364 days.
	 *     @type bool        $performance_insight_available Whether the insight's analysis shows: with the band and the request.
	 *     @type bool        $last_year_available           Whether last year's two windows are in the history, so the band can mention the season.
	 *     @type bool        $range_too_long                Whether the period is longer than 364 days, too long for the insight, which the service caps at 364 days. The service's rules don't have it.
	 *     @type bool        $low_traffic                   Whether the site has too little traffic for the band, the key factor cards and the insight: under 100 visits per 28 days over the 56 days that end on the period's last day. The service's rules don't have it.
	 * }
	 */
	public static function get( Period_Baseline $period_baseline, $end_date, $period_days ) {
		$days                = Period_Baseline::get_period_days( $period_days );
		$history_days        = $period_baseline->get_history_days( $end_date );
		$band_history_days   = Period_Baseline::get_min_band_history_days( $days );
		$range_too_short     = $days < Insight_Request_Builder::MIN_PERIOD_DAYS;
		$low_traffic         = self::is_low_traffic( $period_baseline, $end_date );
		$band_available      = ! $low_traffic && $history_days >= $band_history_days;
		$key_factors_history = 2 * $days;
		$key_factors         = ! $low_traffic && ! $range_too_short && $history_days >= $key_factors_history;
		$range_too_long      = $days > Insight_Request_Builder::MAX_PERIOD_DAYS;
		$insight_request     = $key_factors && ! $range_too_long;

		$band_available_from        = null;
		$key_factors_available_from = null;

		// A site with history up to the period's last day has a valid last day.
		if ( $history_days > 0 ) {
			$first_day = ( new DateTimeImmutable( $end_date, new DateTimeZone( 'UTC' ) ) )->modify( '-' . ( $history_days - 1 ) . ' days' );

			$band_available_from        = $first_day->modify( '+' . ( $band_history_days - 1 ) . ' days' )->format( 'Y-m-d' );
			$key_factors_available_from = $first_day->modify( '+' . ( $key_factors_history - 1 ) . ' days' )->format( 'Y-m-d' );
		}

		return array(
			'range_too_short'               => $range_too_short,
			'band_available'                => $band_available,
			'band_available_from'           => $band_available_from,
			'key_factors_available'         => $key_factors,
			'key_factors_available_from'    => $key_factors_available_from,
			'insight_request_allowed'       => $insight_request,
			'performance_insight_available' => $band_available && $insight_request,
			'last_year_available'           => null !== $period_baseline->get_last_year_visits( $end_date, $days ),
			'range_too_long'                => $range_too_long,
			'low_traffic'                   => $low_traffic,
		);
	}

	/**
	 * Checks whether a site has too little traffic for the band, the key factor
	 * cards and the insight.
	 *
	 * The site's visits over the last `LOW_TRAFFIC_DAYS` days of its history up
	 * to the period's last day, or over its whole history when it is shorter,
	 * must average under `LOW_TRAFFIC_VISITS_PER_28_DAYS` per 28 days. A site
	 * without history up to that day has no traffic to measure, so the parts
	 * it waits for say so instead.
	 *
	 * @since n.e.x.t
	 *
	 * @param Period_Baseline $period_baseline The model of the site's daily series, from its first day with visits on.
	 * @param string          $end_date        The period's last day, as `YYYY-MM-DD`.
	 * @return bool True when the site has low traffic, false otherwise.
	 */
	private static function is_low_traffic( Period_Baseline $period_baseline, $end_date ) {
		$recent = $period_baseline->get_recent_visits( $end_date, self::LOW_TRAFFIC_DAYS );

		if ( null === $recent ) {
			return false;
		}

		// Whole numbers, so a site right at the threshold doesn't depend on
		// how a division rounds.
		return $recent['visits'] * 28 < self::LOW_TRAFFIC_VISITS_PER_28_DAYS * $recent['days'];
	}
}
