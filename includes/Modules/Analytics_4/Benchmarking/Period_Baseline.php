<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Benchmarking\Period_Baseline
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
 * Calculates the expected range of a period's visits total, and last year's
 * totals for the same windows, from the site's daily visits.
 *
 * This is a port of the Site Kit Service's reference baseline model,
 * `internal/ai/baseline_model.go`, which §5.4 of the service's
 * `docs/benchmarking_feature_design.md` specifies (§5.5 for last year's
 * totals). The range is the expected range the benchmarking insight request
 * sends as `baseline`, and last year's totals are its `visits.last_year`.
 *
 * The range is a forecast of the judged period's total, fitted only on the
 * days before the period's first day, so nothing inside the period can move
 * it. That is unlike Expected_Baseline, which gives the chart its daily band
 * and fits each day's band on that day and the days before it.
 *
 * The model always fits 28-day blocks, whatever the period's length. It
 * removes spikes and outages from the reference, the up to 365 days before
 * the period, fits a level, a damped drift and a margin on the blocks of four
 * alignments 7 days apart, takes the medians over the alignments, and scales
 * the band's daily rate to the period's weekday-weighted days.
 *
 * Every constant keeps the value, and the name without its `baseline` prefix,
 * of its counterpart in the service, and every guard and rounding rule is the
 * service's, so the service's conformance fixtures hold for this class. Every
 * list is added up in order, oldest first, and the arithmetic follows the
 * order of the Go code, so the range bounds and the filtered days are the
 * service's exactly, and every other value matches it to well within the
 * fixtures' tolerance of `1e-6`.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Period_Baseline {

	/**
	 * The period's length, in days, when the given length is not above `0`.
	 *
	 * @since n.e.x.t
	 */
	const STANDARD_DAYS_IN_PERIOD = 28;

	/**
	 * The length of a block, in days.
	 *
	 * @since n.e.x.t
	 */
	const BLOCK_DAYS = 28;

	/**
	 * The fewest blocks of reference a range needs: two blocks give a level and
	 * one past miss.
	 *
	 * @since n.e.x.t
	 */
	const MIN_REFERENCE_BLOCKS = 2;

	/**
	 * The fewest days of reference a range needs: two blocks.
	 *
	 * @since n.e.x.t
	 */
	const MIN_REFERENCE_DAYS = self::MIN_REFERENCE_BLOCKS * self::BLOCK_DAYS;

	/**
	 * The most days of reference, the days before the period, that a range is
	 * fitted on.
	 *
	 * @since n.e.x.t
	 */
	const REFERENCE_DAYS = 365;

	/**
	 * The z-score that sets the band's width: with the misses' spread, it
	 * targets about 80% of periods within the range.
	 *
	 * @since n.e.x.t
	 */
	const Z = 2.326;

	/**
	 * The z-score the traffic-size default spread is divided by: the default
	 * spread is the floor margin over the center over this value.
	 *
	 * @since n.e.x.t
	 */
	const DEFAULT_Z = 1.645;

	/**
	 * The weight of the traffic-size default spread against the site's own
	 * misses in the margin.
	 *
	 * @since n.e.x.t
	 */
	const PRIOR_WEIGHT = 4.0;

	/**
	 * The number of block alignments the center and the margin are the medians
	 * over: the reference cut by 0, 7, 14 and 21 days.
	 *
	 * @since n.e.x.t
	 */
	const ALIGNMENTS = 4;

	/**
	 * The distance between two block alignments, in days: a quarter block.
	 *
	 * @since n.e.x.t
	 */
	const ALIGNMENT_STEP_DAYS = 7;

	/**
	 * The share of the measured drift carried into the center.
	 *
	 * @since n.e.x.t
	 */
	const DRIFT_DAMPING = 0.5;

	/**
	 * The number of cleaned blocks the level is the median of.
	 *
	 * @since n.e.x.t
	 */
	const LEVEL_BLOCKS = 12;

	/**
	 * The cap on each miss deviation in the margin, so a surge of more than 28
	 * days does not widen the range to a lower bound near zero.
	 *
	 * @since n.e.x.t
	 */
	const MAX_WIDTH_MISS = 0.19;

	/**
	 * The spike filter's half-window, in weeks: each day is compared with the
	 * up to nine values on the same weekday around it.
	 *
	 * @since n.e.x.t
	 */
	const FILTER_WEEKS = 4;

	/**
	 * The spike filter's threshold, in deviations of the reference's own
	 * day-to-day noise.
	 *
	 * @since n.e.x.t
	 */
	const FILTER_K = 4.0;

	/**
	 * The fewest same-weekday values a spike filter window needs to clean.
	 *
	 * @since n.e.x.t
	 */
	const FILTER_MIN_WINDOW = 5;

	/**
	 * The factor that turns a median absolute deviation into a
	 * normal-equivalent spread.
	 *
	 * @since n.e.x.t
	 */
	const MAD_SCALE = 1.4826;

	/**
	 * The lowest 28-day block center.
	 *
	 * @since n.e.x.t
	 */
	const MIN_CENTER = 10.0;

	/**
	 * The lowest margin of a period's range.
	 *
	 * @since n.e.x.t
	 */
	const MIN_MARGIN = 15.0;

	/**
	 * How far back last year's windows sit, in days: 52 whole weeks, so each
	 * window starts on the same weekday as the window it mirrors.
	 *
	 * @since n.e.x.t
	 */
	const LAST_YEAR_OFFSET_DAYS = 364;

	/**
	 * The visits of each date with a row, by date as `YYYY-MM-DD`. A date with
	 * more than one row has the visits of its last row.
	 *
	 * @since n.e.x.t
	 * @var int[]
	 */
	private $visits_by_date = array();

	/**
	 * The earliest date with a row, or null when no row has a valid date.
	 *
	 * @since n.e.x.t
	 * @var DateTimeImmutable|null
	 */
	private $first_day = null;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $daily_rows List of days in any order, each as `array( 'date' => 'YYYY-MM-DD', 'visits' => int )`. A row with an invalid date is ignored, and a date with more than one row keeps its last row.
	 */
	public function __construct( array $daily_rows ) {
		foreach ( $daily_rows as $row ) {
			$date = isset( $row['date'] ) ? $row['date'] : null;
			$day  = self::parse_date( $date );

			if ( null === $day ) {
				continue;
			}

			$this->visits_by_date[ $date ] = isset( $row['visits'] ) ? (int) $row['visits'] : 0;

			if ( null === $this->first_day || $day < $this->first_day ) {
				$this->first_day = $day;
			}
		}
	}

	/**
	 * Gets the fewest days of history, up to and including a period's last day,
	 * that give the period a range: the period and two 28-day reference blocks.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $period_days The period's length in days. A length that is not above `0` is read as 28.
	 * @return int The fewest days of history, 84 for a 28-day period.
	 */
	public static function get_min_range_history_days( $period_days ) {
		return self::get_period_days( $period_days ) + self::MIN_REFERENCE_DAYS;
	}

	/**
	 * Gets the expected range of the visits total of the period that ends on a
	 * day.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $target_date The period's last day, as `YYYY-MM-DD`: the last complete day.
	 * @param int    $period_days The period's length in days. A length that is not above `0` is read as 28.
	 * @return array|null {
	 *     The range, or null when the daily series up to and including the
	 *     target date has fewer than get_min_range_history_days() days.
	 *
	 *     @type int $expected_range_min The fewest visits in the range, rounded half away from zero and never below `0`.
	 *     @type int $expected_range_max The most visits in the range, rounded half away from zero.
	 * }
	 */
	public function get_range( $target_date, $period_days ) {
		$model = $this->get_model( $target_date, $period_days );

		if ( null === $model ) {
			return null;
		}

		return array(
			'expected_range_min' => (int) max( 0, round( $model['center'] - $model['margin'] ) ),
			'expected_range_max' => (int) round( $model['center'] + $model['margin'] ),
		);
	}

	/**
	 * Gets the visits of last year's windows: the period that ends on a day and
	 * the period before it, both shifted back 364 days.
	 *
	 * For the target date `T` and the period's length `d`, the current window is
	 * `[T - 364 - d + 1, T - 364]` and the previous window is
	 * `[T - 364 - 2d + 1, T - 364 - d]`. Each total is the plain sum of the
	 * visits of the window's rows.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $target_date The period's last day, as `YYYY-MM-DD`.
	 * @param int    $period_days The period's length in days. A length that is not above `0` is read as 28.
	 * @return array|null {
	 *     The totals, or null when a day of either window has no row, since a
	 *     missing day must not read as zero.
	 *
	 *     @type int $current_period  The visits of the window 364 days before the period.
	 *     @type int $previous_period The visits of the window 364 days before the previous period.
	 * }
	 */
	public function get_last_year_visits( $target_date, $period_days ) {
		$end = self::parse_date( $target_date );

		if ( null === $end ) {
			return null;
		}

		$days          = self::get_period_days( $period_days );
		$last_year_end = self::shift_day( $end, -self::LAST_YEAR_OFFSET_DAYS );
		$current       = $this->sum_visits( self::shift_day( $last_year_end, -( $days - 1 ) ), $last_year_end );
		$previous      = $this->sum_visits( self::shift_day( $last_year_end, -( 2 * $days - 1 ) ), self::shift_day( $last_year_end, -$days ) );

		if ( null === $current || null === $previous ) {
			return null;
		}

		return array(
			'current_period'  => $current,
			'previous_period' => $previous,
		);
	}

	/**
	 * Fits the model for the period that ends on a day, and gets the fitted
	 * band with its intermediate values.
	 *
	 * The keys and the values are those of the service's conformance fixtures,
	 * so the model can be checked against them.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $target_date The period's last day, as `YYYY-MM-DD`: the last complete day.
	 * @param int    $period_days The period's length in days. A length that is not above `0` is read as 28.
	 * @return array|null {
	 *     The model, or null when the daily series up to and including the
	 *     target date has fewer than get_min_range_history_days() days.
	 *
	 *     @type float    $center                   The period's band center: the block center over 28, times the period weight.
	 *     @type float    $margin                   The period's band half-width: the median of the alignment margins.
	 *     @type float    $block_center             The 28-day block center: the median of the alignment centers.
	 *     @type float    $period_weight            The period's length in weekday-weighted days: 7 for each whole week, plus the factors of the leftover days.
	 *     @type string[] $filtered_days            The dates of the reference days the spike filter replaced, oldest first.
	 *     @type float[]  $block_totals             The raw totals of the uncut reference's blocks, oldest first.
	 *     @type float[]  $cleaned_block_totals     The cleaned totals of the uncut reference's blocks, oldest first.
	 *     @type float[]  $ratios                   The drift ratios of the uncut reference: each cleaned block over the level before it, oldest first.
	 *     @type float[]  $width_ratios             The width ratios of the uncut reference: each cleaned block over the 3:2:1 forecast before it, oldest first.
	 *     @type float    $level                    The level of the uncut reference.
	 *     @type float[]  $alignment_drifts         The drift of each alignment, the uncut one first.
	 *     @type float[]  $alignment_centers        The 28-day block center of each alignment, the uncut one first.
	 *     @type float[]  $alignment_margins        The period's margin of each alignment, the uncut one first.
	 *     @type float[]  $dow_factors_sunday_first The factor of each weekday, from `0` for Sunday to `6` for Saturday.
	 * }
	 */
	public function get_model( $target_date, $period_days ) {
		$end = self::parse_date( $target_date );

		if ( null === $end ) {
			return null;
		}

		$days = self::get_period_days( $period_days );

		list( $visits, $dates, $weekdays ) = $this->get_daily_series( $end );

		$history_days = count( $visits );

		if ( $history_days < self::get_min_range_history_days( $days ) ) {
			return null;
		}

		$reference_end   = $history_days - $days;
		$reference_start = max( 0, $reference_end - self::REFERENCE_DAYS );
		$reference_days  = $reference_end - $reference_start;

		return self::fit_reference(
			array_slice( $visits, $reference_start, $reference_days ),
			array_slice( $dates, $reference_start, $reference_days ),
			array_slice( $weekdays, $reference_start, $reference_days ),
			$days
		);
	}

	/**
	 * Gets the daily series, by calendar date, from the earliest row up to and
	 * including a day.
	 *
	 * A day without a row has `0` visits, and rows after the day are not read.
	 *
	 * @since n.e.x.t
	 *
	 * @param DateTimeImmutable $end The series' last day.
	 * @return array List of the visits, the date and the weekday of each day, oldest first, or of empty lists when no row is on or before the day.
	 */
	private function get_daily_series( DateTimeImmutable $end ) {
		$visits   = array();
		$dates    = array();
		$weekdays = array();

		if ( null === $this->first_day || $this->first_day > $end ) {
			return array( $visits, $dates, $weekdays );
		}

		for ( $day = $this->first_day; $day <= $end; $day = self::shift_day( $day, 1 ) ) {
			$date       = $day->format( 'Y-m-d' );
			$visits[]   = isset( $this->visits_by_date[ $date ] ) ? (float) $this->visits_by_date[ $date ] : 0.0;
			$dates[]    = $date;
			$weekdays[] = (int) $day->format( 'w' );
		}

		return array( $visits, $dates, $weekdays );
	}

	/**
	 * Adds up the visits of the days from one day to another.
	 *
	 * @since n.e.x.t
	 *
	 * @param DateTimeImmutable $from The first day.
	 * @param DateTimeImmutable $to   The last day.
	 * @return int|null The visits of the days, or null when a day has no row.
	 */
	private function sum_visits( DateTimeImmutable $from, DateTimeImmutable $to ) {
		$total = 0;

		// A plain loop: the first day without a row stops the sum.
		for ( $day = $from; $day <= $to; $day = self::shift_day( $day, 1 ) ) {
			$date = $day->format( 'Y-m-d' );

			if ( ! isset( $this->visits_by_date[ $date ] ) ) {
				return null;
			}

			$total += $this->visits_by_date[ $date ];
		}

		return $total;
	}

	/**
	 * Fits the band for the period that starts on the day after the reference.
	 *
	 * The 28-day fit gives the block center, and the period's center is its
	 * daily rate over the period's weight, so the drift enters it once whatever
	 * the period's length. Each alignment's margin is computed for its block
	 * center scaled the same way.
	 *
	 * @since n.e.x.t
	 *
	 * @param float[]  $reference   The visits of each day of the reference, oldest first: at least two blocks.
	 * @param string[] $dates       The date of each day of the reference, in the same order.
	 * @param int[]    $weekdays    The weekday of each day of the reference, in the same order.
	 * @param int      $period_days The period's length in days.
	 * @return array The model, as get_model() returns it.
	 */
	private static function fit_reference( array $reference, array $dates, array $weekdays, $period_days ) {
		// The spike filter runs once, on the whole reference.
		$cleaned     = self::spike_filter( $reference );
		$dow_factors = self::get_day_of_week_factors( $cleaned, $weekdays );
		$weight      = self::get_period_weight( $dow_factors, $dates[ count( $dates ) - 1 ], $period_days );
		$scale       = $weight / self::BLOCK_DAYS;

		// Each alignment is a fit of the reference cut by 0, 7, 14 and 21 days,
		// so the band does not depend on where the block grid falls. A cut that
		// leaves fewer than two blocks is skipped; the uncut reference always
		// has two.
		$fits = array();

		for ( $alignment = 0; $alignment < self::ALIGNMENTS; $alignment++ ) {
			$cut = count( $reference ) - $alignment * self::ALIGNMENT_STEP_DAYS;

			if ( $cut >= self::MIN_REFERENCE_DAYS ) {
				$fits[] = self::fit_blocks( array_slice( $reference, 0, $cut ), array_slice( $cleaned, 0, $cut ) );
			}
		}

		$drifts  = array_map( fn( $fit ) => self::get_drift( $fit ), $fits );
		$centers = array_map(
			fn( $fit, $drift ) => max( self::MIN_CENTER, $fit['level'] * ( 1 + self::DRIFT_DAMPING * ( $drift - 1 ) ) ),
			$fits,
			$drifts
		);
		$margins = array_map(
			fn( $fit, $center ) => self::get_margin( $center * $scale, array_map( fn( $ratio ) => $ratio - 1, $fit['width_ratios'] ) ),
			$fits,
			$centers
		);

		$block_center = self::median( $centers );

		return array(
			'center'                   => $block_center * $scale,
			'margin'                   => self::median( $margins ),
			'block_center'             => $block_center,
			'period_weight'            => $weight,
			'filtered_days'            => array_values(
				array_filter(
					$dates,
					fn( $position ) => $cleaned[ $position ] !== $reference[ $position ],
					ARRAY_FILTER_USE_KEY
				)
			),
			'block_totals'             => $fits[0]['raw'],
			'cleaned_block_totals'     => $fits[0]['clean'],
			'ratios'                   => $fits[0]['ratios'],
			'width_ratios'             => $fits[0]['width_ratios'],
			'level'                    => $fits[0]['level'],
			'alignment_drifts'         => $drifts,
			'alignment_centers'        => $centers,
			'alignment_margins'        => $margins,
			'dow_factors_sunday_first' => $dow_factors,
		);
	}

	/**
	 * Gets the period's length in weekday-weighted days: 7 for each whole week,
	 * since the factors average to 1 over a week, plus the factors of the
	 * leftover days, which are the period's last days.
	 *
	 * @since n.e.x.t
	 *
	 * @param float[] $dow_factors The factor of each weekday, from `0` for Sunday to `6` for Saturday.
	 * @param string  $last_date   The reference's last day, as `YYYY-MM-DD`: the day before the period.
	 * @param int     $period_days The period's length in days.
	 * @return float The period's weight.
	 */
	private static function get_period_weight( array $dow_factors, $last_date, $period_days ) {
		$last     = self::parse_date( $last_date );
		$weeks    = intdiv( $period_days, 7 );
		$leftover = 0.0;

		for ( $day = 0; $day < $period_days - 7 * $weeks; $day++ ) {
			$leftover += $dow_factors[ (int) self::shift_day( $last, 7 * $weeks + $day + 1 )->format( 'w' ) ];
		}

		return 7 * $weeks + $leftover;
	}

	/**
	 * Fits the blocks of one alignment: the 28-day blocks aligned back from the
	 * end of the reference, their level, and their drift and width ratios.
	 *
	 * Leftover days at the start of the reference are not used for blocks.
	 *
	 * @since n.e.x.t
	 *
	 * @param float[] $reference The raw visits of each day of the reference, oldest first: at least two blocks.
	 * @param float[] $cleaned   The cleaned visits of each day of the reference, in the same order.
	 * @return array {
	 *     The fit.
	 *
	 *     @type float[] $raw          The raw block totals, oldest first, for information only.
	 *     @type float[] $clean        The cleaned block totals, oldest first.
	 *     @type float[] $ratios       The drift ratios: each cleaned block over the level of the blocks before it.
	 *     @type float[] $width_ratios The width ratios: each cleaned block over the forecast from the blocks before it.
	 *     @type float   $level        The level of the last block.
	 * }
	 */
	private static function fit_blocks( array $reference, array $cleaned ) {
		$block_count = intdiv( count( $reference ), self::BLOCK_DAYS );
		$offset      = count( $reference ) - $block_count * self::BLOCK_DAYS;
		$raw         = array();
		$clean       = array();

		for ( $block = 0; $block < $block_count; $block++ ) {
			$start   = $offset + $block * self::BLOCK_DAYS;
			$raw[]   = array_sum( array_slice( $reference, $start, self::BLOCK_DAYS ) );
			$clean[] = array_sum( array_slice( $cleaned, $start, self::BLOCK_DAYS ) );
		}

		return array(
			'raw'          => $raw,
			'clean'        => $clean,
			'ratios'       => self::get_forecast_ratios( $clean, fn( $block ) => self::get_level( $clean, $block ) ),
			'width_ratios' => self::get_forecast_ratios( $clean, fn( $block ) => self::get_forecast( $clean, $block ) ),
			'level'        => self::get_level( $clean, $block_count - 1 ),
		);
	}

	/**
	 * Gets each past cleaned block over the forecast made from the blocks
	 * before it, oldest first. A zero forecast has no ratio and is skipped.
	 *
	 * @since n.e.x.t
	 *
	 * @param float[]  $clean    The cleaned block totals, oldest first.
	 * @param callable $forecast Function that gets the forecast made from the blocks up to and including a block, from the block's position.
	 * @return float[] The ratios, oldest first.
	 */
	private static function get_forecast_ratios( array $clean, callable $forecast ) {
		$ratios      = array();
		$block_count = count( $clean );

		for ( $block = 1; $block < $block_count; $block++ ) {
			$expected = $forecast( $block - 1 );

			if ( 0.0 !== $expected ) {
				$ratios[] = $clean[ $block ] / $expected;
			}
		}

		return $ratios;
	}

	/**
	 * Gets the level at a block: the median of the cleaned blocks of the window
	 * of up to 12 blocks that ends at it.
	 *
	 * When the window holds at least eight blocks and its latest block has
	 * recovered, which is when it is at least 75% of the window's median,
	 * minority trough blocks below 75% of that median are left out of the
	 * median, so a slump of several blocks does not pull the level down after
	 * the recovery. While the latest block is still low, the drop is current
	 * and no block is left out.
	 *
	 * @since n.e.x.t
	 *
	 * @param float[] $clean The cleaned block totals, oldest first.
	 * @param int     $block The zero-based position of the block.
	 * @return float The level.
	 */
	private static function get_level( array $clean, $block ) {
		$start  = max( 0, $block - self::LEVEL_BLOCKS + 1 );
		$window = array_slice( $clean, $start, $block + 1 - $start );
		$median = self::median( $window );

		if ( count( $window ) >= 8 && $clean[ $block ] >= 0.75 * $median ) {
			$kept = array_filter( $window, fn( $total ) => $total >= 0.75 * $median );

			if ( count( $kept ) > intdiv( count( $window ), 2 ) ) {
				return self::median( $kept );
			}
		}

		return $median;
	}

	/**
	 * Gets the one-step forecast the width misses are measured against: the
	 * mean of the cleaned blocks up to three back from a block, weighted 3:2:1
	 * with the block itself the heaviest, over the blocks that exist.
	 *
	 * @since n.e.x.t
	 *
	 * @param float[] $clean The cleaned block totals, oldest first.
	 * @param int     $block The zero-based position of the block.
	 * @return float The forecast.
	 */
	private static function get_forecast( array $clean, $block ) {
		$sum    = 0.0;
		$weight = 0.0;

		foreach ( array( 3.0, 2.0, 1.0 ) as $back => $block_weight ) {
			if ( $block - $back < 0 ) {
				break;
			}

			$sum    += $block_weight * $clean[ $block - $back ];
			$weight += $block_weight;
		}

		return $sum / $weight;
	}

	/**
	 * Gets the drift of a fit: the median drift ratio, or `1` below three
	 * ratios.
	 *
	 * With at least eight blocks, a downward drift is `1`, since the level of
	 * many blocks already reflects lasting lower blocks.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $fit The fit, with its `clean` block totals and drift `ratios`.
	 * @return float The drift.
	 */
	private static function get_drift( array $fit ) {
		if ( count( $fit['ratios'] ) < 3 ) {
			return 1.0;
		}

		$drift = self::median( $fit['ratios'] );

		if ( count( $fit['clean'] ) >= 8 && $drift < 1 ) {
			return 1.0;
		}

		return $drift;
	}

	/**
	 * Removes spikes and outages from the reference with a same-weekday Hampel
	 * filter.
	 *
	 * Each day is compared with the up to nine values on the same weekday
	 * around it, the window shifted to stay inside the reference; a window of
	 * fewer than five values never cleans. A day is flagged when it is more
	 * than four deviations from its window's median. The deviation is the
	 * reference's own day-to-day noise times the median, floored at the square
	 * root of the median, so flat or low-traffic series are not cleaned. A day
	 * above its window's median while that median sits below the weekday's
	 * median over the whole reference is measured against the weekday's median
	 * instead, and flagged only above it, so the return to normal at the end of
	 * a dip is not removed. A flagged day is replaced by the median of the
	 * values in its window that are not flagged themselves, or by the window's
	 * median when all are. Every test reads the raw values, and the weekday of
	 * a day is its position modulo 7, since the reference has every day.
	 *
	 * @since n.e.x.t
	 *
	 * @param float[] $reference The visits of each day of the reference, oldest first.
	 * @return float[] The cleaned visits, in the same order.
	 */
	private static function spike_filter( array $reference ) {
		$weekday_medians = self::get_weekday_medians( $reference );
		$windows         = self::get_filter_windows( $reference );
		$sigma           = self::get_relative_noise( $reference, $windows );
		$flagged         = array();

		foreach ( $windows as $position => $window ) {
			$flagged[ $position ] = null !== $window && self::is_spike( $reference[ $position ], $window['median'], $weekday_medians[ $position % 7 ], $sigma );
		}

		$cleaned = array();

		foreach ( $reference as $position => $visits ) {
			$cleaned[] = $flagged[ $position ] ? self::get_replacement( $reference, $windows[ $position ], $flagged ) : $visits;
		}

		return $cleaned;
	}

	/**
	 * Gets the median of each weekday's values over the whole reference.
	 *
	 * @since n.e.x.t
	 *
	 * @param float[] $reference The visits of each day of the reference, oldest first.
	 * @return float[] The median of each position modulo 7, or `0` for a position without values.
	 */
	private static function get_weekday_medians( array $reference ) {
		$values = array_fill( 0, 7, array() );

		foreach ( $reference as $position => $visits ) {
			$values[ $position % 7 ][] = $visits;
		}

		return array_map(
			fn( $weekday_values ) => array() === $weekday_values ? 0.0 : self::median( $weekday_values ),
			$values
		);
	}

	/**
	 * Gets the spike filter window of each day of the reference.
	 *
	 * @since n.e.x.t
	 *
	 * @param float[] $reference The visits of each day of the reference, oldest first.
	 * @return array List of windows in the same order, each as `array( 'days' => int[], 'median' => float )` with the positions of its days, or null for a day whose window has fewer than five values.
	 */
	private static function get_filter_windows( array $reference ) {
		$reference_days = count( $reference );
		$windows        = array();

		for ( $position = 0; $position < $reference_days; $position++ ) {
			$first        = $position % 7;
			$same_weekday = intdiv( $reference_days - $first + 6, 7 );
			$window_size  = min( 2 * self::FILTER_WEEKS + 1, $same_weekday );

			if ( $window_size < self::FILTER_MIN_WINDOW ) {
				$windows[] = null;
				continue;
			}

			$start = min( max( intdiv( $position, 7 ) - self::FILTER_WEEKS, 0 ), $same_weekday - $window_size );
			$days  = array_map( fn( $week ) => $first + 7 * ( $start + $week ), range( 0, $window_size - 1 ) );

			$windows[] = array(
				'days'   => $days,
				'median' => self::median( array_map( fn( $day ) => $reference[ $day ], $days ) ),
			);
		}

		return $windows;
	}

	/**
	 * Gets the reference's relative day-to-day noise: 1.4826 times the median
	 * of each day's relative distance from its window's median, over the days
	 * whose window cleans and has a median above `0`.
	 *
	 * @since n.e.x.t
	 *
	 * @param float[] $reference The visits of each day of the reference, oldest first.
	 * @param array   $windows   The spike filter window of each day, in the same order.
	 * @return float The noise, or `0` when no day has a window with a median above `0`.
	 */
	private static function get_relative_noise( array $reference, array $windows ) {
		$distances = array();

		foreach ( $windows as $position => $window ) {
			if ( null !== $window && $window['median'] > 0 ) {
				$distances[] = abs( $reference[ $position ] / $window['median'] - 1 );
			}
		}

		return array() === $distances ? 0.0 : self::MAD_SCALE * self::median( $distances );
	}

	/**
	 * Checks whether the spike filter flags a day.
	 *
	 * @since n.e.x.t
	 *
	 * @param float $visits         The day's visits.
	 * @param float $window_median  The median of the day's window.
	 * @param float $weekday_median The median of the day's weekday over the whole reference.
	 * @param float $sigma          The reference's relative day-to-day noise.
	 * @return bool True when the day is a spike or an outage, false otherwise.
	 */
	private static function is_spike( $visits, $window_median, $weekday_median, $sigma ) {
		// A high value inside a local trough is measured against the weekday's
		// median over the whole reference, so a return to normal is not removed,
		// and it is flagged only above that median, since a trough day below it
		// is not an outage of the trough.
		if ( $visits > $window_median && $weekday_median > $window_median ) {
			$scale = max( $sigma * $weekday_median, sqrt( max( $weekday_median, 1.0 ) ) );

			return $visits - $weekday_median > self::FILTER_K * $scale;
		}

		$scale = max( $sigma * $window_median, sqrt( max( $window_median, 1.0 ) ) );

		return abs( $visits - $window_median ) > self::FILTER_K * $scale;
	}

	/**
	 * Gets the value that replaces a flagged day: the median of the values in
	 * its window that are not flagged, or the window's median when all are.
	 *
	 * @since n.e.x.t
	 *
	 * @param float[] $reference The visits of each day of the reference, oldest first.
	 * @param array   $window    The day's window, with the positions of its `days` and its `median`.
	 * @param bool[]  $flagged   Whether the spike filter flags each day of the reference, in the same order.
	 * @return float The replacement visits.
	 */
	private static function get_replacement( array $reference, array $window, array $flagged ) {
		$normal = array();

		foreach ( $window['days'] as $day ) {
			if ( ! $flagged[ $day ] ) {
				$normal[] = $reference[ $day ];
			}
		}

		return array() === $normal ? $window['median'] : self::median( $normal );
	}

	/**
	 * Gets the margin, the band's half-width, for a center from the site's
	 * relative forecast misses.
	 *
	 * The site's spread is 1.4826 times the median absolute deviation of the
	 * misses from their median from three misses on, and their root mean
	 * square with one or two, each deviation capped at 0.19. It is blended with
	 * the traffic-size default spread, the floor margin over the center over
	 * 1.645, which weighs as much as four misses. The margin is the center
	 * times 2.326 times the blended spread, and never below 15.
	 *
	 * @since n.e.x.t
	 *
	 * @param float   $center The center the margin is for.
	 * @param float[] $misses The relative forecast misses, oldest first.
	 * @return float The margin.
	 */
	private static function get_margin( $center, array $misses ) {
		$floor_margin = 5.0 * sqrt( $center ) + 0.13 * $center;
		$sigma0       = $floor_margin / $center / self::DEFAULT_Z;
		$miss_count   = count( $misses );
		$site_sigma   = 0.0;

		if ( $miss_count >= 3 ) {
			$median     = self::median( $misses );
			$site_sigma = self::MAD_SCALE * self::median(
				array_map( fn( $miss ) => min( abs( $miss - $median ), self::MAX_WIDTH_MISS ), $misses )
			);
		} elseif ( $miss_count > 0 ) {
			$squares = array_map(
				function ( $miss ) {
					$deviation = min( abs( $miss ), self::MAX_WIDTH_MISS );

					return $deviation * $deviation;
				},
				$misses
			);

			$site_sigma = sqrt( array_sum( $squares ) / $miss_count );
		}

		$sigma = sqrt( ( self::PRIOR_WEIGHT * $sigma0 * $sigma0 + $miss_count * $site_sigma * $site_sigma ) / ( self::PRIOR_WEIGHT + $miss_count ) );

		return max( self::MIN_MARGIN, $center * self::Z * $sigma );
	}

	/**
	 * Gets the day-of-week factors: `0.10 + 0.90` times each weekday's mean
	 * over the mean of the weekday means.
	 *
	 * A weekday without values gets `1`, and so does every weekday when the
	 * mean of the weekday means is not above `0`.
	 *
	 * @since n.e.x.t
	 *
	 * @param float[] $values   The cleaned visits of each day of the reference, oldest first.
	 * @param int[]   $weekdays The weekday of each day, from `0` for Sunday to `6` for Saturday, in the same order.
	 * @return float[] The factor of each weekday, from `0` for Sunday to `6` for Saturday.
	 */
	private static function get_day_of_week_factors( array $values, array $weekdays ) {
		$sums   = array_fill( 0, 7, 0.0 );
		$counts = array_fill( 0, 7, 0 );

		foreach ( $values as $position => $visits ) {
			$sums[ $weekdays[ $position ] ] += $visits;
			++$counts[ $weekdays[ $position ] ];
		}

		$sum_of_means = 0.0;
		$present      = 0;

		for ( $weekday = 0; $weekday < 7; $weekday++ ) {
			if ( $counts[ $weekday ] > 0 ) {
				$sum_of_means += $sums[ $weekday ] / $counts[ $weekday ];
				++$present;
			}
		}

		$factors = array_fill( 0, 7, 1.0 );

		if ( 0 === $present || $sum_of_means <= 0 ) {
			return $factors;
		}

		$overall_mean = $sum_of_means / $present;

		for ( $weekday = 0; $weekday < 7; $weekday++ ) {
			if ( $counts[ $weekday ] > 0 ) {
				$factors[ $weekday ] = 0.10 + 0.90 * ( $sums[ $weekday ] / $counts[ $weekday ] / $overall_mean );
			}
		}

		return $factors;
	}

	/**
	 * Gets the median of values: the mean of the two middle values for an even
	 * count.
	 *
	 * @since n.e.x.t
	 *
	 * @param float[] $values The values. There is at least one.
	 * @return float The median.
	 */
	private static function median( array $values ) {
		sort( $values );

		$count  = count( $values );
		$middle = intdiv( $count, 2 );

		if ( 1 === $count % 2 ) {
			return $values[ $middle ];
		}

		return ( $values[ $middle - 1 ] + $values[ $middle ] ) / 2;
	}

	/**
	 * Gets a period's length in days, reading a length that is not above `0` as
	 * the standard period.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $period_days The period's length in days.
	 * @return int The period's length in days, at least `1`.
	 */
	private static function get_period_days( $period_days ) {
		$period_days = (int) $period_days;

		return $period_days > 0 ? $period_days : self::STANDARD_DAYS_IN_PERIOD;
	}

	/**
	 * Parses a date as `YYYY-MM-DD`, at midnight in UTC.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $date The date.
	 * @return DateTimeImmutable|null The day, or null when the date is not a valid `YYYY-MM-DD` date, such as `2024-02-30`.
	 */
	private static function parse_date( $date ) {
		if ( ! is_string( $date ) ) {
			return null;
		}

		$day = DateTimeImmutable::createFromFormat( '!Y-m-d', $date, new DateTimeZone( 'UTC' ) );

		// A date that does not read back the same, such as one past the end of
		// its month, is not valid.
		if ( false === $day || $day->format( 'Y-m-d' ) !== $date ) {
			return null;
		}

		return $day;
	}

	/**
	 * Shifts a day by a number of calendar days.
	 *
	 * @since n.e.x.t
	 *
	 * @param DateTimeImmutable $day  The day.
	 * @param int               $days The number of days to shift the day by, negative to shift it back.
	 * @return DateTimeImmutable The shifted day.
	 */
	private static function shift_day( DateTimeImmutable $day, $days ) {
		return $day->modify( sprintf( '%+d days', $days ) );
	}
}
