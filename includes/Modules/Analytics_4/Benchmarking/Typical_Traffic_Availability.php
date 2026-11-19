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
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Typical_Traffic_Availability {

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
	 *     and including the period's last day.
	 *
	 *     @type bool        $range_too_short               Whether the period is shorter than 7 days, too short for the key factor cards and the insight.
	 *     @type bool        $band_available                Whether every day of the period has its band, which is also when the insight request carries a baseline.
	 *     @type string|null $band_available_from           The first last day of a period of this length with a band, as `YYYY-MM-DD`.
	 *     @type bool        $key_factors_available         Whether the period is long enough for the key factor cards, and every day of the period before it is in the history.
	 *     @type string|null $key_factors_available_from    The first last day of a period of this length whose previous period is in the history, as `YYYY-MM-DD`.
	 *     @type bool        $insight_request_allowed       Whether the insight is requested: with the key factor cards.
	 *     @type bool        $performance_insight_available Whether the insight's analysis shows: with the band and the request.
	 *     @type bool        $last_year_available           Whether last year's two windows are in the history, so the band can mention the season.
	 * }
	 */
	public static function get( Period_Baseline $period_baseline, $end_date, $period_days ) {
		$days                = Period_Baseline::get_period_days( $period_days );
		$history_days        = $period_baseline->get_history_days( $end_date );
		$band_history_days   = Period_Baseline::get_min_band_history_days( $days );
		$range_too_short     = $days < Insight_Request_Builder::MIN_PERIOD_DAYS;
		$band_available      = $history_days >= $band_history_days;
		$key_factors_history = 2 * $days;
		$key_factors         = ! $range_too_short && $history_days >= $key_factors_history;

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
			'insight_request_allowed'       => $key_factors,
			'performance_insight_available' => $band_available && $key_factors,
			'last_year_available'           => null !== $period_baseline->get_last_year_visits( $end_date, $days ),
		);
	}
}
