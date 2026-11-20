<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Benchmarking\Decomposition_Builder
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Benchmarking;

/**
 * Builds the `decomposition` of the insight request from the key factor cards
 * the panel shows.
 *
 * The service writes the insight's driver text about the cards it receives as
 * `decomposition`, and ranks the contextual rows itself only without them. So
 * sending the cards keeps the text from naming a channel, a page or a site that
 * no card shows. The service never recomputes or re-selects the cards: it
 * leaves out a card, a row or a field it can't narrate, and narrates the rest
 * as sent. The wire format is the one of service §5.10.
 *
 * A card or a row the wire format has no kind for is left out, so the service
 * never narrates it:
 * - A search keyword card, since its change counts clicks, which are not part
 *   of the site's visits.
 * - A landing page card for the home page, since the service never names the
 *   home page as a page.
 * - A traffic channel row, since only a channel group card has channel rows.
 *
 * The figures that describe the period and each card are computed as the
 * service's reference client computes them: the period's direction and shape,
 * each card's role, share and excess change, and each row's share of its
 * card's change. The panel shows only the changes in visits, so none of these
 * figures can disagree with what the reader sees.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Decomposition_Builder {

	/**
	 * The change in visits, in percent of the previous period, beyond which the
	 * period is a rise or a drop rather than steady.
	 *
	 * @since n.e.x.t
	 */
	const NOTABLE_CHANGE_PERCENT = 5.0;

	/**
	 * The excess change, in percent of the larger period total, that a channel
	 * of a steady period needs for the period to count as channels offsetting
	 * each other. Below it, nothing moved materially.
	 *
	 * @since n.e.x.t
	 */
	const OFFSETTING_EXCESS_PERCENT = 1.0;

	/**
	 * The share of the movement in the period's direction that the largest
	 * channel moving that way needs for the change to be concentrated in it.
	 *
	 * @since n.e.x.t
	 */
	const CONCENTRATED_SHARE = 0.5;

	/**
	 * The share of the site's gross movement a card needs for its change to be
	 * described as large.
	 *
	 * @since n.e.x.t
	 */
	const LARGE_SHARE = 0.25;

	/**
	 * The share of a card's change, in percent, from which a row is a part of
	 * it rather than context.
	 *
	 * @since n.e.x.t
	 */
	const DECOMPOSITION_ROW_SHARE_PERCENT = 25;

	/**
	 * The share of the site's net change, in percent, from which an offsetting
	 * card's share is left out, since it would read as all of the change.
	 *
	 * @since n.e.x.t
	 */
	const NET_CHANGE_SHARE_LIMIT_PERCENT = 99.5;

	/**
	 * The share of the site's net change, in proportion, below which the pool of
	 * movement in the site's own direction is too small to be a card's share.
	 *
	 * @since n.e.x.t
	 */
	const MINIMUM_POOL_SHARE = 0.25;

	/**
	 * The excess change, in percent of the larger period total, a card needs to
	 * be outsized.
	 *
	 * @since n.e.x.t
	 */
	const OUTSIZED_EXCESS_PERCENT = 1.0;

	/**
	 * The share of its own change a card's excess change needs to be outsized.
	 *
	 * @since n.e.x.t
	 */
	const OUTSIZED_EXCESS_SHARE = 0.5;

	/**
	 * The service's `dimension` and `entity_kind` of each key factor kind the
	 * wire format has a card for.
	 *
	 * @since n.e.x.t
	 */
	const CARD_KINDS = array(
		'CHANNEL'        => array( 'TRAFFIC_CHANNELS', 'CHANNEL' ),
		'CONTENT'        => array( 'PAGES', 'CONTENT' ),
		'REFERRING_SITE' => array( 'SOURCES', 'REFERRING_SITE' ),
		'CAMPAIGN'       => array( 'CAMPAIGNS', 'CAMPAIGN' ),
	);

	/**
	 * The service's row `kind` and `label` of each attribute kind the wire
	 * format has a row for. A platform is a session source, as a referring site
	 * is, and the service labels every session source of a channel a
	 * referring site.
	 *
	 * @since n.e.x.t
	 */
	const ROW_KINDS = array(
		'LANDING_PAGE'   => array( 'TARGET_PAGE', 'Target page' ),
		'SEARCH_KEYWORD' => array( 'SOURCE_TYPE', 'Search keyword' ),
		'REFERRING_SITE' => array( 'SOURCE_TYPE', 'Referring site' ),
		'PLATFORM'       => array( 'SOURCE_TYPE', 'Referring site' ),
		'CAMPAIGN'       => array( 'SOURCE_TYPE', 'Campaign' ),
		'DEVICE'         => array( 'READER_DEVICE', 'Reader device' ),
		'USER_TYPE'      => array( 'VISITOR_TYPE', 'Visitor type' ),
	);

	/**
	 * The visits of the selected period and of the period before it, as
	 * `current` and `previous`.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	private $visits;

	/**
	 * The visits of every channel, each with `label`, `current` and `previous`.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	private $channels;

	/**
	 * The larger of the site's search clicks in the two periods, or `0` without
	 * them.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $search_clicks_total;

	/**
	 * The visits of the previous period that the cards' changes add up from.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $opening = 0;

	/**
	 * The visits of the selected period that the cards' changes add up to.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $closing = 0;

	/**
	 * The rate the site's visits changed at, from `$opening` to `$closing`.
	 *
	 * @since n.e.x.t
	 * @var float
	 */
	private $site_rate = 0.0;

	/**
	 * The larger of `$opening` and `$closing`, or `1` when neither is positive,
	 * which the excess changes are measured against.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $denominator = 1;

	/**
	 * The sum of every channel's rise in visits.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $gain = 0;

	/**
	 * The sum of every channel's fall in visits, as a positive number.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $loss = 0;

	/**
	 * Constructor.
	 *
	 * The cards' changes add up from the channels' visits in the previous
	 * period to their visits in the selected period, since every visit has one
	 * channel. When the channels count fewer visits in the previous period than
	 * the site, as when a report cut some of them off, the site's totals are
	 * used, and the visits no channel counts are part of the residual.
	 *
	 * @since n.e.x.t
	 *
	 * @param array      $visits        The visits of the selected period and of the period before it, as `current` and `previous`.
	 * @param array      $channels      The visits of every channel, each with `label`, `current` and `previous`.
	 * @param array|null $search_clicks Optional. The site's search clicks in each period, as `current` and `previous`, or null without them. Default null.
	 */
	public function __construct( array $visits, array $channels, $search_clicks = null ) {
		$this->visits = array(
			'current'  => (int) $visits['current'],
			'previous' => (int) $visits['previous'],
		);

		$this->channels = array_map(
			fn( $channel ) => array(
				'label'    => (string) $channel['label'],
				'current'  => (int) $channel['current'],
				'previous' => (int) $channel['previous'],
			),
			array_values( $channels )
		);

		$this->search_clicks_total = is_array( $search_clicks )
			? max( (int) $search_clicks['current'], (int) $search_clicks['previous'] )
			: 0;

		$channel_current  = array_sum( array_column( $this->channels, 'current' ) );
		$channel_previous = array_sum( array_column( $this->channels, 'previous' ) );

		if ( $channel_previous >= $this->visits['previous'] || ( 0 === $this->visits['current'] && 0 === $this->visits['previous'] ) ) {
			$this->opening = $channel_previous;
			$this->closing = $channel_current;
		} else {
			$this->opening = $this->visits['previous'];
			$this->closing = $this->visits['current'];
		}

		$this->site_rate   = $this->opening > 0 ? ( $this->closing - $this->opening ) / $this->opening : 0.0;
		$this->denominator = max( $this->opening, $this->closing, 0 ) ?: 1;

		foreach ( $this->channels as $channel ) {
			$delta = $channel['current'] - $channel['previous'];

			if ( $delta > 0 ) {
				$this->gain += $delta;
			} else {
				$this->loss -= $delta;
			}
		}
	}

	/**
	 * Builds the decomposition of the given key factor cards.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $key_factors The key factor cards, as `Key_Factors::build()` returns them, in the order the panel shows them.
	 * @return array|null The decomposition, with `opening_sessions`, `closing_sessions`, `residual_delta`, `shape` and `key_factors`, the cards in the panel's order. Null when there are no channels, since the cards' changes then add up to nothing.
	 */
	public function build( array $key_factors ) {
		if ( empty( $this->channels ) ) {
			return null;
		}

		$period_direction  = $this->get_period_direction();
		$primary_direction = $this->get_primary_direction( $period_direction );
		$cards             = array();

		foreach ( $key_factors as $key_factor ) {
			$card = $this->build_card( $key_factor, $period_direction, $primary_direction );

			if ( null !== $card ) {
				$cards[] = $card;
			}
		}

		$shape = $this->get_shape( $period_direction, $primary_direction );

		// The service names at least two primary cards for a diffuse change,
		// so a diffuse change with fewer reads as a concentrated one.
		if ( 'DIFFUSE' === $shape && count( wp_list_filter( $cards, array( 'role' => 'PRIMARY' ) ) ) < 2 ) {
			$shape = 'CONCENTRATED';
		}

		return array(
			'opening_sessions' => $this->opening,
			'closing_sessions' => $this->closing,
			'residual_delta'   => $this->closing - $this->opening - array_sum( array_column( $cards, 'delta' ) ),
			'shape'            => $shape,
			'key_factors'      => $cards,
		);
	}

	/**
	 * Gets the direction of the site's visits: `UP` or `DOWN` when they changed
	 * by more than `NOTABLE_CHANGE_PERCENT`, `STABLE` otherwise.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The direction.
	 */
	private function get_period_direction() {
		if ( 0 === $this->visits['previous'] ) {
			return $this->visits['current'] > 0 ? 'UP' : 'STABLE';
		}

		$change_percent = self::round1( ( $this->visits['current'] - $this->visits['previous'] ) / $this->visits['previous'] * 100 );

		if ( $change_percent > self::NOTABLE_CHANGE_PERCENT ) {
			return 'UP';
		}

		return $change_percent < -self::NOTABLE_CHANGE_PERCENT ? 'DOWN' : 'STABLE';
	}

	/**
	 * Gets the direction a card must move in to be a primary card rather than
	 * an offsetting one.
	 *
	 * It is the period's own direction when the period rose or dropped. On a
	 * steady period, it is the direction of the channel that moved most, so
	 * that channel is primary. Channels that moved as much in both directions
	 * take the direction with more movement over every channel, and a rise
	 * when that is a tie too.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $period_direction The period's direction.
	 * @return string `UP` or `DOWN`.
	 */
	private function get_primary_direction( $period_direction ) {
		if ( 'STABLE' !== $period_direction ) {
			return $period_direction;
		}

		$largest_change = max( array_map( fn( $channel ) => abs( $channel['current'] - $channel['previous'] ), $this->channels ) );
		$has_rise       = false;
		$has_fall       = false;

		foreach ( $this->channels as $channel ) {
			$delta = $channel['current'] - $channel['previous'];

			if ( 0 !== $delta && abs( $delta ) === $largest_change ) {
				$has_rise = $has_rise || $delta > 0;
				$has_fall = $has_fall || $delta < 0;
			}
		}

		if ( $has_rise !== $has_fall ) {
			return $has_rise ? 'UP' : 'DOWN';
		}

		return $this->loss > $this->gain ? 'DOWN' : 'UP';
	}

	/**
	 * Gets the shape of the period's change, from its channels.
	 *
	 * A rise or a drop is `CONCENTRATED` when the channel that moved most in
	 * the period's direction carries at least `CONCENTRATED_SHARE` of the
	 * movement in that direction, and `DIFFUSE` otherwise. A steady period is
	 * `OFFSETTING` when a channel's excess change reaches
	 * `OFFSETTING_EXCESS_PERCENT`, so channels moved against each other, and
	 * `STEADY` otherwise.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $period_direction  The period's direction.
	 * @param string $primary_direction The direction of a primary card.
	 * @return string The shape.
	 */
	private function get_shape( $period_direction, $primary_direction ) {
		if ( 'STABLE' === $period_direction ) {
			foreach ( $this->channels as $channel ) {
				$excess = $this->get_excess( $channel['current'] - $channel['previous'], $channel['previous'] );

				if ( abs( $excess ) / $this->denominator * 100 >= self::OFFSETTING_EXCESS_PERCENT ) {
					return 'OFFSETTING';
				}
			}

			return 'STEADY';
		}

		$pool           = 0;
		$largest_change = 0;

		foreach ( $this->channels as $channel ) {
			$delta = $channel['current'] - $channel['previous'];

			if ( ! $this->is_counter_move( $delta, $primary_direction ) ) {
				$pool          += abs( $delta );
				$largest_change = max( $largest_change, abs( $delta ) );
			}
		}

		return $pool > 0 && $largest_change >= self::CONCENTRATED_SHARE * $pool ? 'CONCENTRATED' : 'DIFFUSE';
	}

	/**
	 * Builds the card of a key factor.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $key_factor        The key factor card, as `Key_Factors::build()` returns it.
	 * @param string $period_direction  The period's direction.
	 * @param string $primary_direction The direction of a primary card.
	 * @return array|null The card, or null when the wire format has no card for the key factor.
	 */
	private function build_card( array $key_factor, $period_direction, $primary_direction ) {
		if ( ! isset( self::CARD_KINDS[ $key_factor['kind'] ] ) ) {
			return null;
		}

		if ( 'CONTENT' === $key_factor['kind'] && Insight_Request_Builder::is_home_page( $key_factor['label'] ) ) {
			return null;
		}

		list( $dimension, $entity_kind ) = self::CARD_KINDS[ $key_factor['kind'] ];

		$current  = (int) $key_factor['current'];
		$previous = (int) $key_factor['previous'];
		$delta    = $current - $previous;
		$excess   = $this->get_excess( $delta, $previous );
		$role     = $this->is_counter_move( $delta, $primary_direction ) ? 'OFFSET' : 'PRIMARY';

		$card = array(
			'dimension'   => $dimension,
			'entity_kind' => $entity_kind,
			'title'       => $key_factor['label'],
			'volume'      => $current,
			'delta'       => $delta,
		);

		// The service reads a missing `excess`, `outsized` or `is_large_share`
		// as `0` or false.
		if ( 0.0 !== self::round1( $excess ) ) {
			$card['excess'] = self::round1( $excess );
		}

		if ( $this->is_outsized( $delta, $excess ) ) {
			$card['outsized'] = true;
		}

		if ( $this->gain + $this->loss > 0 && abs( $delta ) >= self::LARGE_SHARE * ( $this->gain + $this->loss ) ) {
			$card['is_large_share'] = true;
		}

		$card['direction'] = self::get_direction( $delta );

		list( $share_basis, $share_percent ) = 'OFFSET' === $role
			? $this->get_offset_share( $delta, $period_direction )
			: $this->get_primary_share( $delta );

		$card['traffic_impact_pct'] = $share_percent;
		$card['metric_type']        = 'DELTA';
		$card['share_basis']        = $share_basis;
		$card['role']               = $role;
		$card['attributes']         = array_values(
			array_filter(
				array_map(
					fn( $attribute ) => $this->build_row( $attribute, $delta ),
					isset( $key_factor['attributes'] ) ? $key_factor['attributes'] : array()
				)
			)
		);

		return $card;
	}

	/**
	 * Builds the row of a card's attribute.
	 *
	 * A search keyword row counts clicks, which are no part of the card's
	 * visits, so it is context, with its change as a share of the site's search
	 * clicks. Any other row moving with its card, and no larger than it, has
	 * its share of the card's change, and is a part of it from
	 * `DECOMPOSITION_ROW_SHARE_PERCENT`. A row larger than its card is context,
	 * with no share, since it never carries more than all of the card's change.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $attribute  The attribute, with `kind`, `label`, `current` and `previous`.
	 * @param int   $card_delta The card's change.
	 * @return array|null The row, or null when the wire format has no row for the attribute, or the attribute didn't change.
	 */
	private function build_row( array $attribute, $card_delta ) {
		$delta = (int) $attribute['current'] - (int) $attribute['previous'];

		if ( ! isset( self::ROW_KINDS[ $attribute['kind'] ] ) || 0 === $delta ) {
			return null;
		}

		list( $kind, $label ) = self::ROW_KINDS[ $attribute['kind'] ];

		if ( 'SEARCH_KEYWORD' === $attribute['kind'] ) {
			$row = array(
				'kind'         => $kind,
				'role'         => 'CONTEXT',
				'label'        => $label,
				'value'        => array( 'text' => $attribute['label'] ),
				'entity_delta' => $delta,
			);

			$share_percent = $this->search_clicks_total > 0
				? min( 100.0, self::round1( abs( $delta ) / $this->search_clicks_total * 100 ) )
				: 0.0;

			if ( $share_percent > 0 ) {
				$row['share_of_search_clicks_pct'] = $share_percent;
			}

			return $row;
		}

		$row = array(
			'kind'  => $kind,
			'role'  => 'CONTEXT',
			'label' => $label,
		);

		// The home page row names no page, since its address tells the reader
		// nothing.
		if ( 'LANDING_PAGE' === $attribute['kind'] && Insight_Request_Builder::is_home_page( $attribute['label'] ) ) {
			$row['kind']  = 'HOMEPAGE';
			$row['label'] = 'Homepage';
		} else {
			$row['value'] = array( 'text' => $attribute['label'] );
		}

		if ( $delta * $card_delta > 0 && abs( $delta ) <= abs( $card_delta ) ) {
			$share_percent = self::round1( abs( $delta ) / abs( $card_delta ) * 100 );

			if ( $share_percent >= self::DECOMPOSITION_ROW_SHARE_PERCENT ) {
				$row['role'] = 'DECOMPOSITION';
			}

			if ( $share_percent > 0 ) {
				$row['share_of_parent_change_pct'] = $share_percent;
			}
		}

		$row['entity_delta'] = $delta;

		return $row;
	}

	/**
	 * Gets the share of a primary card: its change as a share of the movement
	 * in its own direction, or of the site's traffic when that movement can't
	 * hold it.
	 *
	 * The movement in the site's own direction doesn't count when it is under
	 * `MINIMUM_POOL_SHARE` of the site's net change, which happens when the
	 * channels count fewer visits than the site.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $delta The card's change.
	 * @return array The share basis, `GROSS_CHANGE` or `SITE_TRAFFIC`, and the share in percent.
	 */
	private function get_primary_share( $delta ) {
		$total_delta = $this->closing - $this->opening;
		$gain        = $this->gain;
		$loss        = $this->loss;

		if ( $total_delta > 0 && $gain < self::MINIMUM_POOL_SHARE * $total_delta ) {
			$gain = 0;
		} elseif ( $total_delta < 0 && $loss < self::MINIMUM_POOL_SHARE * abs( $total_delta ) ) {
			$loss = 0;
		}

		$pool = 0;

		if ( $delta > 0 ) {
			$pool = $gain;
		} elseif ( $delta < 0 ) {
			$pool = $loss;
		}

		if ( $pool > 0 && self::round1( abs( $delta ) / $pool * 100 ) <= 100 ) {
			return array( 'GROSS_CHANGE', self::round1( abs( $delta ) / $pool * 100 ) );
		}

		return array( 'SITE_TRAFFIC', self::round1( $delta / $this->denominator * 100 ) );
	}

	/**
	 * Gets the share of an offsetting card: how much of the site's net change
	 * it offset.
	 *
	 * The share is `0` on a steady period, and when it would reach
	 * `NET_CHANGE_SHARE_LIMIT_PERCENT`, so it never reads as all of the
	 * change.
	 *
	 * @since n.e.x.t
	 *
	 * @param int    $delta            The card's change.
	 * @param string $period_direction The period's direction.
	 * @return array The share basis, `NET_CHANGE`, and the share in percent.
	 */
	private function get_offset_share( $delta, $period_direction ) {
		$total_delta = $this->closing - $this->opening;

		if ( 'STABLE' === $period_direction || 0 === $total_delta ) {
			return array( 'NET_CHANGE', 0.0 );
		}

		$share_percent = self::round1( abs( $delta ) / abs( $total_delta ) * 100 );

		return array( 'NET_CHANGE', $share_percent < self::NET_CHANGE_SHARE_LIMIT_PERCENT ? $share_percent : 0.0 );
	}

	/**
	 * Gets a change beyond the one the site's own rate gives.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $delta    The change.
	 * @param int $previous The visits of the previous period.
	 * @return float The excess change.
	 */
	private function get_excess( $delta, $previous ) {
		return $delta - $previous * $this->site_rate;
	}

	/**
	 * Checks whether a card's change is far beyond the site's own rate.
	 *
	 * @since n.e.x.t
	 *
	 * @param int   $delta  The card's change.
	 * @param float $excess The card's excess change.
	 * @return bool True when the card moved the same way as its excess, by at least `OUTSIZED_EXCESS_PERCENT` of the larger period total and `OUTSIZED_EXCESS_SHARE` of its own change.
	 */
	private function is_outsized( $delta, $excess ) {
		return 0 !== $delta
			&& $delta * $excess > 0
			&& abs( $excess ) / $this->denominator * 100 >= self::OUTSIZED_EXCESS_PERCENT
			&& abs( $excess ) >= self::OUTSIZED_EXCESS_SHARE * abs( $delta );
	}

	/**
	 * Checks whether a change moves against the primary direction.
	 *
	 * @since n.e.x.t
	 *
	 * @param int    $delta             The change.
	 * @param string $primary_direction The direction of a primary card.
	 * @return bool True when the change moves against it.
	 */
	private function is_counter_move( $delta, $primary_direction ) {
		return 'UP' === $primary_direction ? $delta < 0 : $delta > 0;
	}

	/**
	 * Gets the direction of a change.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $delta The change.
	 * @return string `UP`, `DOWN`, or `STABLE` for no change.
	 */
	private static function get_direction( $delta ) {
		if ( 0 === $delta ) {
			return 'STABLE';
		}

		return $delta > 0 ? 'UP' : 'DOWN';
	}

	/**
	 * Rounds a number to one decimal place, half away from zero, without a
	 * negative zero, as the service rounds.
	 *
	 * @since n.e.x.t
	 *
	 * @param float $value The number.
	 * @return float The rounded number.
	 */
	private static function round1( $value ) {
		$rounded = round( $value, 1 );

		// `-0.0` equals `0.0`, so this returns a positive zero for both.
		return 0.0 === $rounded ? 0.0 : $rounded;
	}
}
