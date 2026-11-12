<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Benchmarking\Expected_Baseline
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
 * Calculates the range of daily visits that is normal for a site on a day,
 * from the site's own history.
 *
 * A day's range is fitted on that day and on up to 364 days before it, and on
 * nothing after it, so a later day never moves an earlier day's range. The
 * range is centered on the site's level over the 28 days that end on the day,
 * and the weekday pattern of the whole window gives it its shape. Unusual days
 * are limited before the fit, so a viral day or an outage doesn't move it.
 *
 * Every step is fixed arithmetic, and every list is added up from the oldest
 * day to the newest, so a daily series always gives the same bounds to the
 * decimal.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Expected_Baseline {

	/**
	 * The fewest days, from the first day with visits up to and including a day,
	 * that give the day a range.
	 *
	 * @since n.e.x.t
	 */
	const MINIMUM_HISTORY_DAYS = 28;

	/**
	 * The most days, up to and including a day, that the day's range is fitted on.
	 *
	 * @since n.e.x.t
	 */
	const MAXIMUM_HISTORY_DAYS = 365;

	/**
	 * The direction of a monthly trend above `+4%`.
	 *
	 * @since n.e.x.t
	 */
	const DIRECTION_UP = 'UP';

	/**
	 * The direction of a monthly trend below `-4%`.
	 *
	 * @since n.e.x.t
	 */
	const DIRECTION_DOWN = 'DOWN';

	/**
	 * The direction of a monthly trend from `-4%` to `+4%`.
	 *
	 * @since n.e.x.t
	 */
	const DIRECTION_STABLE = 'STABLE';

	/**
	 * The visits of each day, oldest first.
	 *
	 * @since n.e.x.t
	 * @var float[]
	 */
	private $visits = array();

	/**
	 * The weekday of each day, from `0` for Sunday to `6` for Saturday.
	 *
	 * @since n.e.x.t
	 * @var int[]
	 */
	private $weekdays = array();

	/**
	 * The position of the first day with visits, or null when no day has any.
	 *
	 * @since n.e.x.t
	 * @var int|null
	 */
	private $first_traffic_position = null;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $daily_series List of days, oldest first with one entry for each day, each as `array( 'date' => 'YYYY-MM-DD', 'visits' => int )`.
	 */
	public function __construct( array $daily_series ) {
		$utc = new DateTimeZone( 'UTC' );

		foreach ( array_values( $daily_series ) as $position => $day ) {
			// Every value is a float, so two totals over different days with the
			// same visits compare as equal.
			$this->visits[]   = (float) $day['visits'];
			$this->weekdays[] = (int) ( new DateTimeImmutable( $day['date'], $utc ) )->format( 'w' );

			if ( null === $this->first_traffic_position && $day['visits'] > 0 ) {
				$this->first_traffic_position = $position;
			}
		}
	}

	/**
	 * Gets the range of visits that is normal for a day, and the site's monthly
	 * trend up to that day.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $day_index The day's zero-based position in the daily series.
	 * @return array {
	 *     The day's results. Every value is null when the day has fewer than
	 *     `MINIMUM_HISTORY_DAYS` days from the first day with visits up to and
	 *     including it.
	 *
	 *     @type float|null  $expectedMin         The fewest visits that are normal for the day, rounded to one decimal.
	 *     @type float|null  $expectedMax         The most visits that are normal for the day, rounded to one decimal.
	 *     @type float|null  $monthlyTrendPercent The change in the site's visits per month, in percent, not rounded.
	 *     @type string|null $trendDirection      The direction of the monthly trend, `UP`, `DOWN` or `STABLE`.
	 * }
	 */
	public function get_fit( $day_index ) {
		$fit = $this->fit( $day_index );

		if ( null === $fit ) {
			return array(
				'expectedMin'         => null,
				'expectedMax'         => null,
				'monthlyTrendPercent' => null,
				'trendDirection'      => null,
			);
		}

		list( $expected_min, $expected_max ) = $this->get_band( $fit, $this->weekdays[ $day_index ] );

		return array(
			'expectedMin'         => $expected_min,
			'expectedMax'         => $expected_max,
			'monthlyTrendPercent' => $fit['monthlyTrendPercent'],
			'trendDirection'      => $this->get_trend_direction( $fit['monthlyTrendPercent'] ),
		);
	}

	/**
	 * Fits the model on the history window of a day.
	 *
	 * The window runs from the later of the first day with visits and the day
	 * `MAXIMUM_HISTORY_DAYS - 1` days earlier, up to and including the day.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $day_index The day's zero-based position in the daily series.
	 * @return array|null {
	 *     The fit, or null when the window has fewer than `MINIMUM_HISTORY_DAYS` days.
	 *
	 *     @type float   $center              The site's level, as a 28-day total, called `B` in the design.
	 *     @type float   $margin              How far a normal 28-day total can be from the center, called `M`.
	 *     @type float[] $weekdayFactors      The factor of each weekday, from `0` for Sunday to `6` for Saturday, called `S`.
	 *     @type float   $monthlyTrendPercent The change in the site's visits per month, in percent.
	 * }
	 */
	private function fit( $day_index ) {
		if ( null === $this->first_traffic_position || ! isset( $this->visits[ $day_index ] ) || $day_index < $this->first_traffic_position ) {
			return null;
		}

		$window_start = max( $this->first_traffic_position, $day_index - self::MAXIMUM_HISTORY_DAYS + 1 );
		$window_days  = $day_index - $window_start + 1;

		if ( $window_days < self::MINIMUM_HISTORY_DAYS ) {
			return null;
		}

		$window          = array_slice( $this->visits, $window_start, $window_days );
		$window_weekdays = array_slice( $this->weekdays, $window_start, $window_days );
		$limited         = $this->limit_window( $window );
		$totals          = $this->get_period_totals( $limited );
		$weekday_factors = $this->get_weekday_factors( $limited, $window_weekdays );

		// With fewer than two 28-day totals there is no trend to fit, so the
		// center is the plain total of the last 28 days, before limiting, and the
		// margin is wider.
		if ( count( $totals ) < 2 ) {
			$center = array_sum( array_slice( $window, -28 ) );

			return array(
				'center'              => $center,
				'margin'              => max( 15, 0.18 * $center + 6.5 * sqrt( $center ), 0.25 * $center ),
				'weekdayFactors'      => $weekday_factors,
				'monthlyTrendPercent' => 0.0,
			);
		}

		$last_days         = array_slice( $limited, -28 );
		$last_day_weekdays = array_slice( $window_weekdays, -28 );
		$center            = $this->get_center( $last_days );

		return array(
			'center'              => $center,
			'margin'              => $this->get_margin( $center, $last_days, $last_day_weekdays, $weekday_factors ),
			'weekdayFactors'      => $weekday_factors,
			'monthlyTrendPercent' => $this->get_monthly_trend_percent( $totals ),
		);
	}

	/**
	 * Limits every value of a window to two and a half interquartile ranges
	 * below the lower quartile or above the upper quartile.
	 *
	 * The quartiles are the values at fixed positions of the sorted window, not
	 * interpolated percentiles.
	 *
	 * @since n.e.x.t
	 *
	 * @param float[] $window The visits of each day of the window, oldest first.
	 * @return float[] The limited visits, in the same order.
	 */
	private function limit_window( array $window ) {
		$window_days = count( $window );
		$sorted      = $window;

		sort( $sorted );

		$lower_quartile = $sorted[ intdiv( $window_days, 4 ) ];
		$upper_quartile = $sorted[ intdiv( 3 * $window_days, 4 ) ];
		$range          = max( 10, $upper_quartile - $lower_quartile );
		$lower_limit    = max( 0, $lower_quartile - 2.5 * $range );
		$upper_limit    = $upper_quartile + 2.5 * $range;

		return array_map(
			fn( $visits ) => (float) min( $upper_limit, max( $lower_limit, $visits ) ),
			$window
		);
	}

	/**
	 * Gets the 28-day totals the monthly trend is fitted on: one total every 14
	 * days from the start of the window, then the total of the last 28 days
	 * unless the last total already equals it.
	 *
	 * @since n.e.x.t
	 *
	 * @param float[] $limited The limited visits of each day of the window, oldest first.
	 * @return float[] The totals, oldest first.
	 */
	private function get_period_totals( array $limited ) {
		$window_days = count( $limited );
		$totals      = array();

		for ( $start = 0; $start + 28 <= $window_days; $start += 14 ) {
			$totals[] = array_sum( array_slice( $limited, $start, 28 ) );
		}

		$last_total = array_sum( array_slice( $limited, -28 ) );

		if ( end( $totals ) !== $last_total ) {
			$totals[] = $last_total;
		}

		return $totals;
	}

	/**
	 * Gets the factor of each weekday: the weekday's mean over the window,
	 * relative to the mean of all seven weekdays, moved a tenth of the way
	 * toward `1`.
	 *
	 * @since n.e.x.t
	 *
	 * @param float[] $limited  The limited visits of each day of the window, oldest first.
	 * @param int[]   $weekdays The weekday of each day of the window, in the same order.
	 * @return float[] The factor of each weekday, from `0` for Sunday to `6` for Saturday.
	 */
	private function get_weekday_factors( array $limited, array $weekdays ) {
		$weekday_sums   = array_fill( 0, 7, 0.0 );
		$weekday_counts = array_fill( 0, 7, 0 );

		foreach ( $limited as $position => $visits ) {
			$weekday_sums[ $weekdays[ $position ] ] += $visits;
			++$weekday_counts[ $weekdays[ $position ] ];
		}

		// A window has at least `MINIMUM_HISTORY_DAYS` days, so every weekday
		// is in it at least four times.
		$weekday_means = array_map(
			fn( $sum, $count ) => $sum / $count,
			$weekday_sums,
			$weekday_counts
		);

		$mean_of_means = array_sum( $weekday_means ) / 7;

		if ( $mean_of_means <= 0 ) {
			$mean_of_means = 1;
		}

		return array_map(
			fn( $mean ) => 0.10 + 0.90 * $mean / $mean_of_means,
			$weekday_means
		);
	}

	/**
	 * Gets the change in the site's visits per month, from a weighted least
	 * squares line through the 28-day totals, where each total counts for less
	 * the older it is.
	 *
	 * @since n.e.x.t
	 *
	 * @param float[] $totals The 28-day totals, oldest first. There are at least two.
	 * @return float The fitted slope over the weighted mean of the totals, in percent, or `0` when there is no slope to fit or the weighted mean is not above `0`.
	 */
	private function get_monthly_trend_percent( array $totals ) {
		$count        = count( $totals );
		$weights      = array();
		$months       = array();
		$weight_sum   = 0;
		$weighted_x   = 0;
		$weighted_sum = 0;

		foreach ( $totals as $position => $total ) {
			$weights[ $position ] = exp( -0.18 * ( $count - 1 - $position ) );
			$months[ $position ]  = $position * 14 / 30.4375;

			$weight_sum   += $weights[ $position ];
			$weighted_x   += $weights[ $position ] * $months[ $position ];
			$weighted_sum += $weights[ $position ] * $total;
		}

		$mean_months = $weighted_x / $weight_sum;
		$mean_total  = $weighted_sum / $weight_sum;
		$numerator   = 0;
		$denominator = 0;

		foreach ( $totals as $position => $total ) {
			$numerator   += $weights[ $position ] * ( $months[ $position ] - $mean_months ) * ( $total - $mean_total );
			$denominator += $weights[ $position ] * ( $months[ $position ] - $mean_months ) ** 2;
		}

		// The denominator adds up squares, so it is `0` or above.
		if ( $denominator <= 0 || $mean_total <= 0 ) {
			return 0.0;
		}

		return $numerator / $denominator / $mean_total * 100;
	}

	/**
	 * Gets the site's level, as a 28-day total: the value on the last day of an
	 * ordinary least squares line through the last 28 days, kept within `0.6`
	 * and `1.2` times their mean.
	 *
	 * @since n.e.x.t
	 *
	 * @param float[] $last_days The limited visits of the last 28 days, oldest first.
	 * @return float The level, at least `10`.
	 */
	private function get_center( array $last_days ) {
		$mean        = array_sum( $last_days ) / 28;
		$mean_day    = 13.5;
		$numerator   = 0;
		$denominator = 0;

		foreach ( $last_days as $day => $visits ) {
			$numerator   += ( $day - $mean_day ) * ( $visits - $mean );
			$denominator += ( $day - $mean_day ) ** 2;
		}

		$slope     = $numerator / $denominator;
		$intercept = $mean - $slope * $mean_day;
		$last_day  = min( 1.2 * $mean, max( 0.6 * $mean, $intercept + $slope * 27 ) );

		return max( 10, 28 * $last_day );
	}

	/**
	 * Gets how far a normal 28-day total can be from the center: two and a half
	 * times the root-mean-square error of the last 28 days around the
	 * weekday-shaped center, kept between a floor and a ceiling that grow with
	 * the center.
	 *
	 * @since n.e.x.t
	 *
	 * @param float   $center          The site's level, as a 28-day total.
	 * @param float[] $last_days       The limited visits of the last 28 days, oldest first.
	 * @param int[]   $weekdays        The weekday of each of the last 28 days, in the same order.
	 * @param float[] $weekday_factors The factor of each weekday.
	 * @return float The margin, at least `15`.
	 */
	private function get_margin( $center, array $last_days, array $weekdays, array $weekday_factors ) {
		$squared_errors = 0;

		foreach ( $last_days as $day => $visits ) {
			$squared_errors += ( $visits - $center / 28 * $weekday_factors[ $weekdays[ $day ] ] ) ** 2;
		}

		$error   = sqrt( $squared_errors / 21 ) * sqrt( 28 );
		$floor   = 5 * sqrt( $center ) + 0.13 * $center;
		$ceiling = max( $floor, 0.24 * $center );

		return max( 15, $floor, min( $ceiling, 2.5 * $error ) );
	}

	/**
	 * Gets a day's bounds: the 28-day range around the center, scaled to one day
	 * with the factor of the day's weekday.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $fit     The fit, with its `center`, `margin` and `weekdayFactors`.
	 * @param int   $weekday The day's weekday, from `0` for Sunday to `6` for Saturday.
	 * @return float[] The fewest and the most visits that are normal for the day, each rounded to one decimal.
	 */
	private function get_band( array $fit, $weekday ) {
		$factor = $fit['weekdayFactors'][ $weekday ];

		return array(
			round( max( 0, $fit['center'] - $fit['margin'] ) / 28 * $factor, 1 ),
			round( ( $fit['center'] + $fit['margin'] ) / 28 * $factor, 1 ),
		);
	}

	/**
	 * Gets the direction of a monthly trend.
	 *
	 * @since n.e.x.t
	 *
	 * @param float $monthly_trend_percent The change in the site's visits per month, in percent.
	 * @return string The direction, `UP`, `DOWN` or `STABLE`.
	 */
	private function get_trend_direction( $monthly_trend_percent ) {
		if ( $monthly_trend_percent > 4 ) {
			return self::DIRECTION_UP;
		}

		if ( $monthly_trend_percent < -4 ) {
			return self::DIRECTION_DOWN;
		}

		return self::DIRECTION_STABLE;
	}
}
